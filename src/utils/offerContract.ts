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
        // 2. Donor can extract money if more than 30 days elapses
        // 3. Bot can extract money if more then 90 days elapses (safety valve)
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
                ["in data feed", [
                    [botWallet],
                    "timestamp",
                    ">",
                    Date.now() + 1000 * 60 * 60 * 24 * 30
                ]]
            ]],
            ["and", [
                ["address", botWallet],
                ["in data feed", [
                    [botWallet],
                    "timestamp",
                    ">",
                    Date.now() + 1000 * 60 * 60 * 24 * 30 * 3
                ]]
            ]]
        ]];

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
                const paymentRequestCode = `payment: ${paymentJsonBase64}`;
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
