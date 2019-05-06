import { writeToDataFeed } from "./writeToDataFeed";

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
export async function checkContractDate() {
    let connection;

    try {
        connection = await pool.getConnection();

        // Get the contract
        const rows = await connection.query("SELECT * FROM Contracts WHERE completed = 0");

        // Check the age of the contract

        rows.forEach(async (contract) => {
            const applicationId = contract.ApplicationId;
            const timestamp = new Date(contract.TimeStamp).getTime();
            const donorClaimsBytes = Date.now() < timestamp + 1000 * 60 * 60 * 24 * 30 * 1; //1 month
            const chatbotClaimsBytes = Date.now() < timestamp + 1000 * 60 * 60 * 24 * 30 * 3; // 3 months

            if (donorClaimsBytes && contract.completed === 0) {
                // Let chatbot know donor can claim bytes
                const datafeed = {};
                datafeed[`${applicationId}_donorClaims`] = "true";
                writeToDataFeed(datafeed);
                await connection.query("UPDATE Contracts SET completed = 1 WHERE Id = ?", [applicationId]);
            }

            if (chatbotClaimsBytes && contract.completed < 2) {
                // Let chatbot know it can claim bytes
                const datafeed = {};
                datafeed[`${applicationId}_chatbotClaims`] = "true";
                writeToDataFeed(datafeed);
                await connection.query("UPDATE Contracts SET completed = 2 WHERE Id = ?", [applicationId]);
            }
        });
    } catch (err) {
        console.log(err);
    } finally {
        // End the process after the job finishes
        if (connection) {
            connection.end();
        }
    }
}
