"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mariadb = require("mariadb");
const dbData = require("../../dbData");
const pool = mariadb.createPool({
    host: dbData.host,
    user: dbData.user,
    password: dbData.password,
    database: dbData.database,
    connectionLimit: 5
});
async function createContractsTable(connection) {
    await connection.query(`CREATE TABLE IF NOT EXISTS \n\
            Contracts(\n\
                ApplicationId INT, \n\
                CreationTime DATETIME, \n\
                Completed INT, \n\
                ConfirmKey varchar(255), \n\
                SharedAddress varchar(255), \n\
                DonorWallet varchar(255), \n\
                DonorDevice varchar(255), \n\
                ProducerWallet varchar(255), \n\
                ProducerDevice varchar(255), \n\
                Price INT, \n\
                PRIMARY KEY (ApplicationId)\n\
            )`);
}
exports.createContractsTable = createContractsTable;
async function storeContract(sharedAddress, applicationId, timestamp, confirmKey, donor, producer, price) {
    let connection;
    try {
        connection = await pool.getConnection();
        await createContractsTable(connection);
        await connection.query("INSERT INTO Contracts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
            applicationId,
            timestamp
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            0,
            confirmKey,
            sharedAddress,
            donor.walletAddress,
            donor.deviceAddress,
            producer.walletAddress,
            producer.deviceAddress,
            price
        ]);
    }
    catch (err) {
        console.log(err);
    }
    finally {
        if (connection) {
            connection.end();
        }
    }
}
exports.storeContract = storeContract;
async function completeContract(applicationId) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query("UPDATE Contracts SET Completed = 1 WHERE ApplicationId = ?", [applicationId]);
    }
    catch (err) {
        console.log(err);
    }
    finally {
        if (connection) {
            connection.end();
        }
    }
}
exports.completeContract = completeContract;
//# sourceMappingURL=storeContract.js.map