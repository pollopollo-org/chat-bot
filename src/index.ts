const headlessWallet = require("headless-obyte");
import device = require("ocore/device.js");
import eventBus = require("ocore/event_bus.js");

import "./listener";

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

        default:
            device.sendMessageToDevice(fromAddress, device.SendFormats.TEXT, "Unknown request.");
    }
});
