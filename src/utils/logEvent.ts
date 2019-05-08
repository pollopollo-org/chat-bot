import fs = require("fs");
import path = require("path");
import lockfile = require("proper-lockfile");
import util = require("util");

import { convertDollarToByte } from "./convertDollarToByte";
import { Participant } from "./offerContract";

const exists = util.promisify(fs.exists);
const appendFile = util.promisify(fs.appendFile);
const createFile = util.promisify(fs.writeFile);

export enum LoggableEvents {
    REGISTERED_USER,
    OFFERED_CONTRACT,
    FAILED_TO_OFFER_CONTRACT,
    PAYMENT_BECAME_STABLE,
    UNKNOWN
}

/**
 * We don't bother documenting the types for the logger since they're used in
 * a context where they should make sense.
 *
 * (In case they don't, please refer to the error messages they're used within.)
 */
// tslint:disable completed-docs
type withError = {
    error?: string;
};

type RegisteredUserData = {
    wallet: string;
    device: string;
    pairingSecret: string;
} & withError;

type ContractData = {
    applicationId: string;
    donor: Participant;
    producer: Participant;
    sharedAddress: string;
    price: number;
} & withError;

type PaymentStableData = {
    applicationId: string;
} & withError;

type CombinedData = RegisteredUserData | ContractData | PaymentStableData | withError;
// tslint:enable completed-docs

/**
 * Abstracts the process of logging events that occurs on the chatbot.
 *
 * In essence there will be written to a logfile in the root of the server, while
 * also ensure the file is properly locked while doing so.
 */
// tslint:disable max-line-length
export function logEvent(evtType: LoggableEvents, data: CombinedData): void {
    const logger = async () => {
        const logFile = path.resolve("/home/pollopollo/.pollo_log");
        let errorMessage: string = `[${new Date().toUTCString()} `;

        switch (evtType) {
            case LoggableEvents.REGISTERED_USER:
                const registeredData = <RegisteredUserData>data;
                errorMessage += `- REGISTERED_USER] User with the wallet address '${registeredData.wallet},`;
                errorMessage += `device address '${registeredData.device}' and the pairing secret '${registeredData.pairingSecret}'`;
                break;

            case LoggableEvents.OFFERED_CONTRACT:
                const offeredData = <ContractData>data;
                errorMessage += `- OFFERED_CONTRACT] Successfully offered a contract with the following parameters: \n`;
                errorMessage += `    ApplicationId: ${offeredData.applicationId}\n`;
                errorMessage += `    Price in dollars: ${offeredData.price}, in bytes: ${convertDollarToByte(offeredData.price)}\n`;
                errorMessage += `    Shared address (contract): ${offeredData.sharedAddress}\n`;
                errorMessage += `    Donor:\n        wallet: ${offeredData.donor.walletAddress}\n        device: ${offeredData.donor.walletAddress}\n`;
                errorMessage += `    Producer:\n        wallet: ${offeredData.producer.walletAddress}\n        device: ${offeredData.producer.deviceAddress}`;
                break;

            case LoggableEvents.FAILED_TO_OFFER_CONTRACT:
                const failData = <ContractData>data;
                errorMessage += `- FAILED_TO_OFFER_CONTRACT] FAILED to offer a contract with the following parameters: \n`;
                errorMessage += `    ApplicationId: ${failData.applicationId}\n`;
                errorMessage += `    Price in dollars: ${failData.price}, in bytes: ${convertDollarToByte(failData.price)}\n`;
                errorMessage += `    Shared address (contract): ${failData.sharedAddress}\n`;
                errorMessage += `    Donor:\n        wallet: ${failData.donor.walletAddress}\n        device: ${failData.donor.walletAddress}\n`;
                errorMessage += `    Producer:\n        wallet: ${failData.producer.walletAddress}\n        device: ${failData.producer.deviceAddress}\n`;
                if (failData.error) {
                    errorMessage += `    Error message: \n        ${failData.error}`;
                }
                break;

            case LoggableEvents.PAYMENT_BECAME_STABLE:
                const stableData = <PaymentStableData>data;
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
        } else {
            await createFile(logFile, errorMessage);
        }
    };

    logger()
        .catch(err => err);
}
// tslint:enable max-line-length
