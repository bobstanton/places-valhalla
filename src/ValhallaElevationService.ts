import type { Coordinate } from "places-shared/geo";
import type { IPlaceExtensionSettings } from "places-shared/settings";
import { ElevationServiceBase } from "places-shared/services";
import type { Meters } from "places-shared/units";
import { meters } from "places-shared/units";
import { ValhallaClient } from "./ValhallaClient";

interface HeightResponse {
  height?: Array<number | null>;
}

export class ValhallaElevationService extends ElevationServiceBase {
  private readonly client: ValhallaClient;

  constructor(settings: IPlaceExtensionSettings, client?: ValhallaClient) {
    super(settings);
    this.client = client ?? new ValhallaClient(settings);
  }

  getProviderName(): string {
    return "valhalla";
  }

  protected assertApiKeyConfigured(): void {}

  protected async getElevationForPoints(coordinates: Coordinate[]): Promise<Meters[]> {
    const response = await this.client.postJson("height", {
      shape: coordinates.map(({ latitude, longitude }) => ({ lat: latitude, lon: longitude })),
      height_precision: 2,
    }, `${coordinates.length} points`) as HeightResponse;

    if (!Array.isArray(response.height) || response.height.length !== coordinates.length) {
      throw new Error("Valhalla returned an unexpected elevation response.");
    }

    return response.height.map((height, index) => {
      if (height === null || !Number.isFinite(height)) {
        throw new Error(`Valhalla returned no elevation for point ${index + 1}.`);
      }

      return meters(height);
    });
  }
}
