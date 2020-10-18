import { aaConfirm } from "./aainteraction";

/**
 * Trigger the AA when Reciever confirms receipt of
 * a product so money gets sent to the Producer
 */
export async function confirmReceipt(applicationId: string) {

    await aaConfirm(applicationId, async (err, unit) => {
        if (err) {
            console.error(`Error trying to confirm receipt for application: ${applicationId} \n error message: ${err.message}`);
        } else {
            console.error(`Successfully confirmed receipt for application: ${applicationId}`);
            console.error(`Unit sent to the AA: ${unit}`);
        }
    });
}
