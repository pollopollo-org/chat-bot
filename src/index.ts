const headlessWallet = require('headless-obyte');
import eventBus = require('ocore/event_bus.js');
import device = require('ocore/device.js');

import "./listener";

import { returnAmountOfProducers } from './requests/getCounts';

/**
 * user sends message to the bot
 */
eventBus.on('text', async(from_address: string, text: string) => {  
    const parsedText = text.toLowerCase();     

    switch (parsedText) {
        case "producers":

            break;

        case "products":
            returnAmountOfProducers(from_address);
            break;

        default:
            device.sendMessageToDevice(from_address, "text", "Unknown request.");
    }
});