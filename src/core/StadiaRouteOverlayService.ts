import { assertProviderApiKey, ProviderRateLimitTracker, executeRateLimited } from "places-shared/services";
import { ValhallaClient } from "./ValhallaClient";
import { ValhallaRouteOverlayService } from "./ValhallaRouteOverlayService";
import { trimBaseUrl, type ProviderSettings, type RouteHttpClient } from "places-shared/services";

export const DEFAULT_STADIA_BASE_URL = "https://api.stadiamaps.com";

export const stadiaRateLimits = new ProviderRateLimitTracker();

export class StadiaClient extends ValhallaClient {
  constructor(settings: ProviderSettings, http: RouteHttpClient) {
    super(settings, request => executeRateLimited(
      stadiaRateLimits,
      new URL(request.url).pathname.split('/').filter(Boolean)[0] ?? 'stadia',
      () => http(request),
    ), async () => {});
  }

  protected override operationUrl(operation: string): string {
    const key = this.settings.apiKey ?? "";

    return `${this.getBaseUrl()}/${operation}/v1?api_key=${encodeURIComponent(key)}`;
  }

  protected override getBaseUrl(): string {
    return trimBaseUrl(this.settings.baseUrl, DEFAULT_STADIA_BASE_URL);
  }
}

export class StadiaRouteOverlayService extends ValhallaRouteOverlayService {
  constructor(settings: ProviderSettings, http: RouteHttpClient, client?: ValhallaClient) {
    assertProviderApiKey(settings.apiKey, "Stadia Maps");
    super(settings, http, client ?? new StadiaClient(settings, http));
  }

  override getProviderName(): string {
    return "stadia";
  }
}
