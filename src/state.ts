import eventBus = require("ocore/event_bus.js");
import network = require("ocore/network.js");

/**
 * Contains a state configuration object kept only in memory, and will be reconstructed
 * on reboot
 */
export const state = {
    rates: network.exchangeRates
};

/**
 * Ensure exchangeRates are always kept up to date
 */
eventBus.on("rates_updated", () => {
    state.rates = network.exchangeRates;
});
