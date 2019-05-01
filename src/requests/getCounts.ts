import fetch from "node-fetch";
import device = require("ocore/device.js");

import https = require("https");

import { apis } from "../config/apis.js";
import { returnApiError } from "../utils/returnApiError";

const agent = new https.Agent({
    rejectUnauthorized: false
});

// Add SSL certificate to allow requests between backend and chat-bot
// tslint:disable-next-line: newline-per-chained-call
require("https").globalAgent.options.ca = require("ssl-root-cas/latest").create();

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
            },
            agent
        });
        const data = await response.text();

        if (response.ok) {
            device.sendMessageToDevice(returnAddress, "text", `Current amount of active products: ${data}`);
        } else {
            returnApiError(returnAddress, response.status, endPoint.errors);
            device.sendMessageToDevice(returnAddress, "text", response.statusText);
        }
    } catch (err) {
        device.sendMessageToDevice(returnAddress, "text", `Something went wrong while processing your request. ${err}`);
    }
}
