import { ValhallaClient as CoreValhallaClient } from 'places-valhalla/core';
import { loggedRouteHttpClient } from "places-shared/services";
import type { IPlaceExtensionSettings } from "places-shared/settings";

export { DEFAULT_VALHALLA_BASE_URL, VALHALLA_CLIENT_ID } from "places-valhalla/core";

export class ValhallaClient extends CoreValhallaClient {
  constructor(settings: IPlaceExtensionSettings) {
    super(settings, loggedRouteHttpClient);
  }
}
