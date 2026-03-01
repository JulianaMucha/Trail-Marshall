// Import React
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import HeatmapLayer from './components/HeatmapLayer';
import MapAutoCenter from './components/MapAutoCenter';

// Types
interface TelemetryPoint {
  id: number;
  latitude: number;
  longitude: number;
  vibration_variance: number;
  status: 'Good' | 'Bad';
  timestamp: string;
}

// Adafruit IO
const ADAFRUIT_IO_USERNAME = 'your_username';
const ADAFRUIT_IO_KEY = 'your_aio_key';

export default function App() {
  const [points, setPoints] = useState<TelemetryPoint[]>([]);
  const [latestGPS, setLatestGPS] = useState<[number, number]>([37.7749, -122.4194]); // default SF

  // Fetch Adafruit IO data every 5s
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(
        `https://io.adafruit.com/api/v2/${ADAFRUIT_IO_USERNAME}/feeds/bumpy_roads/data?limit=100`,
        { headers: { 'X-AIO-Key': ADAFRUIT_IO_KEY } }
      );
      const data = await res.json();
      const mappedPoints = data.map((d: any, idx: number) => ({
        id: idx,
        latitude: parseFloat(d.lat) || 37.7749,
        longitude: parseFloat(d.lon) || -122.4194,
        vibration_variance: parseFloat(d.value),
        status: parseFloat(d.value) > 0.5 ? 'Bad' : 'Good',
        timestamp: d.created_at
      }));
      setPoints(mappedPoints);

      if (mappedPoints.length > 0) {
        const last = mappedPoints[mappedPoints.length - 1];
        setLatestGPS([last.latitude, last.longitude]);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Group segments for Polyline coloring
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <MapContainer center={latestGPS} zoom={13} className="h-screen w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Polyline segments */}
        {segments.map((seg, idx) => (
          <Polyline
            key={idx}
            positions={seg.positions}
            color={seg.status === 'Good' ? '#10b981' : '#f43f5e'}
            weight={6}
          />
        ))}

        {/* Latest point marker */}
        {points.length > 0 && (
          <CircleMarker
            center={[points[points.length - 1].latitude, points[points.length - 1].longitude]}
            radius={8}
            pathOptions={{ fillColor: '#fff', color: '#000', weight: 2 }}
          >
            <Popup>
              <div>
                <p>Variance: {points[points.length - 1].vibration_variance.toFixed(4)}</p>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Heatmap */}
        <HeatmapLayer points={points} />
        <MapAutoCenter coords={latestGPS} />
      </MapContainer>
    </div>
  );
}