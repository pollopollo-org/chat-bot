import { getContractByApplicationId } from "./getContract";
import { writeToDataFeed } from "./writeToDataFeed";

/**
 * Posts a message to the ledger that a Reciever has confirmed reception from
 * a Producer which means that money can be sent to Producer
 */
export async function confirmReception(applicationId: string) {
    const dataFeed = {};

    const contract = await getContractByApplicationId(applicationId);
    dataFeed[contract.ConfirmKey] = "confirmed";

    writeToDataFeed(dataFeed);
}
