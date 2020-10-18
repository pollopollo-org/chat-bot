import fetch from "node-fetch";
import device = require("ocore/device.js");

import { apis } from "../config/apis.js";
import { logEvent, LoggableEvents } from "../utils/logEvent.js";
import { returnApiError } from "../utils/returnApiError";

export enum ApplicationStatus {
    OPEN,
    LOCKED,
    PENDING,
    COMPLETED,
    UNAVAILABLE
}

/**
 * Request method that'll request the backend to update given application
 * to given status
 */
// tslint:disable-next-line export-name
export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus, deviceAddress?: string) {
    try {
        const endPoint = apis.applications.updateToPending;

        // Send request to backend
        const response = await fetch(endPoint.path, {
            method: endPoint.method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                applicationId: Number(applicationId),
                status
            })
        });

        if (!response.ok && deviceAddress) {
            returnApiError(deviceAddress, response.status, endPoint);
        }
    } catch (err) {
        if (deviceAddress) {
            device.sendMessageToDevice(deviceAddress, "text", "Failed to update application state, please contact developers.");
        }
    }
}

/**
 * Request method that'll update the backend to let it know if an application was successfully created on the AA
 */
// tslint:disable-next-line export-name
export async function aaCreated(applicationId: string, success: boolean, result: string) {
    try {
        const endPoint = apis.applications.aaCreated;

        // Send request to backend
        const response = await fetch(endPoint.path, {
            method: endPoint.method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                applicationId: applicationId,
                success,
                result
            })
        });

        if (!response.ok) {
            logEvent(LoggableEvents.UNKNOWN, {error: "Failed to call backend to inform of result of application creation on AA"});
        }
    } catch (err) {
        logEvent(LoggableEvents.UNKNOWN, {error: "Failed to call backend to inform of result of application creation on AA"});
    }
}

/**
 * Method to inform back-end when a new deposit is made by a donor directly to the AA
 */
// tslint:disable-next-line export-name
export async function aaDonorDeposited(accountId: string, walletAddress: string) {
    try {
        //const endPoint = apis.applications.aaCreated;
        const endPoint = apis.donors.aaDonorDeposited;

        const response = await fetch(endPoint.path, {
            method: endPoint.method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accountId: accountId,
                walletAddress: walletAddress
            })
        });

        if (!response.ok) {
            logEvent(LoggableEvents.UNKNOWN, {error: "Failed to call backend to inform of new donor deposit on AA"});
        }
    } catch (err) {
        logEvent(LoggableEvents.UNKNOWN, {error: "Failed to call backend to inform of result of new donor deposit on AA"});
    }
}

/**
 * Method to inform back-end that an applicant confirmed receipt and the chat-bot successfully updated the AA
 * Back-end should update status to 3 (COMPLETED) for the application
 */
// tslint:disable-next-line export-name
export async function aaConfirmed(applicationId: string) {
    try {
        const endPoint = apis.applications.aaConfirmed;

        const response = await fetch(endPoint.path, {
            method: endPoint.method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                applicationId: applicationId
            })
        });

        if (!response.ok) {
            logEvent(LoggableEvents.UNKNOWN, {error: "Failed to call backend to inform of new donor deposit on AA"});
        }
    } catch (err) {
        logEvent(LoggableEvents.UNKNOWN, {error: "Failed to call backend to inform of result of new donor deposit on AA"});
    }
}

/**
 * Should be called once we're ready to store information about a
 * producer in order to store it properly on the backend.
 */
export async function setProducerInformation(
    pairingSecret: string,
    walletAddress: string,
    deviceAddress: string
) {
    try {
        const endPoint = apis.producer.setInformation;

        // Fetch count from backend
        const response = await fetch(endPoint.path, {
            method: endPoint.method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                PairingSecret: pairingSecret,
                DeviceAddress: deviceAddress,
                WalletAddress: walletAddress
            })
        });

        if (response.ok) {
            logEvent(LoggableEvents.REGISTERED_USER, { wallet: walletAddress, device: deviceAddress, pairingSecret });
            device.sendMessageToDevice(
                deviceAddress,
                "text",
                "Your information has now been set, and you are ready to receive donations " +
                "through PolloPollo.org."
            );
        } else {
            returnApiError(deviceAddress, response.status, endPoint);
        }
    } catch (err) {
        device.sendMessageToDevice(deviceAddress, "text", `Something went wrong while processing your request. ${err}`);
    }
}

/**
 * Should be called once we're ready to store information about a
 * producer in order to store it properly on the backend.
 */
// tslint:disable completed-docs
export async function getContractData(applicationId: string, deviceAddress: string): Promise<{
    producerWallet: string;
    producerDevice: string;
    price: number;
} | void> {
    try {
        const endPoint = apis.applications.getContractData;

        // Fetch count from backend
        const response = await fetch(
            endPoint.path.replace("{applicationId}", applicationId),
            {
                method: endPoint.method
            }
        );

        if (response.ok) {
            return await response.json();
        } else {
            returnApiError(deviceAddress, response.status, endPoint);
        }
    } catch (err) {
        device.sendMessageToDevice(deviceAddress, "text", "Something went wrong while processing your request.");
    }
}
// tslint:enable completed-docs
