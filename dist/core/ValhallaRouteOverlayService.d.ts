import type * as GeoJSON from "geojson";
import type { ProviderSettings, RouteHttpClient } from "places-shared/services";
import { type DirectionsOverlayRequest, type IsochroneOverlayRequest, type RouteOverlayCapabilities, type RouteOverlayService } from "places-shared/services";
import { ValhallaClient } from "./ValhallaClient";
export declare const VALHALLA_COSTINGS: {
    readonly walk: "pedestrian";
    readonly bike: "bicycle";
    readonly drive: "auto";
};
export declare class ValhallaRouteOverlayService implements RouteOverlayService {
    private readonly client;
    constructor(settings: ProviderSettings, http: RouteHttpClient, client?: ValhallaClient);
    getProviderName(): string;
    getCapabilities(): RouteOverlayCapabilities;
    getDirectionsOverlay(request: DirectionsOverlayRequest): Promise<GeoJSON.FeatureCollection>;
    getIsochroneOverlay(request: IsochroneOverlayRequest): Promise<GeoJSON.FeatureCollection>;
}
