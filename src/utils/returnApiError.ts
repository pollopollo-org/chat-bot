import device = require("ocore/device.js");
import { Errors } from "../config/apis.js";

const IS_DEV = false;

/**
 * Simple helper that'll alert the user with an appropriate message once an error
 * from the API is returned
 */
export function returnApiError(returnAddress: string, statusCode: number, errors: Errors): void {
    // In case of rate limiting errors notify the user of the.
    if (statusCode === 429) {
        device.sendMessageToDevice(
            returnAddress,
            device.SendFormats.TEXT,
            "You've exceeded the rate limit. Please wait a while and then try again"
        );

        return;
    }

    // In case of an internal server error, simply specify to the user what went wrong
    if (statusCode === 500) {
        device.sendMessageToDevice(
            returnAddress,
            device.SendFormats.TEXT,
            "Something went wrong while trying to process your request. Please try again later."
        );

        return;
    }

    // In case the error wasn't one of the hardcoded errors that can occur for
    // any request, then attempt to extract an error message that is associated
    // with both the errorCode and the current request.
    const supportedErrors: string[] = Object.keys(errors);

    const errorKey = supportedErrors.find(code => Number(code) === statusCode);

    // If we've specified an error message for the given error, then alert it
    // to the user!
    if (errorKey) {
        device.sendMessageToDevice(returnAddress, device.SendFormats.TEXT, supportedErrors[errorKey]);
    } else {
        // ... else, just indicate to the user that something went wrong while
        // processing the request.
        device.sendMessageToDevice(
            returnAddress,
            device.SendFormats.TEXT,
            "Something went wrong while processing your request."
        );
    }
}
