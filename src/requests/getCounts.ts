import device = require('ocore/device.js');
import fetch from "node-fetch";

import { apis } from '../config/apis.js';
import { returnApiError } from '../utils/returnApiError';
import { ProductModelData } from '../typings';

/**
 * Response method that'll return the amount of producers to the user requesting
 * it.
 */
export async function returnAmountOfProducers(returnAddress: string) {
    try {
        const endPoint = apis.products.getBatch.path.replace("{start}", String(0)).replace("{end}", String(20));

        // Fetch count from backend
        const response = await fetch(endPoint, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });
        const json: { count: number; list: ProductModelData[] } = await response.json();

        if (response.ok) {
            device.sendMessageToDevice(returnAddress, 'text', `Current amount of active products: ${json.count}`);
        } else {
            returnApiError(returnAddress, response.status, apis.products.getBatch.errors);
        }
    } catch (err) {
        device.sendMessageToDevice(returnAddress, 'text', "Something went wrong while processing your request.");
    }
}