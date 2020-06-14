import { Buffer } from "buffer";
import device = require("ocore/device.js");
import walletDefinedByAddresses = require("ocore/wallet_defined_by_addresses.js");

import { ApplicationStatus, updateApplicationStatus } from "../requests/requests";
import { state } from "../state";
import { convertDollarToByte } from "./convertDollarToByte";
import { logEvent, LoggableEvents } from "./logEvent";
import { storeContract } from "./storeContract";

export type Participant = {
    /**
     * Specifies the address to the wallet used in relation to the payment of the
     * contract
     */
    walletAddress: string;

    /**
     * Specifies the physical address of the device associated with the wallet
     */
    deviceAddress: string;
};

/**
 * Method that'll, based on a variaty of parameters creates a contract for a donor
 * to sign
 */
export function offerContract(donor: Participant, producer: Participant, price: number, applicationId: string) {
    state.wallet.issueOrSelectAddressByIndex(0, 0, async (botWallet) => {
        const botDeviceAddress = device.getMyDeviceAddress();

        const timestamp = new Date();
        const confirmKey = `receiver_has_received_${timestamp.getTime()}_${applicationId}`;

        // Money can be extracted via the following criteria
        // 1. Producer can extract money if the Receiver has indicated reception of goods
        // 2. Donor can extract money if more than 30 days have passed
        // 3. Bot can spend money if more then 90 days have passed (safety mechanism)
        // 4. Bot can spend money on behalf of producer but only if conditions for 1 are met and the spend is to the producer's wallet
        // 5. Bot can spend money on behalf of donor but only if conditions for 2 are met and the spend is to the donor's wallet
        const contract = ["or", [
            ["and", [
                ["address", producer.walletAddress],
                ["in data feed", [
                    [botWallet],
                    confirmKey,
                    "=",
                    "confirmed"
                ]]
            ]],
            ["and", [
                ["address", donor.walletAddress],
                ["timestamp", [">", Math.round(Date.now()/1000 + 60 * 60 * 24 * 30)]],
                ["not"], 
                    ["in data feed", [
                        [botWallet],
                        "=",
                        "confirmed"
                    ]
                ]]
            ]],
            // Allow the chatbot to withdraw funds to itself if 90 days have passed and neither Donor or Producer withdraw
            // This is the only safety mechanism we have and has proven to be needed if either donor or producer lose
            // access to their wallet due to breaking phones, or due to theft of the device they have their wallet on.
            // We need this to avoid funds being stuck for all eternity. Any funds withdrawn by the chatbot will be
            // donated to the next oldest open application.
            ["and", [
                ["address", botWallet],
                ["timestamp", [">", Math.round(Date.now()/1000 + 60 * 60 * 24 * 30 * 3)]]
            ]],
            // Allow the chatbot to withdraw funds to the producer if all conditions for that are met
            ["and", [
                ["address", botWallet],
                ["has", {what: "output", asset: "base", address: producer.walletAddress}],
                ["in data feed", [
                    [botWallet],
                    confirmKey,
                    "=",
                    "confirmed"
                ]]
            ]],
            // Allow the chatbot to withdraw funds to the donor if all conditions for that are met
            ["and", [
                ["address", botWallet],
                ["timestamp", [">", Math.round(Date.now()/1000 + 60 * 60 * 24 * 30)]],
                ["has", {what: "output", asset: "base", address: donor.walletAddress}],
                ["not"], [
                        "in_data_feed", [ 
                            [botWallet], 
                            "=", 
                            "confirmed" 
                        ]
                    ]
            ]]
        ];

        const assocSignersByPath = {
            "r.0.0": {
                address: producer.walletAddress,
                member_signing_path: "r", // unused, should be always "r"
                device_address: producer.deviceAddress
            },
            "r.1.0": {
                address: donor.walletAddress,
                member_signing_path: "r", // unused, should be always "r"
                device_address: donor.deviceAddress
            },
            "r.2.0": {
                address: botWallet,
                member_signing_path: "r",
                device_address: botDeviceAddress
            }
        };

        // Now that we've constructed the contract, then create a shared address
        // to contain it!
        walletDefinedByAddresses.createNewSharedAddress(contract, assocSignersByPath, {
            ifError: async (err) => {
                device.sendMessageToDevice(
                    donor.deviceAddress,
                    "text",
                    "Something went wrong while creating the contract. Please try again later."
                );
                logEvent(LoggableEvents.FAILED_TO_OFFER_CONTRACT, { donor, producer, applicationId, price, error: err });
            },

            ifOk: async (sharedAddress) => {
                logEvent(LoggableEvents.OFFERED_CONTRACT, { donor, producer, applicationId, price, sharedAddress });

                // Create the actual payment to send to the donor
                const arrPayments = [{ address: sharedAddress, amount: convertDollarToByte(price), asset: "base" }];
                const assocDefinitions = {};
                assocDefinitions[sharedAddress] = {
                    definition: contract,
                    signers: assocSignersByPath
                };

                const objPaymentRequest = { payments: arrPayments, definitions: assocDefinitions };
                const paymentJson = JSON.stringify(objPaymentRequest);
                const paymentJsonBase64 = new Buffer(paymentJson).toString("base64");
                const paymentRequestCode = `payment:${paymentJsonBase64}`;
                const paymentRequestText = `[Please pay your donation here](${paymentRequestCode})`;
                device.sendMessageToDevice(donor.deviceAddress, "text", paymentRequestText);

                // Store a local copy of the contract in order to be able to retrieve
                // metadata later on
                await storeContract(
                    sharedAddress,
                    Number.parseInt(applicationId, 10),
                    timestamp,
                    confirmKey,
                    donor,
                    producer,
                    price,
                    arrPayments[0].amount
                );
            }
        });
    });
}
