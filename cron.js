const mariadb = require("mariadb");
const dbData = require("./dbData");
const sqlite3 = require("sqlite3").verbose();

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

const obyte = new sqlite3.Database("../.config/chat-bot/byteball.sqlite", sqlite3.OPEN_READONLY, (err) => {
    if (err) {
            console.log("Got error connecting to Obyte DAG: " + err.message);
    }
});


const logFile = path.resolve("/home/pollopollo/.pollo_log");

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

async function updateApplication (applicationId) {
    
    let conn = await pool.getConnection();

    // Update the contract to reflect that Bytes has been withdrawn
    await conn.query("UPDATE Contracts set Bytes = 0 where ApplicationId = ?", applicationId);
    // Update the Application to status 5 meaning WITHDRAWN
    await conn.query("UPDATE Applications set Status = 5 where ApplicationId = ?", applicationId);
}

async function findApplicationsWhereDonorWithdrew() {

    let conn = await pool.getConnection();

    // First - Find all pending applications
    const rows = await conn.query("SELECT a.Id, c.SharedAddress, ua.email as recipientemail, up.email as produceremail FROM Applications a left join Contracts c on a.Id = c.ApplicationId left join Users ua on a.UserId = ua.Id left join Products p on a.ProductId = p.Id left join Users up on p.UserId = up.Id WHERE a.Status=2;");

    for (let i = 0; i < rows.length; i++) {
            let walletbalance = await getbalance([rows[i].SharedAddress]); // Get wallet balance
            if (walletbalance == 0) { // If the balance is zero on a pending application, the donor must have withdrawn the donated funds
                    console.log([rows[i].Id] + " Updating status to 5 and Bytes count to 0.");
                    await updateApplication([rows[i].Id]);
            } else {
                    console.log([rows[i].Id] + " still has Bytes on it. Will leave it");
            }
    };
    if (conn) {
        conn.end();
    }
    if (obyte) {
            obyte.close((err) => {
                    if (err) {
                            console.log("Error while closing db handle");
                    }
            });
    }
    process.exit(0);
}

/**
 * Cron that is responsible for resetting all applicaitons that have been in the
 * "Locked" state for more than an hour since we at that point assume that the
 * donation has failed.
 */
async function findStaleApplications() {
    
    let conn;

    try {
        conn = await pool.getConnection();

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
    } catch (err) {
        throw err;
    } finally {
        // End the process after the job finishes
        if (conn) {
            conn.end();
        }

        process.exit(0);
    }
}

async function init() {
    // await findApplicationsWhereDonorWithdrew();
    await findStaleApplications();
}

// Bootstrap cron-job!
init();