const headlessWallet = require("headless-obyte");
import device = require("ocore/device.js");
import eventBus = require("ocore/event_bus.js");

import "./listener";

import { updateApplicationToPending } from "./requests/requests";
import { state } from "./state";

import { returnAmountOfProducers, returnAmountOfProducts, returnAmountOfReceivers } from "./requests/getCounts";

/**
 * user sends message to the bot
 */
eventBus.on("text", async (fromAddress, message) => {
    const parsedText = message.toLowerCase();

    switch (parsedText) {
        case "producers":
            await returnAmountOfProducers(fromAddress);
            break;

        case "products":
            await returnAmountOfProducts(fromAddress);
            break;

        case "receivers":
            await returnAmountOfReceivers(fromAddress);
            break;
        case "contract-test":

            break;

        default:
            device.sendMessageToDevice(fromAddress, "text", "Unknown request.");
    }
});

/**
 * Event send once transactions become stable
 */
eventBus.on("my_transactions_became_stable", async (arrUnits) => {
    await updateApplicationToPending(state.applicationId);
});
