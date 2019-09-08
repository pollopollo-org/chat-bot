"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const device = require("ocore/device.js");
const logEvent_js_1 = require("./logEvent.js");
const IS_DEV = false;
function returnApiError(returnAddress, statusCode, endPointData) {
    if (statusCode === 429) {
        device.sendMessageToDevice(returnAddress, "text", "You have exceeded the rate limit. Please wait a minute and then try again.");
        return;
    }
    if (statusCode === 500) {
        device.sendMessageToDevice(returnAddress, "text", "Something went wrong while trying to process your request. Please try again later.");
        return;
    }
    const supportedErrors = Object.keys(endPointData.errors);
    const errorKey = supportedErrors.find(code => Number(code) === statusCode);
    if (errorKey) {
        device.sendMessageToDevice(returnAddress, "text", supportedErrors[errorKey]);
        logEvent_js_1.logEvent(logEvent_js_1.LoggableEvents.UNKNOWN, { error: `DeviceAddress: ${returnAddress}, error: ${supportedErrors[errorKey]}` });
    }
    else {
        device.sendMessageToDevice(returnAddress, "text", `Something went wrong while processing your request. ${statusCode}`);
        logEvent_js_1.logEvent(logEvent_js_1.LoggableEvents.UNKNOWN, { error: `DeviceAddress: ${returnAddress}, error: ${statusCode}` });
    }
}
exports.returnApiError = returnApiError;
//# sourceMappingURL=returnApiError.js.map