const mariadb = require("mariadb");
const dbData = require("./dbData");

const pool = mariadb.createPool({
    host: dbData.host,
    user: dbData.user,
    password: dbData.password,
    database: dbData.database,
    connectionLimit: 5
});

/**
 * Function for storing the contract in our database
 * @param applicationId Id for the application in the contract
 */
export async function storeContract(applicationId: number) {
    let connection;

    try {
        connection = await pool.getConnection();

        //Start by checking if the table is there and create if not
        const table = await connection.query("CREATE TABLE IF NOT EXISTS " +
        "Contracts(ApplicationId INT REQUIRED, TimeStamp DATETIME REQUIRED)");

        //Insert the contract into DB
        const insert = await connection.query("INSERT INTO Contracts VALUES (?, ?)", [applicationId, Date.now()]);

    } catch (err) {
        console.log(err);
    } finally {
        // End the process after the job finishes
        if (connection) {
            connection.end();
        }
    }
}
