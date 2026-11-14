import type { IPlaceExtensionSettings } from "places-shared/settings";
import { type ISnapService, type SnapRequest, type SnapResult, buildValhallaTraceBody, describeUnsupportedSnapOptions, toSnapResult, type ValhallaTraceEdge } from "places-shared/services";
import { ValhallaClient } from "./ValhallaClient";

import { VALHALLA_COSTINGS } from 'places-valhalla/core';

// Valhalla accepts everything except Mapbox's own two options.
const VALHALLA_SNAP_SUPPORT = { costing: true, costingOptions: true, timestamps: true, shapeMatch: true, traceOptions: true, attributes: true } as const;

interface TraceResponse {
  matched_points?: Array<{ lat?: number; lon?: number; type?: string; edge_index?: number }>;
  // Polyline6 of the matched path, following way geometry rather than the input points.
  shape?: string;
  edges?: ValhallaTraceEdge[];
}

export class ValhallaSnapService implements ISnapService {
  private readonly client: ValhallaClient;

  constructor(settings: IPlaceExtensionSettings, client?: ValhallaClient) {
    this.client = client ?? new ValhallaClient(settings);
  }

  getProviderName(): string {
    return "valhalla";
  }

  describeUnsupportedRequest(request: SnapRequest): string[] {
    return describeUnsupportedSnapOptions("Valhalla", request, VALHALLA_SNAP_SUPPORT);
  }

  async snapPoints(request: SnapRequest): Promise<SnapResult> {
    const body = buildValhallaTraceBody(request, VALHALLA_COSTINGS, request.units ?? 'metric');
    const response = await this.client.postJson("trace_attributes", body, `${request.mode}, ${request.points.length} points`) as TraceResponse;

    return toSnapResult({
      provider: "Valhalla",
      request,
      matched: response.matched_points,
      encodedShape: response.shape,
      edges: response.edges,
    });
  }
}
