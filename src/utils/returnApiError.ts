import device = require('ocore/device.js');
import { Errors } from '../config/apis.js';

/**
 * Simple helper that'll alert the user with an appropriate message once an error
 * from the API is returned
 */
export function returnApiError(returnAddress: string, statusCode: number, errors: Errors): void {
    device.sendMessageToDevice(returnAddress, 'text', "Something went wrong while processing your request. If an error message was attached, then it'll be printed to you in the following message.");

    if (statusCode === 429) {
        device.sendMessageToDevice(returnAddress, 'text', "You've exceeded the rate limit. Please wait a while and then try again");
        return ;

        return;
    }

    if (statusCode === 500) {
        device.sendMessageToDevice(returnAddress, 'text', "Something went wrong while trying to process your request. Please try again later.");
        return;
    }

    const supportedErrors = Object.keys(errors);

    const errorKey = supportedErrors.find(code => Number(code) === statusCode);

    // If we've specified an error message for the given error, then alert it
    // to the user!
    if (errorKey) {
        device.sendMessageToDevice(returnAddress, 'text', supportedErrors[errorKey]);
    }
}