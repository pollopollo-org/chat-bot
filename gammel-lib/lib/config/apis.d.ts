export declare type EndpointData = {
    path: string;
    method: string;
    errors: Errors;
};
export declare type Errors = {
    [key: number]: string;
};
export declare const apis: {
    producer: {
        setInformation: {
            path: string;
            method: string;
            errors: {
                404: string;
            };
        };
        count: {
            path: string;
            method: string;
            errors: {
                404: string;
            };
        };
    };
    products: {
        count: {
            path: string;
            method: string;
            errors: {
                404: string;
            };
        };
    };
    receivers: {
        count: {
            path: string;
            method: string;
            errors: {
                404: string;
            };
        };
    };
    applications: {
        updateToPending: {
            path: string;
            method: string;
            errors: {
                404: string;
            };
        };
        getContractData: {
            path: string;
            method: string;
            errors: {};
        };
    };
};
