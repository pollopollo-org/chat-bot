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
