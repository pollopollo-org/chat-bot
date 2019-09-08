import { Participant } from "./offerContract";
export declare enum LoggableEvents {
    REGISTERED_USER = 0,
    OFFERED_CONTRACT = 1,
    FAILED_TO_OFFER_CONTRACT = 2,
    PAYMENT_BECAME_STABLE = 3,
    UNKNOWN = 4
}
declare type withError = {
    error?: string;
};
declare type RegisteredUserData = {
    wallet: string;
    device: string;
    pairingSecret: string;
} & withError;
declare type ContractData = {
    applicationId: string;
    donor: Participant;
    producer: Participant;
    sharedAddress: string;
    price: number;
} & withError;
declare type PaymentStableData = {
    applicationId: string;
} & withError;
declare type CombinedData = RegisteredUserData | ContractData | PaymentStableData | withError;
export declare function logEvent(evtType: LoggableEvents, data: CombinedData): void;
export {};
