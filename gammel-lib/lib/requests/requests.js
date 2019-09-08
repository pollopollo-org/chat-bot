"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const device = require("ocore/device.js");
const apis_js_1 = require("../config/apis.js");
const logEvent_js_1 = require("../utils/logEvent.js");
const returnApiError_1 = require("../utils/returnApiError");
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus[ApplicationStatus["OPEN"] = 0] = "OPEN";
    ApplicationStatus[ApplicationStatus["LOCKED"] = 1] = "LOCKED";
    ApplicationStatus[ApplicationStatus["PENDING"] = 2] = "PENDING";
    ApplicationStatus[ApplicationStatus["COMPLETED"] = 3] = "COMPLETED";
    ApplicationStatus[ApplicationStatus["UNAVAILABLE"] = 4] = "UNAVAILABLE";
})(ApplicationStatus = exports.ApplicationStatus || (exports.ApplicationStatus = {}));
async function updateApplicationStatus(applicationId, status, deviceAddress) {
    try {
        const endPoint = apis_js_1.apis.applications.updateToPending;
        const response = await node_fetch_1.default(endPoint.path, {
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
            returnApiError_1.returnApiError(deviceAddress, response.status, endPoint);
        }
    }
    catch (err) {
        if (deviceAddress) {
            device.sendMessageToDevice(deviceAddress, "text", "Failed to update application state, please contact developers.");
        }
    }
}
exports.updateApplicationStatus = updateApplicationStatus;
async function setProducerInformation(pairingSecret, walletAddress, deviceAddress) {
    try {
        const endPoint = apis_js_1.apis.producer.setInformation;
        const response = await node_fetch_1.default(endPoint.path, {
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
            logEvent_js_1.logEvent(logEvent_js_1.LoggableEvents.REGISTERED_USER, { wallet: walletAddress, device: deviceAddress, pairingSecret });
            device.sendMessageToDevice(deviceAddress, "text", "Your information has now been set, and you are ready to receive donations " +
                "through PolloPollo.org.");
        }
        else {
            returnApiError_1.returnApiError(deviceAddress, response.status, endPoint);
        }
    }
    catch (err) {
        device.sendMessageToDevice(deviceAddress, "text", `Something went wrong while processing your request. ${err}`);
    }
}
exports.setProducerInformation = setProducerInformation;
async function getContractData(applicationId, deviceAddress) {
    try {
        const endPoint = apis_js_1.apis.applications.getContractData;
        const response = await node_fetch_1.default(endPoint.path.replace("{applicationId}", applicationId), {
            method: endPoint.method
        });
        if (response.ok) {
            return await response.json();
        }
        else {
            returnApiError_1.returnApiError(deviceAddress, response.status, endPoint);
        }
    }
    catch (err) {
        device.sendMessageToDevice(deviceAddress, "text", "Something went wrong while processing your request.");
    }
}
exports.getContractData = getContractData;
//# sourceMappingURL=requests.js.map