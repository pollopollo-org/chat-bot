import device = require("ocore/device.js");
import { EndpointData } from "../config/apis.js";
import { logEvent, LoggableEvents } from "./logEvent.js";

const IS_DEV = false;

/**
 * Simple helper that'll alert the user with an appropriate message once an error
 * from the API is returned
 */
export function returnApiError(returnAddress: string, statusCode: number, endPointData: EndpointData): void {
    // In case of rate limiting errors notify the user of the.
    if (statusCode === 429) {
        device.sendMessageToDevice(
            returnAddress,
            "text",
            "You have exceeded the rate limit. Please wait a minute and then try again."
        );

        return;
    }

    // In case of an internal server error, simply specify to the user what went wrong
    if (statusCode === 500) {
        device.sendMessageToDevice(
            returnAddress,
            "text",
            "Something went wrong while trying to process your request. Please try again later."
        );

        return;
    }

    // In case the error wasn't one of the hardcoded errors that can occur for
    // any request, then attempt to extract an error message that is associated
    // with both the errorCode and the current request.
    const supportedErrors: string[] = Object.keys(endPointData.errors);

    const errorKey = supportedErrors.find(code => Number(code) === statusCode);

    // If we've specified an error message for the given error, then alert it
    // to the user!
    if (errorKey) {
        device.sendMessageToDevice(returnAddress, "text", supportedErrors[errorKey]);
        logEvent(LoggableEvents.UNKNOWN, { error: `DeviceAddress: ${returnAddress}, error: ${supportedErrors[errorKey]}` });
    } else {
        // ... else, just indicate to the user that something went wrong while
        // processing the request.
        device.sendMessageToDevice(
            returnAddress,
            "text",
            `Something went wrong while processing your request. ${statusCode}`
        );
        logEvent(LoggableEvents.UNKNOWN, { error: `DeviceAddress: ${returnAddress}, error: ${statusCode}` });
    }
}
