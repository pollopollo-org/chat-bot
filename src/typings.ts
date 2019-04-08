import { CountryCodes } from "./config/countryCodes";

export type ProductModelData = {
    productId: number;
    country: CountryCodes;
    description: string;
    title: string;
    price: number;
    available: boolean;
    userId: number;
    thumbnail: string;
};