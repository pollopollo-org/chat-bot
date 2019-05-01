const headlessWallet = require("headless-obyte");
import device = require("ocore/device.js");
import eventBus = require("ocore/event_bus.js");
import validationUtils = require("ocore/validation_utils.js");
import { state } from "./state";

import "./listener";

import { updateApplicationToPending, setProducerInformation } from "./requests/requests";

import { returnAmountOfProducers, returnAmountOfProducts, returnAmountOfReceivers } from "./requests/getCounts";

/**
 * Is used to temporarirly store (and pair) a device address to a pairing secret
 */
const pairingCache: Map<string, string> = new Map();

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
        pairingCache.set(fromAddress, pairingSecret);

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
    const walletAddress = message
        .trim()
        .toUpperCase();

    // tslint:disable-next-line newline-per-chained-call
    if (validationUtils.isValidAddress(walletAddress)) {
        if (!pairingCache.has(fromAddress)) {
            device.sendMessageToDevice(
                fromAddress,
                "text",
                "Somehow we lost your device address in the registration process. " +
                "Please go back to PolloPollo.org and try again."
            );
        } else {
            // We're received all informatin we need about the producer, send
            // the information to the backend!
            const pairingSecret = pairingCache.get(fromAddress);
            await setProducerInformation(
                pairingSecret!,
                walletAddress,
                fromAddress
            );
        }

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

    // Check if transactions match with the contract

    // Request the backend to update application to pending
    await updateApplicationToPending(state.applicationId);
});
