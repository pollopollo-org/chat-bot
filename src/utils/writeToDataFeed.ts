const headlessWallet = require("headless-obyte");
import composer = require("ocore/composer.js");
import network = require("ocore/network.js");
import objectHash = require("ocore/object_hash.js");
import { state } from "../state";

/**
 * Posts a message to a given datafeed
 */
export function writeToDataFeed(dataFeed: unknown) {
    const params = {
        paying_addresses: [state.bot.walletAddress],
        outputs: [{ address: state.bot.walletAddress, amount: 0 }],
        signer: headlessWallet.signer,
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

    composer.composeJoint(params);
}
