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
 * Function for checking if application is expired
 * @param applicationId Id for the application in contract
 */
export async function checkContractDate(applicationId: number) {
    let connection;

    try {
        connection = await pool.getConnection();

        // Get the contract
        const rows = await connection.query("SELECT FIRST TimeStamp FROM Contracts " +
                 "WHERE ApplicationId = ?", [applicationId]);

        // Check the age of the contract
        let donorClaimsBytes = false;
        let chatbotClaimsBytes = false;
        rows.forEach(contract => {
            const timestamp = new Date(contract).getTime();
            donorClaimsBytes = Date.now() < timestamp + 1000 * 60 * 60 * 24 * 30 * 1; //1 month
            chatbotClaimsBytes = Date.now() < timestamp + 1000 * 60 * 60 * 24 * 30 * 3; // 3 months
        });

        if (chatbotClaimsBytes) {
            // Send shit to let chatbot know it can claim bytes
        }

        if (donorClaimsBytes) {
            // Send shit to let chatbot know donor can claim bytes
        }
    } catch (err) {
        console.log(err);
    } finally {
        // End the process after the job finishes
        if (connection) {
            connection.end();
        }
    }
}
