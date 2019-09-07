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
export async function createProductsTable(connection) {
    //Start by checking if the table is there and create if not
    await connection.query(
        `CREATE TABLE IF NOT EXISTS \n\
            Products(\n\
                Id INT, \n\
                Title varchar(255), \n\
                UserId INT, \n\
                Price INT, \n\
                Description TEXT, \n\
                Location varchar(255), \n\
                Available BIT, \n\
                Country varchar(255), \n\
                Thumbnail LONGTEXT, \n\
                Rank INT, \n\
                Created DATETIME, \n\
                PRIMARY KEY (Id), \n\
            ) \n\
            ADD KEY (UserId)`
    );
}

/**
 * Retrieves a product stored in our local database based on an Id
 */
export async function getProductByApplicationId(applicationId: string) {
    let connection;

    try {
        connection = await pool.getConnection();
        await createProductsTable(connection);

        const rows = await connection.query("SELECT * FROM Products WHERE ProductId IN " +
                                            "(SELECT ProductId FROM Applications WHERE Id = ?)",
                                            [applicationId || -1]);

        if (rows && rows.length > 0) {
            return rows[0];
        }
    } catch (err) {
        console.error(err);
    } finally {
        connection.close();
    }
}
