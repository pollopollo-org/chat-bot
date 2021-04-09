
import { state } from "../state";

const GB = 1000000000; // 1 GigaByte

/**
 * Helper to convert dollars to bytes
 */
export function convertDollarToByte(dollars: number) {
    return Math.round(dollars / state.rates.GBYTE_USD * GB);
}
