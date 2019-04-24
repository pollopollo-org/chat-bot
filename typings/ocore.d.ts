declare module 'ocore/device.js' {
    export enum SendFormats {
        TEXT = "text",
    }

    export function sendMessageToDevice(returnAddress: string, format: SendFormats, message: unknown): void;
}

declare module 'ocore/event_bus.js' {
    export function on(method: "text", callback: (fromAddress: string, message: string) => void);
}