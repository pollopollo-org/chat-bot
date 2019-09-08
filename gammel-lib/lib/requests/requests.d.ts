export declare enum ApplicationStatus {
    OPEN = 0,
    LOCKED = 1,
    PENDING = 2,
    COMPLETED = 3,
    UNAVAILABLE = 4
}
export declare function updateApplicationStatus(applicationId: string, status: ApplicationStatus, deviceAddress?: string): Promise<void>;
export declare function setProducerInformation(pairingSecret: string, walletAddress: string, deviceAddress: string): Promise<void>;
export declare function getContractData(applicationId: string, deviceAddress: string): Promise<{
    producerWallet: string;
    producerDevice: string;
    price: number;
} | void>;
