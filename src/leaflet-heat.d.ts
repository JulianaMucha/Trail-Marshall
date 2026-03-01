declare module 'leaflet.heat' {
    import * as L from 'leaflet';
    namespace HeatLayer {
      interface Options {
        radius?: number;
        blur?: number;
        maxZoom?: number;
        gradient?: { [key: number]: string };
      }
    }
    function heatLayer(latlngs: L.LatLngExpression[], options?: HeatLayer.Options): L.Layer;
    export = heatLayer;
  }