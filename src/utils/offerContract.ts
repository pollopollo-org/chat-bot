import { Buffer } from "buffer";
import conf = require("ocore/conf");
import device = require("ocore/device.js");
import walletDefinedByAddresses = require("ocore/wallet_defined_by_addresses.js");

import { state } from "../state";
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
export function offerContract(donor: Participant, producer: Participant, bot: Participant, price: number, applicationId: string) {
    const hasRecievedClause = ["in data feed", [
        [bot.walletAddress],
        `${applicationId}`,
        "=",
        "true"
    ]];

    const contract = ["or", [
        ["and", [
            ["address", producer.walletAddress],
            hasRecievedClause
        ]],
        ["and", [
            ["address", donor.walletAddress],
            ["mci", ">", 1000 * 60 * 60 * 24 * 30]
        ]],
        ["and", [
            ["address", bot.walletAddress],
            ["mci", ">", 1000 * 60 * 60 * 24 * 30 * 3]
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
            address: bot.walletAddress,
            member_signing_path: "r",
            device_address: bot.deviceAddress
        }
    };

    walletDefinedByAddresses.createNewSharedAddress(contract, assocSignersByPath, {
        ifError: async (err) => {
            await logEvent(LoggableEvents.FAILED_TO_OFFER_CONTRACT, { donor, producer, applicationId, price, error: err });
        },

        ifOk: async (sharedAddress) => {
            await logEvent(LoggableEvents.OFFERED_CONTRACT, { donor, producer, applicationId, price, sharedAddress });
            const arrPayments = [{ address: sharedAddress, amount: price, asset: "base" }];
            const assocDefinitions = {};
            assocDefinitions[sharedAddress] = {
                definition: contract,
                signers: assocSignersByPath
            };
            await storeContract(Number.parseInt(applicationId, 10));
            const objPaymentRequest = { payments: arrPayments, definitions: assocDefinitions };
            const paymentJson = JSON.stringify(objPaymentRequest);
            const paymentJsonBase64 = new Buffer(paymentJson).toString("base64");
            const paymentRequestCode = `payment: ${paymentJsonBase64}`;
            const paymentRequestText = `[your share of payment to the contract](${paymentRequestCode})`;
            device.sendMessageToDevice(donor.deviceAddress, "text", paymentRequestText);

            state.applicationId = applicationId;
        }
    });
}
