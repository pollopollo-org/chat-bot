"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventBus = require("ocore/event_bus.js");
const network = require("ocore/network.js");
const headlessWallet = require("headless-obyte");
exports.state = {
    rates: network.exchangeRates,
    wallet: headlessWallet
};
eventBus.on("rates_updated", () => {
    exports.state.rates = network.exchangeRates;
});
//# sourceMappingURL=state.js.map