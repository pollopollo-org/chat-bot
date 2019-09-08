"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storeContract_1 = require("./storeContract");
const mariadb = require("mariadb");
const dbData = require("../../dbData");
const pool = mariadb.createPool({
    host: dbData.host,
    user: dbData.user,
    password: dbData.password,
    database: dbData.database,
    connectionLimit: 5
});
async function getContractBySharedAddress(sharedAddress) {
    let connection;
    try {
        connection = await pool.getConnection();
        await storeContract_1.createContractsTable(connection);
        const rows = await connection.query("SELECT * FROM Contracts WHERE SharedAddress = ?", [sharedAddress || "null"]);
        if (rows && rows.length > 0) {
            return rows[0];
        }
    }
    catch (err) {
        console.error(err);
    }
    finally {
        connection.close();
    }
}
exports.getContractBySharedAddress = getContractBySharedAddress;
async function getContractByApplicationId(applicationId) {
    let connection;
    try {
        connection = await pool.getConnection();
        await storeContract_1.createContractsTable(connection);
        const rows = await connection.query("SELECT * FROM Contracts WHERE ApplicationId = ?", [applicationId || -1]);
        if (rows && rows.length > 0) {
            return rows[0];
        }
    }
    catch (err) {
        console.error(err);
    }
    finally {
        connection.close();
    }
}
exports.getContractByApplicationId = getContractByApplicationId;
async function getContractByConfirmKey(confirmKey) {
    let connection;
    try {
        connection = await pool.getConnection();
        await storeContract_1.createContractsTable(connection);
        const rows = await connection.query("SELECT * FROM Contracts WHERE ConfirmKey = ?", [confirmKey || "null"]);
        if (rows && rows.length > 0) {
            return rows[0];
        }
    }
    catch (err) {
        console.error(err);
    }
    finally {
        connection.close();
    }
}
exports.getContractByConfirmKey = getContractByConfirmKey;
//# sourceMappingURL=getContract.js.map