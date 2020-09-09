import cron = require("node-cron");
import db = require("ocore/db");
import device = require("ocore/device.js");
import eventBus = require("ocore/event_bus.js");
import validationUtils = require("ocore/validation_utils.js");
import wallet = require("ocore/wallet");
import walletDefinedByAddresses = require("ocore/wallet_defined_by_addresses");

import "./listener";

import { ApplicationStatus, getContractData, setProducerInformation, updateApplicationStatus } from "./requests/requests";

import { returnAmountOfProducers, returnAmountOfProducts, returnAmountOfReceivers } from "./requests/getCounts";
import { state } from "./state";
import { applicationCache, donorCache, pairingCache } from "./utils/caches";
import { getContractByConfirmKey, getContractBySharedAddress } from "./utils/getContract";
import { getProductAndReceiverByApplicationId, getProductByApplicationId } from "./utils/getProduct";
import { logEvent, LoggableEvents } from "./utils/logEvent";
import { offerContract } from "./utils/offerContract";
import { completeContract } from "./utils/storeContract";
import { publishTimestamp } from "./utils/publishTimestamp";
import { subscribe, unsubscribe, sendNewsletter } from "./utils/newsletter";
import { handleStaleApplications, updateWithdrawnDonations } from "./utils/cron";
import { parse } from "path";
import { withdrawToPollopollo } from "./utils/withdrawToParticipant";
import { aaCreateApplication, aaCancelApplication, aaDonate, aaConfirm } from "./utils/aainteraction";
import { AA, } from "aagent.js";

/**
 * Setup cron-jobs etc. as soon as the bot is fully booted
 */
eventBus.on("headless_wallet_ready", () => {
    // Ensure that the bot checks once a day if any contracts have expired.
    // cron.schedule("* 0 * * *", publishTimestamp);
    cron.schedule("* * * * *", handleStaleApplications);
    cron.schedule("* * * * *", updateWithdrawnDonations);
    cron.schedule("0 17 * * 0", sendNewsletter);

    state.wallet.setupChatEventHandlers();

    const placeholder = wallet;

    const aa = new AA("UA2OPEG2BLTAAPZGWQ4IHEZLHOD22BBJ");
    
    aa.events.on('new_request', (request) => {
        console.error('new request', request);
    });

    aa.events.on('new_response', (err, response, vars) => {
        const aaAction = response.response.responseVars;

        switch(aaAction.action) {
            case "deposit":
                // Check if donor is known already
                // If not - add new donor using aaAction.donor and response.address
                device.sendMessageToDevice(
                    "0GUAJFYOJ3FPQJIR4CUYLNE56F7UFGCKA",
                    "text",
                    "The donor is: " + aaAction.donor +
                    "\nThe asset is: " + aaAction.asset +
                    "\n and I believe the address was: " + aaAction.address
                );
                break;
            case "create":
                // Update backend with the AAID (triggering unit ID)
                break;
            case "withdraw":
                // Update backend, that funds was withdrawn from application (triggering unit ID) and make sure Bytes is set to 0
                break;
            case "return":
                // Update backend, that funds was withdrawn from application (triggering unit ID) and make sure Bytes is set to 0
                break;
            case "donate":
                // Update backend, that application status should change to 2 = PENDING
                break;
            case "confirm":
                // Update backend, that application status should change to 3 = COMPLETED (triggering unit ID) and make sure Bytes is set to 0
                break;
        }
    });

    aa.events.on('new_aa_definition', (definition) => {
        console.error('new aa definition', definition);
    });

    aa.events.on('new_aa_definition_saved', (definition) => {
        console.error('new aa definition saved', definition);
    });

    aa.addResponseEventHandler((err, params, vars) => {        
        return true;
      }, (err, params, vars) => {
        console.error(err, params, vars);
      });

});

/**
 * As soon as a new user pairs to the bot, attempt to link their device address
 * to the associated PolloPollo user, based on the pairing secret.
 */
eventBus.on("paired", async (fromAddress, pairingSecret) => {
    // In case the pairingSecret can be parsed as an integer, that means we're
    // dealing with a donor
    const asInt = parseInt(pairingSecret, undefined);
    if (Number.isNaN(asInt) || `${asInt}`.length !== pairingSecret.length) {
        pairingCache.set(fromAddress, pairingSecret);

        // ... otherwise we're dealing with a producer that attempts to link his wallet
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
eventBus.on("text", async (fromAddress, message) => {
    const parsedText = message.toLowerCase();
    const walletAddress = message
        .trim()
        .toUpperCase();
    if (parsedText.split(" ")[0] === "withdraw" && fromAddress === "0QZMFST5OJ4YS53Z2LMLHW2PVQUI4ZHS3") {
        const withdrawFromAddress = parsedText.split(" ")[1];
        const withdrawUnit = await withdrawToPollopollo(parsedText.split(" ")[1]);
        device.sendMessageToDevice(
            fromAddress,
            "text",
            "Withdrawal successful - see unit https://explorer.obyte.org/#" + withdrawUnit + "."
        );
    }

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

        case "post":
            await publishTimestamp();
            break;

       case "resend":
        walletDefinedByAddresses.sendToPeerAllSharedAddressesHavingUnspentOutputs(fromAddress, "base", {
            ifFundedSharedAddress: function(numberOfContracts) {
                device.sendMessageToDevice(
                    fromAddress,
                    "text",
                    `Found and resent ${numberOfContracts} smart contracts that have Bytes on them to your wallet.` +
                    `Please be aware that contracts can only be restored to the same wallet they were originally sent to.`);
            },
            ifNoFundedSharedAddress: function() {
                device.sendMessageToDevice(
                    fromAddress,
                    "text",
                    `No smart contracts with Bytes on it were found. Please be aware, that smart contracts can only be resent to the wallet they were sent to originally.` +
                    `If you have an old backup or even the seed words, you can try to restore that and request resending the smart contracts again.`
                );
            }
        });
        break;            

        case "help":
            device.sendMessageToDevice(
                fromAddress,
                "text",
                `The main operations for the PolloPollo chatbot are initiated through the PolloPollo website. These are the commands you can send directly to the chatbot:`
            );
            device.sendMessageToDevice(
                fromAddress,
                "text",
                `[Help](command:help): displays this message.\n` +
                `[Subscribe](command:subscribe): subscribes you to the weekly newsletter.\n` +
                `[Unsubscribe](command:unsubscribe): unsubscribes you from the weekly newsletter.\n` + 
                `[Resend](command:resend): resends all smart contracts to your device.`
            );
            break;

        case "subscribe":
            await subscribe(fromAddress);
            device.sendMessageToDevice(
                fromAddress,
                "text",
                `You will now receive the weekly digest with statistics and metrics from the past week.\n` +
                `The weekly newsletter is sent by the chat bot every Sunday.\n` +
                `To unsubscribe, simply type [unsubscribe](command:unsubscribe)`
            );
            break;

        case "unsubscribe":
            await unsubscribe(fromAddress);
            device.sendMessageToDevice(
                fromAddress,
                "text",
                `You will no longer receive the weekly digest.\n` +
                `If you change your mind, you can always [subscribe](command:subscribe) again.`
            );
            break;

        case "a":
            device.sendMessageToDevice(
                fromAddress,
                "text",
                "Checking the balance of a donor on the AA"
            );

            const donateAmount = await AA.getAAVars('DHBRRUMBTA2XH7L2VKEI4QHHNYOTTI5E', {var_prefix_from: 'donation_punqtured', var_prefix_to: 'donation_punqtured'});
            device.sendMessageToDevice(
                fromAddress,
                "text",
                "I think I got this value: " + JSON.stringify(donateAmount)
            );
            break;

        default:
            device.sendMessageToDevice(
                fromAddress,
                "text",
                "Message not understood. If you were making a donation, please insert your wallet address by clicking (···) and chose " +
                "'Insert my address'. Make sure to use a single address wallet.\nType [help](command:help) to see available commands."
            );
    }
});

/**
 * Event send once transactions become stable
 */
eventBus.on("new_my_transactions", async (arrUnits) => {
    arrUnits.forEach((unit) => {
        // Did we confirm receipt of a product?
        db.query("SELECT * FROM data_feeds WHERE unit = ?", [unit], (rows) => {
            rows.forEach(async (row) => {
                const contract = await getContractByConfirmKey(row.feed_name);

                if (contract) {
                    const product = await getProductAndReceiverByApplicationId(contract.ApplicationId);
                    const sharedAddress = String(contract.SharedAddress);

                    device.sendMessageToDevice(
                        contract.ProducerDevice,
                        "text",
                        `The Receiver (${product.FirstName} ${product.SurName}) of your product ` +
                        `"${product.Title}" has confirmed reception. ` +
                        `In around 15 minutes you will be able ` +
                        `to extract your payment from the contract starting with "${sharedAddress.substring(0, 4)}".`
                    );
                }
            });
        });

        // ... or did a donor pay his donation?
        db.query("SELECT address FROM outputs WHERE unit = ?", [unit], (rows => {
            rows.forEach(async (row) => {
                const contract = await getContractBySharedAddress(row.address);

                if (contract && contract.Completed !== 1) {
                    // TODO - Check the amount transferred from Donor and make sure it matches the required amount.
                    device.sendMessageToDevice(
                        contract.DonorDevice,
                        "text",
                        `Your donation of ${contract.Price}$ has now been submitted. ` +
                        "You will receive a message once the donation has been fully processed."
                    );
                } else if (contract && contract.Completed === 1) {
                    device.sendMessageToDevice(
                        contract.DonorDevice,
                        "text",
                        "ERROR: The contract is already completed"
                    );
                }
            });
        }));
    });
});

/**
 * Event send once transactions become stable
 */
eventBus.on("my_transactions_became_stable", async (arrUnits) => {
    arrUnits.forEach((unit) => {
        // Is the producer able to claim funds?
        db.query("SELECT * FROM data_feeds WHERE unit = ?", [unit], (rows) => {
            rows.forEach(async (row) => {
                const contract = await getContractByConfirmKey(row.feed_name);

                // Did reception of a product become stable?
                if (contract && contract.Completed === 1) {
                    const sharedAddress = String(contract.SharedAddress);
                    const product = await getProductAndReceiverByApplicationId(contract.ApplicationId);

                    device.sendMessageToDevice(
                        contract.ProducerDevice,
                        "text",
                        `${product.FirstName} ${product.SurName} just confirmed receipt of ` +
                        `${product.title} + worth ${contract.Price} and ` +
                        `the funds on smart wallet starting with ${sharedAddress.substring(0, 4)} ` +
                        `can be withdrawn now.`
                    );
                }
            });
        });

        // Did a donation become stable?
        db.query("SELECT address FROM outputs WHERE unit = ?", [unit], (rows => {
            rows.forEach(async (row) => {
                const contract = await getContractBySharedAddress(row.address);

                // Did a donation become stable?
                if (contract && contract.Completed !== 1) {
                    await completeContract(contract.ApplicationId);
                    await updateApplicationStatus(contract.ApplicationId, ApplicationStatus.PENDING);
                    const sharedAddress = String(contract.SharedAddress);
                    const product = await getProductByApplicationId(contract.ApplicationId);

                    device.sendMessageToDevice(
                        contract.DonorDevice,
                        "text",
                        "Your donation has now been processed. Thank you for your contribution! " +
                        `Should the receiver not pick up the product within 30 days, ` +
                        ` you may claim the money from the contract starting with "${sharedAddress.substring(0, 4)}".`
                    );

                    device.sendMessageToDevice(
                        contract.ProducerDevice,
                        "text",
                        `A donation has been made for \"${product.Title}\" worth ${contract.Price}USD ` +
                        `and funds are now stored on the smart contract ` +
                        `starting with \"${sharedAddress.substring(0, 4)}\". ` +
                        `They will be available to you when the recipient confirms reception of the product.`
                    );
                }
            });
        }));
    });
});
