
import { state } from "../state";

const GB = 1_000_000_000; // 1 GigaByte

/**
 * Helper to convert dollars to bytes
 */
export function convertDollarToByte(dollars: number) {
    return dollars / state.rates.GBYTE_USD * GB;
}
