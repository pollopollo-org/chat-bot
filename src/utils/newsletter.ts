const mariadb = require("mariadb");
const dbData = require("./dbData");

const pool = mariadb.createPool({
    host: dbData.host,
    user: dbData.user,
    password: dbData.password,
    database: dbData.database,
    connectionLimit: 5
});

import { logEvent, LoggableEvents } from "./logEvent";
import device = require("ocore/device.js");

/**
 * Method that will sign up a user to the weekly newsletter
 */
export async function subscribe(deviceAddress: string) {

    let conn = await pool.getConnection();
    await conn.query("REPLACE INTO Newsletter (DeviceAddress) values (?)", deviceAddress);
    logEvent(LoggableEvents.UNKNOWN, { error: "Device " + deviceAddress + " subscribed to the newsletter." });
    conn.end();
}

/*
* Method that will unsubscribe a user from the weekly newsletter
*/
export async function unsubscribe(deviceAddress: string) {

    let conn = await pool.getConnection();
    await conn.query("DELETE FROM Newsletter where DeviceAddress = ?", deviceAddress);
    logEvent(LoggableEvents.UNKNOWN, { error: "Device " + deviceAddress + " unsubscribed from the newsletter." });
    conn.end();
}

/*
 * Method that sends the weekly newsletter to all recipients that subscribed to it
 */
async function sendNewsletter() {

    let conn = await pool.getConnection();
    let PastWeekDonations = 0;
    let PastWeekSum = 0;
    let UniqueRecipients = 0;
    let OpenApplications = 0;
    let TotalCompletedDonations = 0;
    let TotalSum = 0;

    logEvent(LoggableEvents.UNKNOWN, { error: "Sending newsletter to recipients." });
    logEvent(LoggableEvents.UNKNOWN, { error: "Collecting data for the content." });

    // Get the number of completed donations the past week
    await conn.query("SELECT count(1) AS CompletedDonations FROM Applications WHERE Status=3 AND DateOfDonation BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW()", function (err, result) {
            if (err) throw err;
            PastWeekDonations = result[0].CompletedDonations;
          });
    
    // Get the sum of the past week's completed donations
    await conn.query("SELECT SUM(Price) AS SumPrice FROM Contracts WHERE CreationTime BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW()", function (err, result) {
            if (err) throw err;
            PastWeekSum = result[0].SumPrice;
    });

    // Get the number of unique recipients the past week
    await conn.query("SELECT COUNT(DISTINCT(UserId)) AS UniqueRecipients FROM Applications WHERE Status=3 AND DateOfDonation BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW()", function (err, result) {
            if (err) throw err;
            UniqueRecipients = result[0].UniqueRecipients;
    });

    // Get the number of currently open applications
    await conn.query("SELECT COUNT(1) AS OpenApplications FROM Applications WHERE STATUS=2", function (err, result) {
            if (err) throw err;
            OpenApplications = result[0].OpenApplications;
    });

    // Get the total number of donations ever made on PolloPollo
    await conn.query("SELECT COUNT(1) AS TotalDonations FROM Applications WHERE Status=3", function (err, result) {
            if (err) throw err;
            TotalCompletedDonations = result[0].TotalCompletedDonations;
    });

    // Get the total sum of donations ever made on PolloPollo
    await conn.query("SELECT SUM(Price) AS TotalSum FROM Contracts c LEFT JOIN Applications a on c.ApplicationId = a.Id WHERE a.Status=3", function (err, result) {
            if (err) throw err;
            TotalSum = result[0].TotalSum;
    });

    logEvent(LoggableEvents.UNKNOWN, { error: "Generating the newsletter content." });

    // Generate text for the newsletter
    let NewsletterText = `Weekly Digest from the PolloPollo Platform.\n` +
    `The past week, ` + PastWeekDonations + ` worth ` + PastWeekSum + ` USD have been completed and helped ` + UniqueRecipients + ` unique recipients.\n` +
    `This brings PolloPollo to a grand total of ` + TotalCompletedDonations + ` completed donations worth ` + TotalSum + ` USD - all thanks to you and other donors.\n\n` +
    `There are currently ` + OpenApplications + ` open applications waiting for donors.\n` +
    `To make a donation, head over to https://pollopollo.org`;

    // Generate text to allow recipients to easily unsubscribe from the newsletter
    let UnSubscribeMessage = `To unsubscribe from the Weekly Digest, simply click [unsubscribe](command:unsubscribe) here.\n` +
    `For a list of available commands, type [help](command:help)`;

    // Find recipients for the NewsLetter and send one to each of them
    logEvent(LoggableEvents.UNKNOWN, { error: "Finding recipients for the newsletter." });
    await conn.query("SELECT DISTCINT(DeviceAddress) FROM Newsletter", function (err, result) {
            if (err) throw err;
            for (var i = 0; i < result.length; i++) {
                    // Send the newsletter to the recipient
                    device.sendMessageToDevice(
                            result[i].DeviceAddress,
                            "text",
                            NewsletterText
                    );

                    // Send the unsubscribe text
                    device.sendMessageToDevice(
                            result[i].DeviceAddress,
                            "text",
                            UnSubscribeMessage
                    );

                    logEvent(LoggableEvents.UNKNOWN, { error: "Newsletter sent to device: " + result[i].DeviceAddress + "."});
            }

    });
    
    logEvent(LoggableEvents.UNKNOWN, { error: "Weekly newsletters successfully sent." });

    if (conn) {
            conn.end();
    }
}