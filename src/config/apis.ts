const basePath = "http://localhost:4000/api";

// tslint:disable completed-docs
export type EndpointData = {
    path: string;
    method: string;
    errors: Errors;
};

export type Errors = {
    [key: number]: string;
};

export const apis = {
    producer: {
        setInformation: {
            path: `${basePath}/users/wallet`,
            method: "PUT",
            errors: {
                404: "Unable to set information since a related Producer on PolloPollo.org was not found."
            }
        },
        count: {
            path: `${basePath}/users/countproducer`,
            method: "GET",
            errors: {
                404: "No producers found."
            }
        }
    },
    products: {
        count: {
            path: `${basePath}/products/count`,
            method: "GET",
            errors: {
                404: "No products found."
            }
        }
    },
    receivers: {
        count: {
            path: `${basePath}/users/countreceiver`,
            method: "GET",
            errors: {
                404: "No receivers found."
            }
        }
    },
    applications: {
        updateToPending: {
            path: `${basePath}/applications`,
            method: "PUT",
            errors: {
                404: "Application not found."
            }
        },
        getContractData: {
            path: `${basePath}/applications/contractinfo/{applicationId}`,
            method: "GET",
            errors: {}
        },
        aaCreated: {
            path: `${basePath}/applications/aacreated`,
            method: "PUT",
            errors: {}
        },
        aaConfirmed: {
            path: `${basePath}/applications/aaDonationConfirmed`,
            method: "PUT",
            errors: {}
        }
    },
    donors: {
        aaDonorDeposited: {
            path: `${basePath}/donors/aaDonorDeposited`,
            method: "PUT",
            errors: {}
        }
    }
};
