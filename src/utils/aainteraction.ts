import { state } from "../state";

const aaAddress = "UA2OPEG2BLTAAPZGWQ4IHEZLHOD22BBJ";
/**
 * Create a new application
 * Producer: Wallet address of the producer that will provide the product
 * Amount: Amount of Bytes required to fill this application
 * Stablecoin: Whether or not a stablecoin should be used instead of Bytes
*/
export function aaCreateApplication(Producer: string, Amount: number, stablecoin: boolean) {
    const aaVars = {
        "action" : "create",
        "producer" : Producer,
        "amount": Amount,
        "stable": (stablecoin ? "1" : "0")
    };
    callAa(aaVars);
}

/*
 * Cancel an application
 * ApplicationId: Unit ID from the Application on the AA - can be found in the AA's state vars
 */
export function aaCancelApplication(ApplicationID: string) {
    const aaVars = {
        "action": "cancel",
        "id": ApplicationID
    };
    callAa(aaVars);
}

/*
 * Make a donation
 * Moves funds from Donor's account to a given application
 * ApplicationId: Unit ID from the Application on the AA - can be found in the AA's state vars
 * Donor: The donor account on the AA represented by the donor's wallet address
 */
export function aaDonate(ApplicationId: string, Donor: string) {
    const aaVars = {
        "action": "donate",
        "id": ApplicationId,
        "donor": Donor
    };
    callAa(aaVars);
}

/*
 * Return funds from application to Donor
 * In case an applicant never confirms receipt, the donor can
 * request donated funds to be sent back
 * ApplicationId: Unit ID from the Application on the AA - can be found in the AA's state vars
 * Address: The unique account of the Donor - can be found in the AA's state vars for the given application
 */
export function aaReturn(ApplicationId: string, Address: string) {
    const aaVars = {
        "action": "return",
        "id": ApplicationId,
        "address": Address
    };
    callAa(aaVars);
}

/*
 * Confirm application's completion
 * When an applicant confirms receipt of the donated product, the application must be Confirmed,
 * thereby releasing funds to the Producer that provides the product of the given Application
 * ApplicationID: Unit ID from the Application on the AA - can be found in the AA's state vars
 */
export function aaConfirm(ApplicationId: string) {
    const aaVars = {
        "action": "confirm",
        "id": ApplicationId
    };
    callAa(aaVars);
}

/*
 * General parameters that are the same for all calls to the AA 
 * as well as the actual composition of the trigger unit
 */
function callAa(aaVars) {
    state.wallet.issueOrSelectAddressByIndex(0, 0, (botWallet) => {
        const params = {
            paying_addresses: [botWallet],
            change_address: botWallet,
            messages: [
                {
                    app: "data",
                    payload: aaVars
                }
            ],
            to_address: aaAddress,
            amount: 10000
        };
        state.wallet.sendMultiPayment(params);
    });
}