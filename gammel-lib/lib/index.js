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
eventBus.on("headless_wallet_ready", () => {
    cron.schedule("* 0 * * *", publishTimestamp_1.publishTimestamp);
    state_1.state.wallet.setupChatEventHandlers();
    publishTimestamp_1.publishTimestamp()
        .catch(err => { console.error(err); });
});
eventBus.on("paired", async (fromAddress, pairingSecret) => {
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
eventBus.on("text", async (fromAddress, message) => {
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
eventBus.on("new_my_transactions", async (arrUnits) => {
    arrUnits.forEach((unit) => {
        db.query("SELECT * FROM data_feeds WHERE unit = ?", [unit], (rows) => {
            rows.forEach(async (row) => {
                const contract = await getContract_1.getContractByConfirmKey(row.feed_name);
                if (contract) {
                    device.sendMessageToDevice(contract.ProducerDevice, "text", "The Receiver of your product has confirmed reception. In around 15 minutes you will be able " +
                        "to extract your payment from the contract.");
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
eventBus.on("my_transactions_became_stable", async (arrUnits) => {
    arrUnits.forEach((unit) => {
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
