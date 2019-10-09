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
 * Safely creates the products table in case it doesn't exist yet.
 */
export async function createApplicationsTable(connection) {
    //Start by checking if the table is there and create if not
    await connection.query(
        `CREATE TABLE IF NOT EXISTS \n\
            Applications(\n\
                Id INT, \n\
                UserId INT, \n\
                ProductId INT, \n\
                Motivation TEXT, \n\
                LastModified DATETIME, \n\
                Status INT, \n\
                Created DATETIME, \n\
                PRIMARY KEY (Id), \n\
                `
    );
}

/**
 * Retrieves a product stored in our local database based on an Id
 */
export async function getApplicationById(id: string) {
    let connection;

    try {
        connection = await pool.getConnection();
        await createApplicationsTable(connection);

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
