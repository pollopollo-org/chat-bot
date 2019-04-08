const basePath = "https://api.pollopollo.org/api";

export type Errors = {
    [key: number]: string;
}

export const apis = {
    producer: {
        count: {
            path: `${basePath}/users/countproducer`,
            method: "GET",
            errors: {
                404: "No producers found.",
            }
        },
    },
    products: {
        count: {
            path: `${basePath}/products/count`,
            method: "GET",
            errors: {
                404: "No products found."
            }
        },
    },
    receivers: {
        count: {
            path: `${basePath}/users/countreceiver`,
            method: "GET",
            errors: {
                404: "No receivers found.",
            }
        }
    }
}
