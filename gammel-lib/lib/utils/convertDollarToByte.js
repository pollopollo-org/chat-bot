"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_1 = require("../state");
const GB = 1000000000;
function convertDollarToByte(dollars) {
    return Math.round(dollars / state_1.state.rates.GBYTE_USD * GB);
}
exports.convertDollarToByte = convertDollarToByte;
//# sourceMappingURL=convertDollarToByte.js.map