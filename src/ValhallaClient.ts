import type { IPlaceExtensionSettings } from "places-shared/settings";
import {
  FixedIntervalRateLimiter,
  formatProviderApiError,
  tryParseProviderErrorJson,
  valhallaErrorFromBody,
} from "places-shared/services";
import { loggedRequestUrl as requestUrl } from "places-shared/utils";

export const DEFAULT_VALHALLA_BASE_URL = "https://valhalla1.openstreetmap.de";
export const VALHALLA_CLIENT_ID = "places-obsidian";

const rateLimiter = new FixedIntervalRateLimiter(1000);
let requestQueue: Promise<void> = Promise.resolve();

export class ValhallaClient {
  constructor(private readonly settings: IPlaceExtensionSettings) {}

  async postJson(operation: string, body: unknown, requestSummary?: string): Promise<unknown> {
    const previous = requestQueue;
    let release!: () => void;
    requestQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    await rateLimiter.wait();
    let response;
    try {
      response = await requestUrl({
      url: `${this.getBaseUrl()}/${operation}`,
      method: "POST",
      contentType: "application/json",
      headers: { "X-Client-Id": VALHALLA_CLIENT_ID },
      body: JSON.stringify(body),
      throw: false,
      });
    } finally {
      release();
    }

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

  private getBaseUrl(): string {
    const configured = typeof this.settings.baseUrl === "string" ? this.settings.baseUrl.trim() : "";
    return (configured || DEFAULT_VALHALLA_BASE_URL)
      .replace(/\/(?:trace_attributes|trace_route|route|optimized_route|isochrone|height)\/?$/, "")
      .replace(/\/$/, "");
  }
}
