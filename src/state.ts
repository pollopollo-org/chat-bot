import eventBus = require("ocore/event_bus.js");
import network = require("ocore/network.js");
import { updateByteExchangeRate } from "./utils/storeContract";
const headlessWallet = require("headless-obyte");

/**
 * Contains a state configuration object kept only in memory, and will be reconstructed
 * on reboot
 */
export const state = {
    rates: network.exchangeRates,
    wallet: headlessWallet
};

/**
 * Ensure exchangeRates are always kept up to date
 */
eventBus.on("rates_updated", async () => {
    state.rates = network.exchangeRates;

    await updateByteExchangeRate(network.exchangeRates.GBYTE_USD);
});
