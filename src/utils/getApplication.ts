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
 * Retrieves a product stored in our local database based on an Id
 */
// tslint:disable-next-line: export-name
export async function getApplicationById(id: string) {
    let connection;

    try {
        connection = await pool.getConnection();

        const rows = await connection.query("SELECT * FROM Applications WHERE Id =?",
                                            [id || -1]);

        if (rows && rows.length > 0) {
            return rows[0];
        }
    } catch (err) {
        console.error(err);
    } finally {
        connection.close();
    }
}
