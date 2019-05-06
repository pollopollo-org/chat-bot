const headlessWallet = require("headless-obyte");
import composer = require("ocore/composer.js");
import network = require("ocore/network.js");
import objectHash = require("ocore/object_hash.js");
import { state } from "../state";

/**
 * Helper that writes the given feed to the dataFeed.
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

/**
 * Posts a message to the ledger that a Reciever has confirmed reception from
 * a Producer which means that money can be sent to Producer
 */
export function confirmReception(applicationId: string) {
    const dataFeed = {};
    dataFeed[applicationId] = "true";

    writeToDataFeed(dataFeed);
}
