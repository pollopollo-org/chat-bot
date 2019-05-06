declare module 'ocore/device.js' {
    export function sendMessageToDevice(returnAddress: string, format: unknown, message: unknown): void;
    export function getMyDeviceAddress(): string;
}

declare module 'ocore/event_bus.js' {
    export function on(method: "text", callback: (fromAddress: string, message: string) => void);
    export function on(method: "rates_updated", callback: (exchangeRates: any) => void);
    export function on(method: "my_transactions_became_stable", callback: (arrUnits: []) => void);
    export function on(method: "paired", callback: (fromAddress: string, pairingSecret: string) => void);
    export function on(method: "headless_wallet_ready", callback: () => void);
}

type callbacks = {
    ifError: (err: any) => void;
    ifOk: (shared_address: string) => void;
}

declare module 'ocore/wallet_defined_by_addresses.js' {
    export function createNewSharedAddress(arrDefinition: any[], assocSignersByPath: { [key: string]: any }, callbacks: callbacks);
}

declare module 'ocore/network.js' {
    export function broadcastJoint(obj: unknown);

    export const exchangeRates: {
        BTC_USD: number;
        GBYTE_BTC: number;
        GBYTE_USD: number;
        GBB_GBYTE: number;
        GBB_USD: number;
        GBB_BTC: number;
    }
}
