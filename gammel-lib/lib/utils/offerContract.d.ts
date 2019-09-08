export declare type Participant = {
    walletAddress: string;
    deviceAddress: string;
};
export declare function offerContract(donor: Participant, producer: Participant, price: number, applicationId: string): void;
