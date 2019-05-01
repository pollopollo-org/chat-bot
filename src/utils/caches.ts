/**
 * Is used to temporarirly store (and pair) a device address to a pairing secret
 */
export const pairingCache: Map<string, string> = new Map();

/**
 * Is used to temporarirly store and associate a donor to a specfic application-id
 */
export const donorCache: Map<string, string> = new Map();