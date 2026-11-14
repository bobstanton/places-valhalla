import { ProviderRateLimitTracker } from "places-shared/services";
import { ValhallaClient } from "./ValhallaClient";
import { ValhallaRouteOverlayService } from "./ValhallaRouteOverlayService";
import { type ProviderSettings, type RouteHttpClient } from "places-shared/services";
export declare const DEFAULT_STADIA_BASE_URL = "https://api.stadiamaps.com";
export declare const stadiaRateLimits: ProviderRateLimitTracker;
export declare class StadiaClient extends ValhallaClient {
    constructor(settings: ProviderSettings, http: RouteHttpClient);
    protected operationUrl(operation: string): string;
    protected getBaseUrl(): string;
}
export declare class StadiaRouteOverlayService extends ValhallaRouteOverlayService {
    constructor(settings: ProviderSettings, http: RouteHttpClient, client?: ValhallaClient);
    getProviderName(): string;
}
