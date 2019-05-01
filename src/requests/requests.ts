import fetch from "node-fetch";
import device = require("ocore/device.js");

import { apis } from "../config/apis.js";
import { returnApiError } from "../utils/returnApiError";

/**
 * Response method that'll return the amount of producers to the user requesting
 * it.
 */
// tslint:disable-next-line export-name
export async function updateApplicationToPending(returnAddress: string) {
    try {
        const endPoint = apis.applications.updateToPending;

        // Fetch count from backend
        const response = await fetch(endPoint.path, {
            method: endPoint.method,
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            device.sendMessageToDevice(returnAddress, "text", `Donation fulfilled. Application is now pending.`);
        } else {
            returnApiError(returnAddress, response.status, endPoint.errors);
        }
    } catch (err) {
        device.sendMessageToDevice(returnAddress, "text", "Something went wrong while processing your request.");
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
            device.sendMessageToDevice(
                deviceAddress,
                "text",
                "Your information has now been set, and you're ready to receive donations " +
                "through PolloPollo.org."
            );
        } else {
            returnApiError(deviceAddress, response.status, endPoint.errors);
        }
    } catch (err) {
        device.sendMessageToDevice(deviceAddress, "text", "Something went wrong while processing your request.");
    }
}
