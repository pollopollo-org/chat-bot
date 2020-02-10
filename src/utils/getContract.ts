import { logEvent, LoggableEvents } from "./logEvent";
import { createContractsTable } from "./storeContract";

const mariadb = require("mariadb");
const dbData = require("../../dbData");

const pool = mariadb.createPool({
    host: dbData.host,
    user: dbData.user,
    password: dbData.password,
    database: dbData.database,
    connectionLimit: 5
});

/**
 * Retrieves a contract stored in our local database based on a Shared Address
 */
export async function getContractBySharedAddress(sharedAddress: string) {
    let connection;

    try {
        connection = await pool.getConnection();
        await createContractsTable(connection);

        const rows = await connection.query("SELECT * FROM Contracts WHERE SharedAddress = ?", [sharedAddress || "null"]);

        if (rows && rows.length > 0) {
            return rows[0];
        }
    } catch (err) {
        logEvent(LoggableEvents.UNKNOWN, { error: err });
    } finally {
        connection.close();
    }
}

/**
 * Retrieves a contract stored in our local database based on a applicationId
 */
export async function getContractByApplicationId(applicationId: string) {
    let connection;

    try {
        connection = await pool.getConnection();
        await createContractsTable(connection);

        const rows = await connection.query("SELECT * FROM Contracts WHERE ApplicationId = ?", [applicationId || -1]);

        if (rows && rows.length > 0) {
            return rows[0];
        }
    } catch (err) {
        console.error(err);
    } finally {
        connection.close();
    }
}

/**
 * Retrieves a contract stored in our local database based on a applicationId
 */
export async function getContractByConfirmKey(confirmKey: string) {
    let connection;

    try {
        connection = await pool.getConnection();
        await createContractsTable(connection);

        const rows = await connection.query("SELECT * FROM Contracts WHERE ConfirmKey = ?", [confirmKey || "null"]);

        if (rows && rows.length > 0) {
            return rows[0];
        }
    } catch (err) {
        console.error(err);
    } finally {
        connection.close();
    }
}
