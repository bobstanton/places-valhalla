import { FixedIntervalRateLimiter, formatProviderApiError, tryParseProviderErrorJson, valhallaErrorFromBody } from "places-shared/services";
import { trimBaseUrl, type ProviderSettings, type RouteHttpClient } from "places-shared/services";

export const DEFAULT_VALHALLA_BASE_URL = "https://valhalla1.openstreetmap.de";
export const VALHALLA_CLIENT_ID = "places-obsidian";

const rateLimiter = new FixedIntervalRateLimiter(1000);
let requestQueue: Promise<void> = Promise.resolve();

async function waitForPublicValhallaRequest(): Promise<void> {
  const previous = requestQueue;
  let release!: () => void;

  requestQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;

  try {
    await rateLimiter.wait();
  } finally {
    release();
  }
}

export class ValhallaClient {
  constructor(protected readonly settings: ProviderSettings, private readonly http: RouteHttpClient, private readonly waitForRequest: () => Promise<void> = waitForPublicValhallaRequest) {}

  protected operationUrl(operation: string): string {
    return `${this.getBaseUrl()}/${operation}`;
  }

  async postJson(operation: string, body: unknown, requestSummary?: string): Promise<unknown> {
    await this.waitForRequest();
    const response = await this.http({
      url: this.operationUrl(operation),
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Client-Id": VALHALLA_CLIENT_ID },
      body: JSON.stringify(body),
    });

    if (response.status >= 400) {
      if (operation === "trace_attributes") {
        throw valhallaErrorFromBody("Valhalla", response.status, response.text ?? "");
      }

      throw new Error(formatProviderApiError({
        provider: "Valhalla",
        operation: operation.replace(/_/g, " "),
        status: response.status,
        json: tryParseProviderErrorJson(response.text),
        text: response.text,
        requestSummary,
      }));
    }

    return response.json;
  }

  protected getBaseUrl(): string {
    return trimBaseUrl(
      this.settings.baseUrl,
      DEFAULT_VALHALLA_BASE_URL,
      /\/(?:trace_attributes|trace_route|route|optimized_route|isochrone|height)\/?$/,
    );
  }
}
