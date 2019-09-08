"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
const device = require("ocore/device.js");
const walletDefinedByAddresses = require("ocore/wallet_defined_by_addresses.js");
const requests_1 = require("../requests/requests");
const state_1 = require("../state");
const convertDollarToByte_1 = require("./convertDollarToByte");
const logEvent_1 = require("./logEvent");
const storeContract_1 = require("./storeContract");
function offerContract(donor, producer, price, applicationId) {
    state_1.state.wallet.issueOrSelectAddressByIndex(0, 0, async (botWallet) => {
        const botDeviceAddress = device.getMyDeviceAddress();
        const timestamp = new Date();
        const confirmKey = `receiver_has_received_${timestamp.getTime()}_${applicationId}`;
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
                member_signing_path: "r",
                device_address: producer.deviceAddress
            },
            "r.1.0": {
                address: donor.walletAddress,
                member_signing_path: "r",
                device_address: donor.deviceAddress
            },
            "r.2.0": {
                address: botWallet,
                member_signing_path: "r",
                device_address: botDeviceAddress
            }
        };
        walletDefinedByAddresses.createNewSharedAddress(contract, assocSignersByPath, {
            ifError: async (err) => {
                device.sendMessageToDevice(donor.deviceAddress, "text", "Something went wrong while creating the contract. Please try again later.");
                logEvent_1.logEvent(logEvent_1.LoggableEvents.FAILED_TO_OFFER_CONTRACT, { donor, producer, applicationId, price, error: err });
            },
            ifOk: async (sharedAddress) => {
                logEvent_1.logEvent(logEvent_1.LoggableEvents.OFFERED_CONTRACT, { donor, producer, applicationId, price, sharedAddress });
                const arrPayments = [{ address: sharedAddress, amount: convertDollarToByte_1.convertDollarToByte(price), asset: "base" }];
                const assocDefinitions = {};
                assocDefinitions[sharedAddress] = {
                    definition: contract,
                    signers: assocSignersByPath
                };
                const objPaymentRequest = { payments: arrPayments, definitions: assocDefinitions };
                const paymentJson = JSON.stringify(objPaymentRequest);
                const paymentJsonBase64 = new buffer_1.Buffer(paymentJson).toString("base64");
                const paymentRequestCode = `payment: ${paymentJsonBase64}`;
                const paymentRequestText = `[Please pay your donation here](${paymentRequestCode})`;
                device.sendMessageToDevice(donor.deviceAddress, "text", paymentRequestText);
                await storeContract_1.storeContract(sharedAddress, Number.parseInt(applicationId, 10), timestamp, confirmKey, donor, producer, price);
                await requests_1.updateApplicationStatus(applicationId, requests_1.ApplicationStatus.LOCKED);
            }
        });
    });
}
exports.offerContract = offerContract;
//# sourceMappingURL=offerContract.js.map