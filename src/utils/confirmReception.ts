import { writeToDataFeed } from "./writeToDataFeed";

/**
 * Posts a message to the ledger that a Reciever has confirmed reception from
 * a Producer which means that money can be sent to Producer
 */
export function confirmReception(applicationId: string) {
    const dataFeed = {};
    dataFeed[applicationId] = "true";

    writeToDataFeed(dataFeed);
}
