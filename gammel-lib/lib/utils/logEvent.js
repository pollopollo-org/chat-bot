"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const lockfile = require("proper-lockfile");
const util = require("util");
const convertDollarToByte_1 = require("./convertDollarToByte");
const exists = util.promisify(fs.exists);
const appendFile = util.promisify(fs.appendFile);
const createFile = util.promisify(fs.writeFile);
var LoggableEvents;
(function (LoggableEvents) {
    LoggableEvents[LoggableEvents["REGISTERED_USER"] = 0] = "REGISTERED_USER";
    LoggableEvents[LoggableEvents["OFFERED_CONTRACT"] = 1] = "OFFERED_CONTRACT";
    LoggableEvents[LoggableEvents["FAILED_TO_OFFER_CONTRACT"] = 2] = "FAILED_TO_OFFER_CONTRACT";
    LoggableEvents[LoggableEvents["PAYMENT_BECAME_STABLE"] = 3] = "PAYMENT_BECAME_STABLE";
    LoggableEvents[LoggableEvents["UNKNOWN"] = 4] = "UNKNOWN";
})(LoggableEvents = exports.LoggableEvents || (exports.LoggableEvents = {}));
function logEvent(evtType, data) {
    const logger = async () => {
        const logFile = path.resolve("/home/pollopollo/.pollo_log");
        let errorMessage = `[${new Date().toUTCString()} `;
        switch (evtType) {
            case LoggableEvents.REGISTERED_USER:
                const registeredData = data;
                errorMessage += `- REGISTERED_USER] User with the wallet address '${registeredData.wallet},`;
                errorMessage += `device address '${registeredData.device}' and the pairing secret '${registeredData.pairingSecret}'`;
                break;
            case LoggableEvents.OFFERED_CONTRACT:
                const offeredData = data;
                errorMessage += `- OFFERED_CONTRACT] Successfully offered a contract with the following parameters: \n`;
                errorMessage += `    ApplicationId: ${offeredData.applicationId}\n`;
                errorMessage += `    Price in dollars: ${offeredData.price}, in bytes: ${convertDollarToByte_1.convertDollarToByte(offeredData.price)}\n`;
                errorMessage += `    Shared address (contract): ${offeredData.sharedAddress}\n`;
                errorMessage += `    Donor:\n        wallet: ${offeredData.donor.walletAddress}\n        device: ${offeredData.donor.walletAddress}\n`;
                errorMessage += `    Producer:\n        wallet: ${offeredData.producer.walletAddress}\n        device: ${offeredData.producer.deviceAddress}`;
                break;
            case LoggableEvents.FAILED_TO_OFFER_CONTRACT:
                const failData = data;
                errorMessage += `- FAILED_TO_OFFER_CONTRACT] FAILED to offer a contract with the following parameters: \n`;
                errorMessage += `    ApplicationId: ${failData.applicationId}\n`;
                errorMessage += `    Price in dollars: ${failData.price}, in bytes: ${convertDollarToByte_1.convertDollarToByte(failData.price)}\n`;
                errorMessage += `    Shared address (contract): ${failData.sharedAddress}\n`;
                errorMessage += `    Donor:\n        wallet: ${failData.donor.walletAddress}\n        device: ${failData.donor.walletAddress}\n`;
                errorMessage += `    Producer:\n        wallet: ${failData.producer.walletAddress}\n        device: ${failData.producer.deviceAddress}\n`;
                if (failData.error) {
                    errorMessage += `    Error message: \n        ${failData.error}`;
                }
                break;
            case LoggableEvents.PAYMENT_BECAME_STABLE:
                const stableData = data;
                errorMessage += `- PAYMENT_BECAME_STABLE] Donation to applicaiton with the id '${stableData.applicationId}'`;
                break;
            default:
                errorMessage += "- UNKNOWN_EVENT] Something was not logged properly, please contact developers.\n";
                errorMessage += `Potential error: ${data.error}`;
        }
        if (await exists(logFile)) {
            const release = await lockfile.lock(logFile);
            await appendFile(logFile, `\n\n${errorMessage}`);
            await release();
        }
        else {
            await createFile(logFile, errorMessage);
        }
    };
    logger()
        .catch(err => err);
}
exports.logEvent = logEvent;
//# sourceMappingURL=logEvent.js.map