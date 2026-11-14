# Places - Valhalla

Routing provider for [Places](https://community.obsidian.md/plugins/places) using [Valhalla](https://github.com/valhalla/valhalla/), with directions, isochrones, elevation replacement, track snapping, and track matching.

This is not a stand-alone plugin, to use, install along side [Places](https://community.obsidian.md/plugins/places). Refer to the [sandbox](https://sandbox.obsidian.stanton.dev/places/) for examples.

## Network requests

| Area           | Request                                             |
| -------------- | --------------------------------------------------- |
| Directions     | Builds a route between the waypoints in a block     |
| Isochrones     | Builds reachability polygons around a center point  |
| Elevation      | Reads elevation for the points of a track           |
| Track snapping | Aligns a recorded track to the road or path network |
| Track matching | Identifies the named ways a track follows           |

## Background tasks

None.

## Dependencies

| Library                                                      | Purpose                                        |
| ------------------------------------------------------------ | ---------------------------------------------- |
| [places-shared](https://github.com/bobstanton/places-shared) | Shared map, overlay, routing, and utility code |
