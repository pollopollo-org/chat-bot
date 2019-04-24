import fetch from "node-fetch";
import device = require("ocore/device.js");

import { apis } from "../config/apis.js";
import { returnApiError } from "../utils/returnApiError";

/**
 * Response method that'll return the amount of producers to the user requesting
 * it.
 */
export async function returnAmountOfProducers(returnAddress: string) {
    try {
        const endPoint = apis.producer.count;

        // Fetch count from backend
        const response = await fetch(endPoint.path, {
            method: endPoint.method,
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await response.text();

        if (response.ok) {
            device.sendMessageToDevice(returnAddress, "text", `Current amount of producers: ${data}`);
        } else {
            returnApiError(returnAddress, response.status, endPoint.errors);
        }
    } catch (err) {
        device.sendMessageToDevice(returnAddress, "text", "Something went wrong while processing your request.");
    }
}

/**
 * Response method that'll return the amount of producers to the user requesting
 * it.
 */
export async function returnAmountOfReceivers(returnAddress: string) {
    try {
        const endPoint = apis.receivers.count;

        // Fetch count from backend
        const response = await fetch(endPoint.path, {
            method: endPoint.method,
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await response.text();

        if (response.ok) {
            device.sendMessageToDevice(returnAddress, "text", `Current amount of receivers: ${data}`);
        } else {
            returnApiError(returnAddress, response.status, endPoint.errors);
        }
    } catch (err) {
        device.sendMessageToDevice(returnAddress, "text", "Something went wrong while processing your request.");
    }
}

/**
 * Response method that'll return the amount of producers to the user requesting
 * it.
 */
export async function returnAmountOfProducts(returnAddress: string) {
    try {
        const endPoint = apis.products.count;

        // Fetch count from backend
        const response = await fetch(endPoint.path, {
            method: endPoint.method,
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await response.text();

        if (response.ok) {
            device.sendMessageToDevice(returnAddress, "text", `Current amount of active products: ${data}`);
        } else {
            returnApiError(returnAddress, response.status, endPoint.errors);
        }
    } catch (err) {
        device.sendMessageToDevice(returnAddress, "text", "Something went wrong while processing your request.");
    }
}
