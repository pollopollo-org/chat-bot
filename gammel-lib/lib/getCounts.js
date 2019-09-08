"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const device = require("ocore/device.js");
const apis_js_1 = require("../config/apis.js");
const returnApiError_1 = require("../utils/returnApiError");
async function returnAmountOfProducers(returnAddress) {
    try {
        const endPoint = apis_js_1.apis.producer.count;
        const response = await node_fetch_1.default(endPoint.path, {
            method: endPoint.method,
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await response.text();
        if (response.ok) {
            device.sendMessageToDevice(returnAddress, "text", `Current amount of producers: ${data}`);
        }
        else {
            returnApiError_1.returnApiError(returnAddress, response.status, endPoint);
        }
    }
    catch (err) {
        device.sendMessageToDevice(returnAddress, "text", "Something went wrong while processing your request.");
    }
}
exports.returnAmountOfProducers = returnAmountOfProducers;
async function returnAmountOfReceivers(returnAddress) {
    try {
        const endPoint = apis_js_1.apis.receivers.count;
        const response = await node_fetch_1.default(endPoint.path, {
            method: endPoint.method,
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await response.text();
        if (response.ok) {
            device.sendMessageToDevice(returnAddress, "text", `Current amount of receivers: ${data}`);
        }
        else {
            returnApiError_1.returnApiError(returnAddress, response.status, endPoint);
        }
    }
    catch (err) {
        device.sendMessageToDevice(returnAddress, "text", "Something went wrong while processing your request.");
    }
}
exports.returnAmountOfReceivers = returnAmountOfReceivers;
async function returnAmountOfProducts(returnAddress) {
    try {
        const endPoint = apis_js_1.apis.products.count;
        const response = await node_fetch_1.default(endPoint.path, {
            method: endPoint.method,
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await response.text();
        if (response.ok) {
            device.sendMessageToDevice(returnAddress, "text", `Current amount of active products: ${data}`);
        }
        else {
            returnApiError_1.returnApiError(returnAddress, response.status, endPoint);
            device.sendMessageToDevice(returnAddress, "text", response.statusText);
        }
    }
    catch (err) {
        device.sendMessageToDevice(returnAddress, "text", `Something went wrong while processing your request. ${err}`);
    }
}
exports.returnAmountOfProducts = returnAmountOfProducts;
//# sourceMappingURL=getCounts.js.map