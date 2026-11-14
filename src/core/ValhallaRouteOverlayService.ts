import { decode as decodePolyline } from "@googlemaps/polyline-codec";
import type * as GeoJSON from "geojson";
import type { ProviderSettings, RouteHttpClient } from "places-shared/services";
import { type DirectionsOverlayRequest, type IsochroneOverlayRequest, type RouteOverlayCapabilities, type RouteOverlayService, type RouteWaypoint, appendDirectionsRouteFeatures, buildDirectionsRouteFeature, buildRouteLegMetrics, decorateIsochroneFeatureProperties, formatIsochroneFeatureName, formatRouteDistance, getIsochroneStyleColors, mapTravelMode } from "places-shared/services";
import { ValhallaClient } from "./ValhallaClient";

export const VALHALLA_COSTINGS = { walk: "pedestrian", bike: "bicycle", drive: "auto" } as const;

interface ValhallaTrip {
  locations?: Array<{ original_index?: number }>;
  legs?: Array<{ shape?: string; summary?: { length?: number; time?: number } }>;
  summary?: { length?: number; time?: number };
}

export class ValhallaRouteOverlayService implements RouteOverlayService {
  private readonly client: ValhallaClient;

  constructor(settings: ProviderSettings, http: RouteHttpClient, client?: ValhallaClient) {
    this.client = client ?? new ValhallaClient(settings, http);
  }

  getProviderName(): string {
    return "valhalla";
  }

  getCapabilities(): RouteOverlayCapabilities {
    return {
      routeOptimization: true,
      distanceIsochrones: true,
      polygonIsochrones: true,
    };
  }

  async getDirectionsOverlay(request: DirectionsOverlayRequest): Promise<GeoJSON.FeatureCollection> {
    const features: GeoJSON.Feature[] = [];

    for (let routeIndex = 0; routeIndex < request.routes.length; routeIndex++) {
      const route = request.routes[routeIndex];

      if (route.length < 2) continue;

      const operation = request.optimize ? "optimized_route" : "route";
      const response = await this.client.postJson(operation, {
        id: `route-${routeIndex + 1}`,
        locations: route.map(({ latitude, longitude }) => ({ lat: latitude, lon: longitude })),
        costing: mapTravelMode(request.mode, VALHALLA_COSTINGS),
        directions_type: "none",
        units: "kilometers",
      }, `${request.mode}, ${route.length} waypoints`) as { trip?: ValhallaTrip };

      const trip = response.trip;
      const coordinates: number[][] = [];

      for (const leg of trip?.legs ?? []) {
        if (!leg.shape) continue;
        coordinates.push(...decodePolyline(leg.shape, 6).map(([lat, lon]) => [lon, lat]));
      }

      if (coordinates.length === 0) continue;

      const orderedRoute = request.optimize ? optimizedRoute(route, trip?.locations) : route;
      const legs = buildRouteLegMetrics(orderedRoute, (trip?.legs ?? []).map((leg) => ({
        distanceMeters: Number(leg.summary?.length ?? 0) * 1000,
        durationSeconds: Number(leg.summary?.time ?? 0),
      })), request.units);

      await appendDirectionsRouteFeatures(features, buildDirectionsRouteFeature({
        request,
        provider: this.getProviderName(),
        routeIndex,
        route: orderedRoute,
        geometry: { type: "LineString", coordinates },
        optimized: request.optimize === true,
        distanceMeters: Number(trip?.summary?.length ?? 0) * 1000,
        durationSeconds: Number(trip?.summary?.time ?? 0),
        legs,
      }), request);
    }

    return { type: "FeatureCollection", features };
  }

  async getIsochroneOverlay(request: IsochroneOverlayRequest): Promise<GeoJSON.FeatureCollection> {
    const features: GeoJSON.Feature[] = [];

    for (const center of request.centers) {
      const colors = getIsochroneStyleColors(request.ranges.length, request.style);
      const response = await this.client.postJson("isochrone", {
        locations: [{ lat: center.latitude, lon: center.longitude }],
        costing: mapTravelMode(request.mode, VALHALLA_COSTINGS),
        polygons: request.polygons,
        contours: request.ranges.map((range, index) => ({
          [request.rangeType === "time" ? "time" : "distance"]:
            request.rangeType === "time" ? range : range / 1000,
          color: colors[index].replace(/^#/, ""),
        })),
      }, `${request.mode}, ${request.rangeType} ranges ${request.ranges.join(", ")}`) as GeoJSON.FeatureCollection;

      for (const feature of response.features ?? []) {
        const contour = Number(feature.properties?.contour);
        const color = `#${String(feature.properties?.color ?? colors[0]).replace(/^#/, "")}`;

        features.push({
          ...feature,
          properties: decorateIsochroneFeatureProperties({
            ...(feature.properties ?? {}),
            name: formatIsochroneFeatureName(
              request.name ?? center.name,
              request.mode,
              request.rangeType === "time" ? `${contour} min` : formatRouteDistance(contour * 1000, request.units),
            ),
            provider: this.getProviderName(),
            metric: request.rangeType,
            contour,
          }, color, request.style),
        });
      }
    }

    return { type: "FeatureCollection", features };
  }
}

function optimizedRoute(route: RouteWaypoint[], locations: Array<{ original_index?: number }> | undefined): RouteWaypoint[] {
  if (!locations?.length) return route;

  return locations
    .map((location, order) => route[location.original_index ?? order])
    .filter((point): point is RouteWaypoint => point !== undefined);
}
