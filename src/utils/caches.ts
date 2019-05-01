/**
 * Is used to temporarirly store (and pair) a device address to a pairing secret
 */
export const pairingCache: Map<string, string> = new Map();

/**
 * Is used to temporarirly store and associate a donor to a specfic application-id
 */
export const donorCache: Map<string, string> = new Map();

/**
 * The reverse of the donor cache. Essentially a cache that maps from donor address
 * to application id.
 */
export const applicationCache: Map<string, string> = new Map();
