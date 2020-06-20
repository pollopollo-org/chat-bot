import cron = require("node-cron");
import db = require("ocore/db");
import device = require("ocore/device.js");
import eventBus = require("ocore/event_bus.js");
import validationUtils = require("ocore/validation_utils.js");

import "./listener";

import { ApplicationStatus, getContractData, setProducerInformation, updateApplicationStatus } from "./requests/requests";

import { returnAmountOfProducers, returnAmountOfProducts, returnAmountOfReceivers } from "./requests/getCounts";
import { state } from "./state";
import { applicationCache, donorCache, pairingCache } from "./utils/caches";
import { getContractByConfirmKey, getContractBySharedAddress } from "./utils/getContract";
import { logEvent, LoggableEvents } from "./utils/logEvent";
import { offerContract } from "./utils/offerContract";
import { publishTimestamp } from "./utils/publishTimestamp";
import { completeContract } from "./utils/storeContract";

/**
 * Setup cron-jobs etc. as soon as the bot is fully booted
 */
eventBus.once("headless_wallet_ready", () => {
    // Ensure that the bot checks once a day if any contracts have expired.
    cron.schedule("* 0 * * *", publishTimestamp);
    state.wallet.setupChatEventHandlers();

    publishTimestamp()
        .catch(err => { console.error(err); });
});

/**
 * As soon as a new user pairs to the bot, attempt to link their device address
 * to the associated PolloPollo user, based on the pairing secret.
 */
eventBus.once("paired", async (fromAddress, pairingSecret) => {
    // In case the pairingSecret can be parsed as an integer, that means we're
    // dealing with a donor
    const asInt = parseInt(pairingSecret, undefined);
    if (Number.isNaN(asInt) || `${asInt}`.length !== pairingSecret.length) {
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
            "Your device has now been paired and is ready to finalize the donation. All we need " +
            `now is your wallet address to issue a donation contract.`
        );
    }

    // Prompt user to add wallet address
    device.sendMessageToDevice(
        fromAddress,
        "text",
        "Please insert your wallet address by clicking (···) and choose " +
        "'Insert my address'. Make sure to use a single address wallet."
    );
});

/**
 * Listener that'll get triggered every time a user sends something to the chat-
 * bot.
 */
eventBus.once("text", async (fromAddress, message) => {
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
                logEvent(LoggableEvents.UNKNOWN, { error: "Failed to retrieve either applicationId or pairingSecret from cache." });
                device.sendMessageToDevice(
                    fromAddress,
                    "text",
                    "Somehow we lost your device address in the registration process. " +
                    "Please go back to PolloPollo.org and try again."
                );

                return;
            }

            applicationCache.delete(fromAddress);

            // We gotten the required information about a donor, log the event!
            logEvent(LoggableEvents.REGISTERED_USER, { wallet: walletAddress, device: fromAddress, pairingSecret: applicationId });
            const contractData = await getContractData(applicationId, fromAddress);

            if (contractData) {
                offerContract(
                    { walletAddress: walletAddress, deviceAddress: fromAddress },
                    { walletAddress: contractData.producerWallet, deviceAddress: contractData.producerDevice },
                    contractData.price,
                    applicationId
                );
            }
        } else {
            // We're received all informatin we need about the producer, send
            // the information to the backend!
            const pairingSecret = pairingCache.get(fromAddress);
            pairingCache.delete(fromAddress);
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
                "'Insert my address'. Make sure to use a single address wallet."
            );
    }
});

/**
 * Event send once transactions become stable
 */
eventBus.once("new_my_transactions", async (arrUnits) => {
    arrUnits.forEach((unit) => {
        // Did we confirm receival of a product?
        db.query("SELECT * FROM data_feeds WHERE unit = ?", [unit], (rows) => {
            rows.forEach(async (row) => {
                const contract = await getContractByConfirmKey(row.feed_name);

                if (contract) {
                    device.sendMessageToDevice(
                        contract.ProducerDevice,
                        "text",
                        "The Receiver of your product has confirmed reception. In around 15 minutes you will be able " +
                        "to extract your payment from the contract."
                    );
                }
            });
        });

        // ... or did a donor pay his donation?
        db.query("SELECT address FROM outputs WHERE unit = ?", [unit], (rows => {
            rows.forEach(async (row) => {
                const contract = await getContractBySharedAddress(row.address);

                if (contract && contract.Completed !== 1) {
                    device.sendMessageToDevice(
                        contract.DonorDevice,
                        "text",
                        `Your donation of ${contract.Price}$ has now been submitted. ` +
                        "You will receive a message once the donation has been fully processed."
                    );
                }
            });
        }));
    });
});

/**
 * Event send once transactions become stable
 */
eventBus.once("my_transactions_became_stable", async (arrUnits) => {
    arrUnits.forEach((unit) => {
        // Did a donation become stable?
        db.query("SELECT address FROM outputs WHERE unit = ?", [unit], (rows => {
            rows.forEach(async (row) => {
                const contract = await getContractBySharedAddress(row.address);

                if (contract) {
                    await completeContract(contract.ApplicationId);
                    await updateApplicationStatus(contract.ApplicationId, ApplicationStatus.PENDING);

                    device.sendMessageToDevice(
                        contract.DonorDevice,
                        "text",
                        "Your donation has now been processed. Thank you for your contribution!"
                    );
                }
            });
        }));
    });
});