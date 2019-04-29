const headlessWallet = require("headless-obyte");
import device = require("ocore/device.js");
import eventBus = require("ocore/event_bus.js");
import validationUtils = require("ocore/validation_utils.js");
import { state } from "./state";

import "./listener";

import { updateApplicationToPending } from "./requests/requests";

import { returnAmountOfProducers, returnAmountOfProducts, returnAmountOfReceivers } from "./requests/getCounts";

/**
 * As soon as the wallet is ready, extract its own wallet address.
 */
eventBus.on("headless_wallet_ready", () => {
    state.bot.deviceAddress = device.getMyDeviceAddress();

    headlessWallet.issueOrSelectNextMainAddress((botAddress) => {
        state.bot.walletAddress = botAddress;
    });
});

/**
 * As soon as a new user pairs to the bot, attempt to link his/hers device address
 * to the associated PolloPollo user, based on the pairing secret.
 */
eventBus.on("paired", async (fromAddress, pairingSecret) => {
    // In case the pairingSecret can be parsed as an integer, that means we're
    // dealing with a donor
    if (Number.isNaN(parseInt(pairingSecret, undefined))) {
        device.sendMessageToDevice(
            fromAddress,
            "text",
            "Am doing something for donor :-))"
        );
    } else {
        // Associate pairingSecret (and hence user) with wallet address, i.e.
        // do a call to the backend

        // ... else we're dealing with a producer that attempts to link his wallet
        // with an account.
        device.sendMessageToDevice(
            fromAddress,
            "text",
            "Your device has now been paired with your PolloPollo account, and now " +
            "we just need your wallet address to finish the authentication."
        );
    }

    // Prompt user to add wallet address
    device.sendMessageToDevice(
        fromAddress,
        "text",
        "Please insert your wallet address by clicking (···) and chose " +
        "'insert my address'. Make sure to use a single address wallet"
    );
});

/**
 * Listener that'll get triggered every time a user sends something to the chat-
 * bot.
 */
eventBus.on("text", async (fromAddress, message) => {
    const parsedText = message.toLowerCase();

    // tslint:disable-next-line newline-per-chained-call
    if (validationUtils.isValidAddress(message.trim().toUpperCase())) {
        // Send address (message) and fromAddress to backend so that they can be
        // associated

        device.sendMessageToDevice(
            fromAddress,
            "text",
            "Your wallet has now been paired with your PolloPollo account, and you can now return to the webpage."
        );

        return;
    }

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
            device.sendMessageToDevice(
                fromAddress,
                "text",
                "Your message was not understood. Please insert your wallet address by clicking (···) and chose " +
                "'insert my address'. Make sure to use a single address wallet"
            );
    }
});

/**
 * Event send once transactions become stable
 */
eventBus.on("my_transactions_became_stable", async (arrUnits) => {
    await updateApplicationToPending(state.applicationId);
});
