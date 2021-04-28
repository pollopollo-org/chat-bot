import composer = require("ocore/composer.js");
import network = require("ocore/network.js");
import objectHash = require("ocore/object_hash.js");
import { state } from "../state";

/**
 * Posts a message to a given datafeed
 */
export function writeToDataFeed(dataFeed: unknown) {
    state.wallet.issueOrSelectAddressByIndex(0, 0, (botWallet) => {
        const params = {
            paying_addresses: [botWallet],
            outputs: [{ address: botWallet, amount: 10000 }],
            signer: state.wallet.signer,
            callbacks: composer.getSavingCallbacks({
                ifNotEnoughFunds: console.error,
                ifError: console.error,
                ifOk: (objJoint) => {
                    network.broadcastJoint(objJoint);
                }
            }),
            messages: [
                {
                    app: "data_feed",
                    payload_location: "inline",
                    payload_hash: objectHash.getBase64Hash(dataFeed),
                    payload: dataFeed
                }
            ]
        };

        let opts = {
            paying_addresses: params.paying_addresses,
            messages: params.messages
        }
        state.wallet.issueChangeAddressAndSendMultiPayment(opts, (err, unit) => {
            if (err) {
                //TODO: Implement error handling
                return;
            }
            // TODO: Possibly send unit to the donor
        });
    });
}
