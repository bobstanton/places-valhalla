import { type ProviderSettings, type RouteHttpClient } from "places-shared/services";
export declare const DEFAULT_VALHALLA_BASE_URL = "https://valhalla1.openstreetmap.de";
export declare const VALHALLA_CLIENT_ID = "places-obsidian";
export declare class ValhallaClient {
    protected readonly settings: ProviderSettings;
    private readonly http;
    private readonly waitForRequest;
    constructor(settings: ProviderSettings, http: RouteHttpClient, waitForRequest?: () => Promise<void>);
    protected operationUrl(operation: string): string;
    postJson(operation: string, body: unknown, requestSummary?: string): Promise<unknown>;
    protected getBaseUrl(): string;
}
