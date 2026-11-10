import type { ConnectOptions } from "mongoose";

/** Shared by the API and maintenance scripts, including standalone deployments. */
export function mongoConnectionOptions(options: ConnectOptions = {}): ConnectOptions {
    return { ...options, retryWrites: false };
}

