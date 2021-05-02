import composer = require("ocore/composer.js");
import network = require("ocore/network.js");
import objectHash = require("ocore/object_hash.js");
import { state } from "../state";

/**
 * Posts a message to a given datafeed
 */
export function writeToDataFeed(dataFeed: unknown) {
    state.wallet.issueOrSelectAddressByIndex(0, 0, (botWallet) => {
        let opts = {
            paying_addresses: [botWallet],
            messages: [
                {
                    app: "data_feed",
                    payload_location: "inline",
                    payload_hash: objectHash.getBase64Hash(dataFeed),
                    payload: dataFeed
                }
            ]
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
