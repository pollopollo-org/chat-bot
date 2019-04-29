import eventBus = require("ocore/event_bus.js");
import network = require("ocore/network.js");

eventBus.on("rates_updated", () => {
    console.log(JSON.stringify(network.exchangeRates, undefined, 2));
});

/**
 * Contains a state configuration object kept only in memory, and will be reconstructed
 * on reboot
 */
export const state = {
    applicationId: "",
    rates: network.exchangeRates
};
