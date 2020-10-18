import { connect } from "http2";
import { state } from "../state";
import { getContractByApplicationId, getContractBySharedAddress } from "./getContract";
import { logEvent, LoggableEvents } from "./logEvent";
import { Participant } from "./offerContract";

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

    logEvent(LoggableEvents.UNKNOWN, { error: `Withdrawal requested for Application ${applicationId}`});

    // First retrieve the contract details based on applicationId
    const contract = await getContractByApplicationId(applicationId);

    if (!contract) {
        logEvent(LoggableEvents.UNKNOWN, { error: `Application with ID ${applicationId} not found!`});
    } else {
        logEvent(LoggableEvents.UNKNOWN, { error: `Received request to withdraw Bytes from Application with ID ${applicationId}`});
        await state.wallet.sendAllBytesFromAddress(
            contract.SharedAddress,
            recipient.walletAddress,
            recipient.deviceAddress,
            async (err, unit) => {
                if (err) {
                    logEvent(LoggableEvents.UNKNOWN, { error: `Error trying to send all Bytes from sharedAddress ${contract.SharedAddress} to user with wallet address: ${recipient.walletAddress}: ${err}`});
                } else {

                    logEvent(LoggableEvents.UNKNOWN, { error: `Withdraw successful - Payment can be found in this unit: ${unit}`});
                    await setBytesToZero(applicationId);
                    logEvent(LoggableEvents.UNKNOWN, {error: `Withdrawal for application ${applicationId} completed`});

                    return (unit);
                }
            });
    }
}

/**
 * TODO: Casper, please comment :)
 */
export async function withdrawToPolloPollo(sharedAddress: string) {

    logEvent(LoggableEvents.UNKNOWN, { error: `Withdrawal to PolloPollo initiated for shared address ${sharedAddress}`});

    // Retrieve application to make sure there is one
    const contract = await getContractBySharedAddress(sharedAddress);
    if (!contract) {
        logEvent(LoggableEvents.UNKNOWN, { error: `Contract for shared address ${sharedAddress} could not be found`});
    } else {
        logEvent(LoggableEvents.UNKNOWN, { error: "Found contract. Will try to withdraw to PolloPollo Management"});
        /* The wallet address and device address below is the PolloPollo "management" address.
           If a donor requested the withdrawal of funds after 3 months and cannot withdraw on his own because the Applicant confirmed,
           PolloPollo can make the withdrawal (the safety mechanism to prevent loss of bytes)
           If a user requested the withdrawal, they will be sent to that address and if not, it will be sent to the public PolloPollo
           donation wallet to be used for other donations.
        */
        await state.wallet.sendAllBytesFromAddress(
            contract.SharedAddress,
            "FWEZQDWNKABOEENRENJDYIIWMCUGYU3R",
            "0QZMFST5OJ4YS53Z2LMLHW2PVQUI4ZHS3",
            async (err, unit) => {
            if (err) {
                logEvent(LoggableEvents.UNKNOWN, { error: `Error trying to send all Bytes from shared address ${sharedAddress} to management: ${err}`});
            } else {
                logEvent(LoggableEvents.UNKNOWN, { error: `Withdraw successful - Payment sent to PolloPollo management in unit ${unit}`});
                await setBytesToZero(contract.applicationId);
                logEvent(LoggableEvents.UNKNOWN, {error: `Withdrawal for application ${contract.applicationId} completed`});

                return (unit);
            }
        });
    }
}

/**
 * TODO: Casper, please comment :)
 */
async function setBytesToZero(applicationId: string) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query("UPDATE Contracts SET Bytes = 0 WHERE applicationId = ?", [applicationId]);
    } catch (err) {
        logEvent(LoggableEvents.UNKNOWN, {error: "Failed to update the Contract to have 0 Bytes"});
    } finally {
        if (connection) {
            connection.end();
        }
    }
}
