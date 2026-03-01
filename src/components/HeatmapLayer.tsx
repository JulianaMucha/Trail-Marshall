import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet.heat';

interface TelemetryPoint {
  latitude: number;
  longitude: number;
  vibration_variance: number;
}

export default function HeatmapLayer({ points }: { points: TelemetryPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    const heatPoints = points.map(p => [p.latitude, p.longitude, p.vibration_variance]);
    const heat = (L as any).heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.2: 'green', 0.5: 'yellow', 0.8: 'orange', 1: 'red' }
    }).addTo(map);

    return () => heat.remove();
  }, [points, map]);

  return null;
}