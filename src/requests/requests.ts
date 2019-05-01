import fetch from "node-fetch";
import device = require("ocore/device.js");

import { apis } from "../config/apis.js";
import { returnApiError } from "../utils/returnApiError";

export enum ApplicationStatus {
    OPEN,
    LOCKED,
    PENDING,
    CLOSED,
    ALL
}

/**
 * Request method that'll request the backend to update given application
 * to pending
 */
// tslint:disable-next-line export-name
export async function updateApplicationToPending(applicationId: string) {
    try {
        const endPoint = apis.applications.updateToPending;

        // Send request to backend
        const response = await fetch(endPoint.path, {
            method: endPoint.method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                applicationId: applicationId,
                status: ApplicationStatus.PENDING
            })
        });

    } catch (err) {
        // Catch error
    }
}
