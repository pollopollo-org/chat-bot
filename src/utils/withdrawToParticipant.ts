import { state } from "../state";
import { getContractByApplicationId } from "./getContract";
import { Participant } from "./offerContract";

/**
 * Withdraw funds to the Producer
 */
export async function withdrawToProducer(applicationId: string, recipient: Participant) {     
    
    // First retrieve the contract details based on applicationId
    let contract = await getContractByApplicationId(applicationId);
    
    if (!contract) {
        throw new Error(`Application with ID ${applicationId} not found`);
    } else {
        await state.wallet.sendAllBytesFromAddress(contract.SharedAddress, recipient.walletAddress, recipient.deviceAddress, (err, unit) => {
            if (err) {
                return callback(`Failed to make payment from ${contract.SharedAddress} to ${recipient.walletAddress}: ${err}`);
            }
            // Update the contract's Bytes
            // TODO - IMPLEMENT CALL
            callback(null, unit);
        });
    }
}