"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const composer = require("ocore/composer.js");
const network = require("ocore/network.js");
const objectHash = require("ocore/object_hash.js");
const state_1 = require("../state");
function writeToDataFeed(dataFeed) {
    state_1.state.wallet.issueOrSelectAddressByIndex(0, 0, (botWallet) => {
        const params = {
            paying_addresses: [botWallet],
            outputs: [{ address: botWallet, amount: 0 }],
            signer: state_1.state.wallet.signer,
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
    });
}
exports.writeToDataFeed = writeToDataFeed;
//# sourceMappingURL=writeToDataFeed.js.map