import { AA } from "aagent.js";
import { state } from "../state";

// ** explictly disable some linting rules for this file, rules are space separated **
/* tslint:disable:max-func-body-length no-void-expression */

const aaAddress = "UA2OPEG2BLTAAPZGWQ4IHEZLHOD22BBJ";

/**
 * Create a new application
 * producer: Wallet address of the producer that will provide the product
 * amount: Amount of Bytes required to fill this application
 * stableCoin: Whether or not a stablecoin should be used instead of Bytes
 */
export async function aaCreateApplication(producer: string, amount: number, stableCoin: boolean, onDone) {
    if (!onDone) {

        return new Promise(async (resolve, reject) => {
            await aaCreateApplication(producer, amount, stableCoin, (err, unit) => {
                if (err) {

                    return reject(new Error(err));
                }

                return resolve(unit);
            });
        });
    }
    const aaVars = {
        action : "create",
        producer : producer,
        amount: amount,
        stable: (stableCoin ? "1" : "0")
    };
    await callAa(aaVars, onDone);
}

/**
 * Cancel an application
 * applicationID: Unit ID from the Application on the AA - can be found in the AA's state vars
 */
export async function aaCancelApplication(applicationID: string, onDone) {
    if (!onDone) {

        return new Promise(async (resolve, reject) => {
            await aaCancelApplication(applicationID, (err, unit) => {
                if (err) {

                    return reject(new Error(err));
                }

                return resolve(unit);
            });
        });
    }
    const aaVars = {
        action: "cancel",
        id: applicationID
    };
    await callAa(aaVars, onDone);
}

/**
 * Make a donation
 * Moves funds from Donor's account to a given application
 * applicationId: Unit ID from the Application on the AA - can be found in the AA's state vars
 * donor: The donor account on the AA represented by the donor's wallet address
 */
export async function aaDonate(applicationId: string, donor: string, onDone) {
    if (!onDone) {

        return new Promise(async (resolve, reject) => {
            await aaDonate(applicationId, donor, (err, unit) => {
                if (err) {

                    return reject(new Error(err));
                 }

                return resolve(unit);
            });
        });
    }
    const aaVars = {
        action: "donate",
        id: applicationId,
        donor: donor
    };
    await callAa(aaVars, onDone);
}

/**
 * Return funds from application to Donor
 * In case an applicant never confirms receipt, the donor can
 * request donated funds to be sent back
 * applicationId: Unit ID from the Application on the AA - can be found in the AA's state vars
 * address: The unique account of the Donor - can be found in the AA's state vars for the given application
 */
export async function aaReturn(applicationId: string, address: string, onDone) {
    if (!onDone) {

        return new Promise(async (resolve, reject) => {
            await aaReturn(applicationId, address, (err, unit) => {
                if (err) {
                    return reject(new Error(err));
                }

                return resolve(unit);
            });
        });
    }
    const aaVars = {
        action: "return",
        id: applicationId,
        address: address
    };
    await callAa(aaVars, onDone);
}

/**
 * Confirm application's completion
 * When an applicant confirms receipt of the donated product, the application must be Confirmed,
 * thereby releasing funds to the Producer that provides the product of the given Application
 * applicationId: Unit ID from the Application on the AA - can be found in the AA's state vars
 */
export async function aaConfirm(applicationId: string, onDone) {
    if (!onDone) {
        return new Promise(async (resolve, reject) => {
            await aaConfirm(applicationId, (err, unit) => {
                if (err) {
                    return reject(new Error(err));
                 }

                return resolve(unit);
            });
        });
    }
    const aaVars = {
        action: "confirm",
        id: applicationId
    };
    await callAa(aaVars, onDone);
}

/**
 * General parameters that are the same for all calls to the AA
 * as well as the actual composition of the trigger unit
 */
async function callAa(aaVars, onDone) {
    if (!onDone) {
        return new Promise(async (resolve, reject) => {
            await callAa(aaVars, (err, unit) => {
                if (err) {

                    return reject(new Error(err));
                }

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

/**
 * Retrieve the balance of a donor's account on the AA
 */
export async function getDonorBalance(aaAccount: string) {

    const donorBalance = await AA.getAAVars(aaAddress, {var_prefix_from: `acctb_${aaAccount}`, var_prefix_to: `acctb_${aaAccount}`});

    return donorBalance[`acctb_${aaAccount}`];
}

/**
 * Retrieve the balance of an Application
 */
export async function getApplicationBalance(applicationId: string) {
    const application = await AA.getAAVars(aaAddress, {var_prefix_from: applicationId, var_prefix_to: applicationId});

    return application[`${applicationId}_amount`] ? application[`${applicationId}_amount`] : 0;
}

/**
 * Return the amount required to fill an application
 */
export async function getApplicationRequestedAmount(applicationId: string) {
    const application = await AA.getAAVars(aaAddress, {var_prefix_from: applicationId, var_prefix_to: applicationId});

    return application[`${applicationId}_amount_r`] ? application[`${applicationId}_amount_r`] : 0;
}
