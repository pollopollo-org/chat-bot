const mariadb = require("mariadb");
const dbData = require("../../dbData");

const sqlite = require("sqlite3").verbose();

const fs = require("fs");
const path = require("path");
const lockfile = require("proper-lockfile");
const util = require("util");
const exists = util.promisify(fs.exists);
const appendFile = util.promisify(fs.appendFile);
const createFile = util.promisify(fs.writeFile);

const pool = mariadb.createPool({
    host: dbData.host,
    user: dbData.user,
    password: dbData.password,
    database: dbData.database,
    connectionLimit: 5
});

const obyte = new sqlite.Database("../../.config/chat-bot/byteball.sqlite", sqlite.OPEN_READONLY, (err) => {
    if (err) {
        console.log()
    }
});

const logFile = path.resolve("/home/pollopollo/.pollo_log");

/**
 * Cron that is responsible for resetting all applicaitons that have been in the
 * "Locked" state for more than an hour since we at that point assume that the
 * donation has failed.
 */
export async function handleStaleApplications() {

    try {
        let conn = await pool.getConnection();

        // Start by retrieving all locked applicaitons
        const rows = await conn.query("SELECT * FROM Applications WHERE Status = 1");

        // And then go through all applications and determine whether or not
        // they've went stale.
        for (let i = 0; i < rows.length; i++) {
            const application = rows[i];
            const lastModified = new Date(application.LastModified).getTime();
            const isStale = Date.now() - (1000 * 60 * 60) > lastModified;
            if (isStale) {
                await conn.query("UPDATE Applications SET Status = 0, LastModified = NOW() WHERE Id = ?", [application.Id]);
                
                const contract = conn.query("SELECT * FROM Contracts where ApplicationId = ?", [application.Id]);

                let logContract = `[${new Date().toUTCString()} - FOUND_STALE_CONTRACT] for application with id '${application.Id}' ` +
                                    `with Completed '${contract.Completed}' and confirm_key '${contract.ConfirmKey}'`;

                if (await exists(logFile)) {
                    const release = await lockfile.lock(logFile);
                    await appendFile(logFile, `\n\n${logContract}`);
                    await release();
                } else {
                    await createFile(logFile, logContract);
                }

                await conn.query("DELETE FROM Contracts where ApplicationId = ?", [application.Id]);

                let message = `[${new Date().toUTCString()} - FOUND_STALE_APPLICATION] More than an hour has passed since `;
                message += `creation of contract to application with id '${application.Id}'. Reverting application to Open`;

                if (await exists(logFile)) {
                    const release = await lockfile.lock(logFile);
                    await appendFile(logFile, `\n\n${message}`);
                    await release();
                } else {
                    await createFile(logFile, message);
                } 
            }
        }
        if (conn) {
            conn.end();
        }
    } catch (err) {
        throw err;
    } 
}

/*
 * Get the balance of a wallet address
 */
async function getbalance(sharedWallet) {
    return new Promise(function(resolve, reject) {
            obyte.get("select sum(amount) as amount from outputs where is_spent=0 and asset is null and address = ?", sharedWallet, (err, row) => {
                    if (err) reject(err.message);
                    else resolve(row.amount);
            });
    });
}


/*
 * Update Contract and Application to reflect the change
 */
export async function updateWithdrawnDonations() {

    let conn = await pool.getConnection();
    // First - Find all pending applications
    let rows = await conn.query("SELECT a.Id, c.SharedAddress, ua.email as recipientemail, up.email as produceremail FROM Applications a left join Contracts c on a.Id = c.ApplicationId left join Users ua on a.UserId = ua.Id left join Products p on a.ProductId = p.Id left join Users up on p.UserId = up.Id WHERE a.Status=2;");

    for (let i = 0; i < rows.length; i++) {
        let walletbalance = await getbalance([rows[i].SharedAddress]); // Get wallet balance
        if (!walletbalance) { // If the balance is zero on a pending application, the donor must have withdrawn the donated funds

            // Update the contract to reflect that Bytes has been withdrawn
            await conn.query("UPDATE Contracts set Bytes = 0 where ApplicationId = ?", [rows[i].Id]);
            // Update the Application to status 5 meaning WITHDRAWN
            await conn.query("UPDATE Applications set Status = 5, LastModified = NOW() where Id = ?", [rows[i].Id]);
                
            // Log that we updated Applications and Contracts
            let message = "Donor withdrew from ApplicationId " + rows[i].Id + ". Updating Application.Status to 5 and Contract.Bytes to 0";
            if (await exists(logFile)) {
                const release = await lockfile.lock(logFile);
                await appendFile(logFile, `\n\n${message}`);
                await release();
            } else {
                await createFile(logFile, message);
            } 
        }
    };

    // Next - we clean up all Contracts where Producer withdrew funds by setting Bytes = 0
    rows = await conn.query("SELECT a.Id, c.SharedAddress, ua.email as recipientemail, up.email as produceremail FROM Applications a left join Contracts c on a.Id = c.ApplicationId left join Users ua on a.UserId = ua.Id left join Products p on a.ProductId = p.Id left join Users up on p.UserId = up.Id WHERE a.Status=3 and c.Bytes > 0;");

    for (let i = 0; i < rows.length; i++) {
        let walletbalance = await getbalance([rows[i].SharedAddress]); // Get wallet balance
        if (!walletbalance) {
            await conn.query("UPDATE Contracts set Bytes = 0 where ApplicationId = ?", [rows[i].Id]);
            // Log that we updated Contracts
            let message = "Producer withdrew from ApplicationId " + rows[i].Id + ". Updating Contracts.Bytes to 0";
            if (await exists(logFile)) {
                const release = await lockfile.lock(logFile);
                await appendFile(logFile, `\n\n${message}`);
                await release();
            } else {
                await createFile(logFile, message);
            } 
        }
    }

    if (conn) {
        conn.end();
    }
}