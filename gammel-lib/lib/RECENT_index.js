"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cron = require("node-cron");
const db = require("ocore/db");
const device = require("ocore/device.js");
const eventBus = require("ocore/event_bus.js");
const wallet = require("ocore/wallet.js");
const validationUtils = require("ocore/validation_utils.js");
require("./listener");
const requests_1 = require("./requests/requests");
const getCounts_1 = require("./requests/getCounts");
const state_1 = require("./state");
const caches_1 = require("./utils/caches");
const getContract_1 = require("./utils/getContract");
const logEvent_1 = require("./utils/logEvent");
const offerContract_1 = require("./utils/offerContract");
const publishTimestamp_1 = require("./utils/publishTimestamp");
const storeContract_1 = require("./utils/storeContract");
const mariadb = require("mariadb");
const dbData = require("../dbData");
const pool = mariadb.createPool({
    host: dbData.host,
    user: dbData.user,
    password: dbData.password,
    database: dbData.database,
    connectionLimit: 5
});
eventBus.once("headless_wallet_ready", () => {
    cron.schedule("* 0 * * *", publishTimestamp_1.publishTimestamp);
    state_1.state.wallet.setupChatEventHandlers();
    publishTimestamp_1.publishTimestamp()
        .catch(err => { console.error(err); });
});
eventBus.once("paired", async (fromAddress, pairingSecret) => {
    const asInt = parseInt(pairingSecret, undefined);
    if (Number.isNaN(asInt) || `${asInt}`.length !== pairingSecret.length) {
        caches_1.pairingCache.set(fromAddress, pairingSecret);
        device.sendMessageToDevice(fromAddress, "text", "Your device has now been paired with your PolloPollo account, and now " +
            "we just need your wallet address to finish the authentication.");
    }
    else {
        caches_1.donorCache.set(pairingSecret, fromAddress);
        caches_1.applicationCache.set(fromAddress, pairingSecret);
        device.sendMessageToDevice(fromAddress, "text", "Your device has now been paired and is ready to finalize the donation. All we need " +
            `now is your wallet address to issue a donation contract.`);
    }
    device.sendMessageToDevice(fromAddress, "text", "Please insert your wallet address by clicking (···) and choose " +
        "'Insert my address'. Make sure to use a single address wallet.");
});
eventBus.once("text", async (fromAddress, message) => {
    const parsedText = message.toLowerCase();
    const walletAddress = message
        .trim()
        .toUpperCase();
    if (validationUtils.isValidAddress(walletAddress)) {
        if (!caches_1.pairingCache.has(fromAddress)) {
            const applicationId = caches_1.applicationCache.get(fromAddress);
            if (!applicationId) {
                logEvent_1.logEvent(logEvent_1.LoggableEvents.UNKNOWN, { error: "Failed to retrieve either applicationId or pairingSecret from cache." });
                device.sendMessageToDevice(fromAddress, "text", "Somehow we lost your device address in the registration process. " +
                    "Please go back to PolloPollo.org and try again.");
                return;
            }
            caches_1.applicationCache.delete(fromAddress);
            logEvent_1.logEvent(logEvent_1.LoggableEvents.REGISTERED_USER, { wallet: walletAddress, device: fromAddress, pairingSecret: applicationId });
            const contractData = await requests_1.getContractData(applicationId, fromAddress);
            if (contractData) {
                offerContract_1.offerContract({ walletAddress: walletAddress, deviceAddress: fromAddress }, { walletAddress: contractData.producerWallet, deviceAddress: contractData.producerDevice }, contractData.price, applicationId);
            }
        }
        else {
            const pairingSecret = caches_1.pairingCache.get(fromAddress);
            caches_1.pairingCache.delete(fromAddress);
            await requests_1.setProducerInformation(pairingSecret, walletAddress, fromAddress);
        }
        return;
    }
    switch (parsedText) {
        case "producers":
            await getCounts_1.returnAmountOfProducers(fromAddress);
            break;
        case "products":
            await getCounts_1.returnAmountOfProducts(fromAddress);
            break;
        case "receivers":
            await getCounts_1.returnAmountOfReceivers(fromAddress);
            break;
        default:
            device.sendMessageToDevice(fromAddress, "text", "Your message was not understood. Please insert your wallet address by clicking (···) and chose " +
                "'Insert my address'. Make sure to use a single address wallet.");
    }
});
eventBus.once("new_my_transactions", async (arrUnits) => {
    arrUnits.forEach((unit) => {
        db.query("SELECT * FROM data_feeds WHERE unit = ?", [unit], (rows) => {
            rows.forEach(async (row) => {
                const contract = await getContract_1.getContractByConfirmKey(row.feed_name);
                let connection;
                let product;
                try {
                    connection = await pool.getConnection();
                    product = await connection.query("SELECT p.Title FROM Applications a JOIN Products p " +
                        "ON a.ProductId = p.Id WHERE a.Id = ?", [contract.ApplicationId]);
                }
                catch (err) {
                    console.log(err);
                }
                finally {
                    if (connection) {
                        connection.end();
                    }
                }
                if (contract) {
                    device.sendMessageToDevice(contract.ProducerDevice, "text", `The Receiver of ${product} has confirmed reception. Another message will notify you when you ` +
                        `can extract the payment from the contract starting with ${contract.SharedAddress.substring(0, 4)}.`);
                }
            });
        });
        db.query("SELECT address FROM outputs WHERE unit = ?", [unit], (rows => {
            rows.forEach(async (row) => {
                const contract = await getContract_1.getContractBySharedAddress(row.address);
                if (contract && contract.Completed !== 1) {
                    device.sendMessageToDevice(contract.DonorDevice, "text", `Your donation of ${contract.Price}$ has now been submitted. ` +
                        "You will receive a message once the donation has been fully processed.");
                }
            });
        }));
    });
});
eventBus.once("my_transactions_became_stable", async (arrUnits) => {
    arrUnits.forEach((unit) => {
        db.query("SELECT * FROM data_feeds WHERE unit = ?", [unit], (rows) => {
            rows.forEach(async (row) => {
                const contract = await getContract_1.getContractByConfirmKey(row.feed_name);
                let connection;
                let product;
                try {
                    connection = await pool.getConnection();
                    product = await connection.query("SELECT p.Title FROM Applications a JOIN Products p " +
                        "ON a.ProductId = p.Id WHERE a.Id = ?", [contract.ApplicationId]);
                }
                catch (err) {
                    console.log(err);
                }
                finally {
                    if (connection) {
                        connection.end();
                    }
                }
                if (contract) {
                    device.sendMessageToDevice(contract.ProducerDevice, "text", `The confirmation of reception of ${product} is now final and you can withdraw the donated funds` +
                        ` from smart wallet starting with ${contract.SharedAddress.substring(0, 4)} - to withdraw funds, ` +
                        `switch to this contract and use the Send-button to send the funds (${contract.Price}USD) to your main wallet.`);
                }
            });
        });
        db.query("SELECT address FROM outputs WHERE unit = ?", [unit], (rows => {
            rows.forEach(async (row) => {
                const contract = await getContract_1.getContractBySharedAddress(row.address);
                if (contract) {
                    await storeContract_1.completeContract(contract.ApplicationId);
                    await requests_1.updateApplicationStatus(contract.ApplicationId, requests_1.ApplicationStatus.PENDING);
                    device.sendMessageToDevice(contract.DonorDevice, "text", "Your donation has now been processed. Thank you for your contribution!");
                }
            });
        }));
    });
});
//# sourceMappingURL=index.js.map
