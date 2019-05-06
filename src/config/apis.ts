const basePath = "https://localhost:4001/api";

export type Errors = {
    [key: number]: string;
};

export const apis = {
    producer: {
        setInformation: {
            path: `${basePath}/users/wallet`,
            method: "PUT",
            errors: {
                404: "Unable to set information since there wasn't found a related Producer on PolloPollo.org"
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
        }
    }
};
