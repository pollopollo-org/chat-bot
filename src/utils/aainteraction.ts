import { state } from "../state";
import { AA, } from "aagent.js";
import { resolve } from "dns";
import { rejects } from "assert";

const aaAddress = "UA2OPEG2BLTAAPZGWQ4IHEZLHOD22BBJ";

/**
 * Create a new application
 * Producer: Wallet address of the producer that will provide the product
 * Amount: Amount of Bytes required to fill this application
 * Stablecoin: Whether or not a stablecoin should be used instead of Bytes
*/
export async function aaCreateApplication(Producer: string, Amount: number, Stablecoin: boolean, onDone) {
    if(!onDone) {
        return new Promise((resolve, reject) => {
            aaCreateApplication(Producer, Amount, Stablecoin, (err, unit) => {
                if (err) return reject(new Error(err));
                return resolve(unit);
            });
        });
    }
    const aaVars = {
        "action" : "create",
        "producer" : Producer,
        "amount": Amount,
        "stable": (Stablecoin ? "1" : "0")
    };
    await callAa(aaVars, onDone);
}


/*
 * Cancel an application
 * ApplicationId: Unit ID from the Application on the AA - can be found in the AA's state vars
 */
export async function aaCancelApplication(ApplicationID: string, onDone) {
    if (!onDone) {
        return new Promise((resolve, reject) => {
            aaCancelApplication(ApplicationID, (err, unit) => {
                if (err) return reject(new Error(err));
                return resolve(unit);
            });
        });
    }
    const aaVars = {
        "action": "cancel",
        "id": ApplicationID
    };
    await callAa(aaVars, onDone);
}

/*
 * Make a donation
 * Moves funds from Donor's account to a given application
 * ApplicationId: Unit ID from the Application on the AA - can be found in the AA's state vars
 * Donor: The donor account on the AA represented by the donor's wallet address
 */
export async function aaDonate(ApplicationId: string, Donor: string, onDone) {
    if (!onDone) {
        return new Promise((resolve, reject) => {
            aaDonate(ApplicationId, Donor, (err, unit) => {
                if (err) return reject(new Error(err));
                return resolve(unit);
            });
        });
    }
    const aaVars = {
        "action": "donate",
        "id": ApplicationId,
        "donor": Donor
    };
    await callAa(aaVars, onDone);
}

/*
 * Return funds from application to Donor
 * In case an applicant never confirms receipt, the donor can
 * request donated funds to be sent back
 * ApplicationId: Unit ID from the Application on the AA - can be found in the AA's state vars
 * Address: The unique account of the Donor - can be found in the AA's state vars for the given application
 */
export async function aaReturn(ApplicationId: string, Address: string, onDone) {
    if (!onDone) {
        return new Promise((resolve, reject) => {
            aaReturn(ApplicationId, Address, (err, unit) => {
                if (err) return reject(new Error(err));
                return resolve(unit);
            });
        });
    }
    const aaVars = {
        "action": "return",
        "id": ApplicationId,
        "address": Address
    };
    await callAa(aaVars, onDone);
}

/*
 * Confirm application's completion
 * When an applicant confirms receipt of the donated product, the application must be Confirmed,
 * thereby releasing funds to the Producer that provides the product of the given Application
 * ApplicationID: Unit ID from the Application on the AA - can be found in the AA's state vars
 */
export async function aaConfirm(ApplicationId: string, onDone) {
    if (!onDone) {
        return new Promise((resolve, reject) => {
            aaConfirm(ApplicationId, (err, unit) => {
                if (err) return reject(new Error(err));
                return resolve(unit);
            });
        });
    }
    const aaVars = {
        "action": "confirm",
        "id": ApplicationId
    };
    await callAa(aaVars, onDone);
}

/*
 * General parameters that are the same for all calls to the AA 
 * as well as the actual composition of the trigger unit
 */
async function callAa(aaVars, onDone) {
    if(!onDone) {
        return new Promise((resolve, reject) => {
            callAa(aaVars, (err, unit) => {
                if (err) return reject(new Error(err));
                return resolve(unit);
            });
        });
    }
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
        state.wallet.sendMultiPayment(params, onDone);
    });
}


/*
 * Retrieve the balance of a donor's account on the AA
*/
export async function getDonorBalance(aaAccount: string) {
        
    let donorBalance = await AA.getAAVars(aaAddress, {var_prefix_from: 'acctb_' + aaAccount, var_prefix_to: 'acctb_' + aaAccount});
    return donorBalance['acctb_' + aaAccount];
}

/*
 * Retrieve the balance of an Application
 */
export async function getApplicationBalance(applicationId: string) {
    let application = await AA.getAAVars(aaAddress, {var_prefix_from: applicationId, var_prefix_to: applicationId});
    return application[applicationId + "_amount"] ? application[applicationId + "_amount"] : 0;
}

/*
 * Return the amount required to fill an application
 */
export async function getApplicationRequestedAmount(applicationId: string) {
    let application = await AA.getAAVars(aaAddress, {var_prefix_from: applicationId, var_prefix_to: applicationId});
    return application[applicationId + "_amount_r"] ? application[applicationId + "_amount_r"] : 0;
}