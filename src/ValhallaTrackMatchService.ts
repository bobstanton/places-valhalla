import type { Coordinate } from "places-shared/geo";
import type { IPlaceExtensionSettings } from "places-shared/settings";
import {
  type ITrackMatchService,
  type TrackMatchOptions,
  type TrackMatchResult,
  aggregateTraceEdges,
  downsampleTrackForTrace,
  VALHALLA_TRACE_EDGE_ATTRIBUTES,
} from "places-shared/services";
import { km } from "places-shared/units";
import { PolylineCodec } from "places-shared/track";
import { logger } from "places-shared/utils";
import { ValhallaClient } from "./ValhallaClient";

interface TraceAttributesResponse {
  edges?: Array<{
    names?: string[];
    length?: number;
    use?: string;
    surface?: string;
    road_class?: string;
    begin_shape_index?: number;
    end_shape_index?: number;
  }>;
  // Matched-path polyline (precision 6) the edge shape indices refer to.
  shape?: string;
}

export class ValhallaTrackMatchService implements ITrackMatchService {
  readonly providerId = "valhalla";
  readonly displayName = "Valhalla";
  private readonly client: ValhallaClient;

  constructor(settings: IPlaceExtensionSettings, client?: ValhallaClient) {
    this.client = client ?? new ValhallaClient(settings);
  }

  isAvailable(): boolean {
    return true;
  }

  async matchTrack(coordinates: Coordinate[], options?: TrackMatchOptions): Promise<TrackMatchResult> {
    if (coordinates.length < 2) {
      return { ways: [], totalLengthKm: km(0), provider: this.providerId };
    }

    const shape = downsampleTrackForTrace(coordinates).map(({ latitude, longitude }) => ({
      lat: latitude,
      lon: longitude,
    }));
    const response = await this.client.postJson("trace_attributes", {
      shape,
      costing: options?.costing ?? "pedestrian",
      shape_match: "map_snap",
      units: "km",
      filters: {
        action: "include",
        attributes: VALHALLA_TRACE_EDGE_ATTRIBUTES,
      },
    }, `${options?.costing ?? "pedestrian"}, ${shape.length} points`) as TraceAttributesResponse;

    const edges = response.edges ?? [];
    logger.scope("Valhalla").debug(`trace_attributes matched ${edges.length} edges from ${shape.length} shape points`);
    const matchedShape = response.shape ? PolylineCodec.decode(response.shape, 6) : undefined;
    return aggregateTraceEdges(edges, this.providerId, shape.length, matchedShape);
  }
}
