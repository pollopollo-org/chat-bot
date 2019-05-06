const headlessWallet = require("headless-obyte");
import cron = require("node-cron");
import device = require("ocore/device.js");
import eventBus = require("ocore/event_bus.js");
import validationUtils = require("ocore/validation_utils.js");
import { state } from "./state";

import "./listener";

import { ApplicationStatus, setProducerInformation, updateApplicationStatus } from "./requests/requests";

import { apis } from "./config/apis";
import { checkContractDate } from "./utils/checkContractDate";
import { returnAmountOfProducers, returnAmountOfProducts, returnAmountOfReceivers } from "./requests/getCounts";
import { applicationCache, donorCache, pairingCache } from "./utils/caches";
import { logEvent, LoggableEvents } from "./utils/logEvent";
import { offerContract } from "./utils/offerContract";

// Ensure that the bot checks once a day if any contracts have been expired.
cron.schedule("* 0 * * *", checkContractDate);

/**
 * As soon as the wallet is ready, extract its own wallet address.
 */
eventBus.on("headless_wallet_ready", async () => {
    state.bot.deviceAddress = device.getMyDeviceAddress();
    await logEvent(LoggableEvents.UNKNOWN, { error: "Wallet ready" });

    device.sendMessageToDevice("026ZBBXLRUPGG2YG7E3HGWIW4XDHOCNGB", "text", "Whatwhat");

    headlessWallet.issueOrSelectNextMainAddress(async (botAddress) => {
        state.bot.walletAddress = botAddress;
        await logEvent(LoggableEvents.UNKNOWN, { error: botAddress });
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
        pairingCache.set(fromAddress, pairingSecret);

        // ... else we're dealing with a producer that attempts to link his wallet
        // with an account.
        device.sendMessageToDevice(
            fromAddress,
            "text",
            "Your device has now been paired with your PolloPollo account, and now " +
            "we just need your wallet address to finish the authentication."
        );
    } else {
        donorCache.set(pairingSecret, fromAddress);
        applicationCache.set(fromAddress, pairingSecret);

        device.sendMessageToDevice(
            fromAddress,
            "text",
            "Your device has been paired and is ready to finalize the donation. All we need " +
            `now is your wallet address to issue a donation contract.${pairingSecret}`
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
            const applicationId = applicationCache.get(fromAddress);

            // If the application id couldn't be retreived as well, then something
            // has went wrong somewhere in the process
            if (!applicationId) {
                await logEvent(LoggableEvents.UNKNOWN, { error: "Failed to retrieve either applicationId or pairingSecret from cache" });
                device.sendMessageToDevice(
                    fromAddress,
                    "text",
                    "Somehow we lost your device address in the registration process. " +
                    "Please go back to PolloPollo.org and try again."
                );

                return;
            }

            // We gotten the required information about a donor, log the event!
            await logEvent(LoggableEvents.REGISTERED_USER, { wallet: walletAddress, device: fromAddress, pairingSecret: applicationId });

            const endPoint = apis.applications.getContractData;
            const request = await fetch(
                endPoint.path.replace("{applicationId}", applicationId),
                {
                    method: endPoint.method
                }
            );
            const contractData = await request.json();
            offerContract(
                { walletAddress: walletAddress, deviceAddress: fromAddress },
                { walletAddress: contractData.producerWallet, deviceAddress: contractData.producerDevice },
                { walletAddress: state.bot.walletAddress, deviceAddress: state.bot.deviceAddress },
                contractData.price,
                applicationId
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
    // We cannot use state.applicationId btw, we need to extract that from arrUnits :-)
    await logEvent(LoggableEvents.PAYMENT_BECAME_STABLE, { applicationId: "temp" });

    // Set completed = 3 for application in Contracts DB

    // Check if transactions match with the contract

    // Request the backend to update application to pending
    await updateApplicationStatus(state.applicationId, ApplicationStatus.PENDING);
});

checkContractDate()
    .catch(err => { console.error(err); });
