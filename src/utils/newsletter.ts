const mariadb = require("mariadb");
const dbData = require("../../dbData");

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
export async function sendNewsletter() {

    logEvent(LoggableEvents.UNKNOWN, { error: "Sending newsletter to recipients." });

    let conn = await pool.getConnection();
    let PastWeekDonations = 0;
    let PastWeekSum = 0;
    let UniqueRecipients = 0;
    let OpenApplications = 0;
    let TotalCompletedDonations = 0;
    let TotalSum = 0;
    let NewsletterText = "Default text";
    let rows;

    logEvent(LoggableEvents.UNKNOWN, { error: "Collecting data for the content." });

    // Get the number of completed donations the past week
    rows = await conn.query("select count(1) from Applications where Status = 3 and LastModified between DATE_SUB(NOW(), INTERVAL 7 DAY) and NOW()");
    PastWeekDonations = rows[0].CompletedDonations;

    // Get the sum of the past week's completed donations
    rows = await conn.query("select COALESCE(sum(c.Price), 0) as SumPrice from Contracts c left join Applications a on c.ApplicationId = a.Id where a.Status = 3 and a.LastModified between DATE_SUB(NOW(), INTERVAL 7 DAY) and NOW()");    
    PastWeekSum = rows[0].SumPrice;

    // Get the number of unique recipients the past week
    rows = await conn.query("SELECT COUNT(DISTINCT(UserId)) AS UniqueRecipients FROM Applications WHERE Status = 3 and LastModified between DATE_SUB(NOW(), INTERVAL 7 DAY) and NOW()");
    UniqueRecipients = rows[0].UniqueRecipients;

    // Get the number of currently open applications
    rows = await conn.query("SELECT COUNT(1) AS OpenApplications FROM Applications WHERE STATUS=0");
    OpenApplications = rows[0].OpenApplications;

    // Get the total number of donations ever made on PolloPollo
    rows = await conn.query("SELECT COUNT(1) AS TotalCompletedDonations FROM Applications WHERE Status=3");
    TotalCompletedDonations = rows[0].TotalCompletedDonations;

    // Get the total sum of donations ever made on PolloPollo
    rows = await conn.query("SELECT SUM(Price) AS TotalSum FROM Contracts c LEFT JOIN Applications a on c.ApplicationId = a.Id WHERE a.Status=3");
    TotalSum = rows[0].TotalSum;

    logEvent(LoggableEvents.UNKNOWN, { error: "Generating the newsletter content." });

    // Generate text for the newsletter
    NewsletterText = `Sunday Digest from the PolloPollo Platform.\n` +
    `The past week, ` + PastWeekDonations + ` donations worth $` + PastWeekSum + ` have been completed and helped ` + UniqueRecipients + ` unique recipients.\n` +
    `This brings PolloPollo to a grand total of ` + TotalCompletedDonations + ` completed donations worth $` + TotalSum + ` - thanks to you and other donors.\n\n` +
    `There are currently ` + OpenApplications + ` open applications waiting for donors.` +
    `To make a donation, head over to https://pollopollo.org/applications.html\n\n` +
    `To unsubscribe from the Weekly Digest, simply click [unsubscribe](command:unsubscribe).\n` +
    `For a list of available commands, type [help](command:help)`;
    
    rows = await conn.query("SELECT * from Newsletter");
    for (let i = 0; i < rows.length; i++) {
        device.sendMessageToDevice(rows[i].DeviceAddress, "text", NewsletterText);
    }

    logEvent(LoggableEvents.UNKNOWN, { error: "Weekly newsletters successfully sent." });

    if (conn) {
            conn.end();
    }
}