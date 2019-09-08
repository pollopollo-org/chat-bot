"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getContract_1 = require("./getContract");
const writeToDataFeed_1 = require("./writeToDataFeed");
async function confirmReception(applicationId) {
    const dataFeed = {};
    const contract = await getContract_1.getContractByApplicationId(applicationId);
    dataFeed[contract.ConfirmKey] = "confirmed";
    writeToDataFeed_1.writeToDataFeed(dataFeed);
}
exports.confirmReception = confirmReception;
//# sourceMappingURL=confirmReception.js.map