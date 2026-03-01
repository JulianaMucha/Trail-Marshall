import React from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import { TelemetryPoint } from '../types';
import { HeatmapLayer } from './HeatmapLayer';
import { SelectedPointMarker } from './SelectedPointMarker';

export const MapView = ({ points, latestGPS, selectedPoint }: {
  points: TelemetryPoint[];
  latestGPS: [number, number];
  selectedPoint: TelemetryPoint | null;
}) => {
  const segments = points.reduce((acc: { positions: [number, number][], status: 'Good' | 'Bad' }[], point, i) => {
    if (i === 0) return acc;
    const prev = points[i - 1];
    acc.push({
      positions: [[prev.latitude, prev.longitude], [point.latitude, point.longitude]],
      status: point.status
    });
    return acc;
  }, []);

  return (
    <MapContainer center={latestGPS} zoom={13} className="h-full w-full">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />

      {segments.map((seg, idx) => (
        <Polyline key={idx} positions={seg.positions} color={seg.status === 'Good' ? '#10b981' : '#f43f5e'} weight={6} opacity={0.8} />
      ))}

      {points.length > 0 && (
        <CircleMarker center={[points[points.length - 1].latitude, points[points.length - 1].longitude]}
          radius={8} pathOptions={{ fillColor: '#fff', fillOpacity: 1, color: '#000', weight: 2 }} />
      )}

      <HeatmapLayer points={points} />
      {selectedPoint && <SelectedPointMarker point={selectedPoint} />}
    </MapContainer>
  );
};