import { Participant } from "./offerContract";
export declare function createContractsTable(connection: any): Promise<void>;
export declare function storeContract(sharedAddress: string, applicationId: number, timestamp: Date, confirmKey: string, donor: Participant, producer: Participant, price: number): Promise<void>;
export declare function completeContract(applicationId: string): Promise<void>;
