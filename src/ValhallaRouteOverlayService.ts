import { ValhallaRouteOverlayService as CoreValhallaRouteOverlayService } from 'places-valhalla/core';
import { loggedRouteHttpClient } from "places-shared/services";
import type { IPlaceExtensionSettings } from "places-shared/settings";
import type { ValhallaClient } from "./ValhallaClient";

export { VALHALLA_COSTINGS } from "places-valhalla/core";

export class ValhallaRouteOverlayService extends CoreValhallaRouteOverlayService {
  constructor(settings: IPlaceExtensionSettings, client?: ValhallaClient) {
    super(settings, loggedRouteHttpClient, client);
  }
}
