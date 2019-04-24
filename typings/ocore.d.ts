declare module 'ocore/device.js' {
    export function sendMessageToDevice(returnAddress: string, format: unknown, message: unknown): void;
}

declare module 'ocore/event_bus.js' {
    export function on(method: "text", callback: (fromAddress: string, message: string) => void);
}