import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { TelemetryPoint } from '../types';

export const SelectedPointMarker = ({ point }: { point: TelemetryPoint | null }) => {
  const map = useMap();
  useEffect(() => {
    if (!point) return;

    map.setView([point.latitude, point.longitude], 17);

    const marker = L.circleMarker([point.latitude, point.longitude], {
      radius: 10,
      color: '#facc15',
      fillColor: '#facc15',
      fillOpacity: 0.8,
    }).addTo(map);

    marker.bindPopup(`<b>Status:</b> ${point.status}<br/><b>Variance:</b> ${point.vibration_variance.toFixed(4)}`).openPopup();

    return () => map.removeLayer(marker);
  }, [point, map]);

  return null;
};