import { App, Plugin } from "obsidian";
import type { IPlaceExtensionSettings, IPlacesExtensionHostSettings } from "places-shared/settings";
import {
  type ExtensionSettingsGroup,
  type IPlacePluginExtension,
  type IPlacePluginExtensionExports,
  PLACES_EXTENSION_API_VERSION,
  registerPlaceExtensionLifecycle,
} from "places-shared/services";
import { scalarToString, Utilities, configureRequestLogging } from "places-shared/utils";
import { DEFAULT_VALHALLA_BASE_URL } from "./ValhallaClient";
import { ValhallaElevationService } from "./ValhallaElevationService";
import { ValhallaRouteOverlayService } from "./ValhallaRouteOverlayService";
import { ValhallaSnapService } from "./ValhallaSnapService";
import { ValhallaTrackMatchService } from "./ValhallaTrackMatchService";

const DEFAULT_SETTINGS: IPlaceExtensionSettings = {
  baseUrl: DEFAULT_VALHALLA_BASE_URL,
};

export default class ValhallaPlugin extends Plugin implements IPlacePluginExtension {
  onload(): void {
    registerPlaceExtensionLifecycle(this);
  }

  getPlaceExports(
    _app: App,
    extensionSettings: IPlaceExtensionSettings,
    mainSettings: IPlacesExtensionHostSettings,
  ): IPlacePluginExtensionExports {
    configureRequestLogging(mainSettings.developerMode);
    Utilities.applyDefaults(extensionSettings, DEFAULT_SETTINGS);

    return {
      apiVersion: PLACES_EXTENSION_API_VERSION,
      providers: [{
        name: "valhalla",
        elevation: new ValhallaElevationService(extensionSettings),
        trackMatch: new ValhallaTrackMatchService(extensionSettings),
        routeOverlay: new ValhallaRouteOverlayService(extensionSettings),
        snap: new ValhallaSnapService(extensionSettings),
      }],
      settingsGroup: this.settingsGroup(extensionSettings),
    };
  }

  private settingsGroup(settings: IPlaceExtensionSettings): ExtensionSettingsGroup {
    return {
      heading: "Valhalla",
      items: [{
        name: "Base URL",
        desc: `Valhalla API base URL. Default: ${DEFAULT_VALHALLA_BASE_URL}`,
        control: { type: "text", key: "baseUrl", defaultValue: DEFAULT_VALHALLA_BASE_URL },
      }],
      setValue: (key, value) => {
        // Fall back to the public instance on a cleared base URL.
        const text = scalarToString(value).trim();
        settings[key] = key === "baseUrl" ? text || DEFAULT_VALHALLA_BASE_URL : text;
      },
    };
  }
}
