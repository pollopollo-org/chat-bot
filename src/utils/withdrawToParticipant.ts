import { state } from "../state";
import { getContractByApplicationId } from "./getContract";
import { Participant } from "./offerContract";
import { logEvent, LoggableEvents } from "./logEvent";

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
 * Function allowing a participant of a SharedAddress to request the chatbot to withdraw.
 * The conditions of the smart contract need not be taken into consideration, as it will
 * result in an error that gets logged in case someone tries to withdraw from a contract
 * where the conditions aren't met (applicant didn't confirm receipt yet)
 */
export async function withdrawToParticipant(applicationId: string, recipient: Participant) {     
    
    logEvent(LoggableEvents.UNKNOWN, { error: "Withdrawal requested for Application " + applicationId});

    // First retrieve the contract details based on applicationId
    let contract = await getContractByApplicationId(applicationId);
    
    if (!contract) {
        logEvent(LoggableEvents.UNKNOWN, { error: "Application with ID " + applicationId + " not found!"});
    } else {
        await state.wallet.sendAllBytesFromAddress(contract.SharedAddress, recipient.walletAddress, recipient.deviceAddress, async (err, unit) => {
            if (err) {
                logEvent(LoggableEvents.UNKNOWN, { error: "Error trying to send all Bytes from sharedAddress " + contract.SharedAddress + " to user with wallet address: " + recipient.walletAddress + ": " + err});
            }

            logEvent(LoggableEvents.UNKNOWN, { error: "Withdraw successful - Payment can be found in this unit: " + unit});
            let connection;
            try {
                connection = await pool.getConnection();
                await connection.query("UPDATE Constracts SET Bytes = 0 WHERE applicationId = ?", [applicationId]);
                logEvent(LoggableEvents.UNKNOWN, {error: "Contract updated to show 0 Bytes"});

            } catch (err) {
                logEvent(LoggableEvents.UNKNOWN, { error: err });
            } finally {
                if (connection) {
                    connection.end();
                }
            }
            logEvent(LoggableEvents.UNKNOWN, {error: "Withdrawal for application " + applicationId + " completed"});
            return (unit);
        });
    }
}