import type { Order, Witnesses } from "./managed/shade/contract/index.js";
export type ShadePrivateState = {
    submitOrder?: {
        order: Order;
        nonce: Uint8Array;
    };
    matchOrderA?: {
        order: Order;
        nonce: Uint8Array;
    };
    matchOrderB?: {
        order: Order;
        nonce: Uint8Array;
    };
    cancelOrder?: {
        order: Order;
        nonce: Uint8Array;
    };
};
export declare const witnesses: Witnesses<ShadePrivateState>;
