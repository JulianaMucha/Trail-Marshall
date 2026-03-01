// App.tsx
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import 'leaflet.heat';
import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import { Activity, ShieldAlert, ShieldCheck, Navigation, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface TelemetryPoint {
  id: number;
  latitude: number;
  longitude: number;
  vibration_variance: number;
  status: 'Good' | 'Bad';
  timestamp: string;
}

interface GitHubUser {
  username: string;
  avatar_url: string;
}

// --- Sample/mock telemetry data for testing ---
const samplePoints: TelemetryPoint[] = [
  { id: 1, latitude: 37.7749, longitude: -122.4194, vibration_variance: 0.1, status: 'Good', timestamp: new Date().toISOString() },
  { id: 2, latitude: 37.7755, longitude: -122.4180, vibration_variance: 0.6, status: 'Bad', timestamp: new Date().toISOString() },
  { id: 3, latitude: 37.7760, longitude: -122.4170, vibration_variance: 0.3, status: 'Good', timestamp: new Date().toISOString() },
  { id: 4, latitude: 37.7765, longitude: -122.4160, vibration_variance: 0.9, status: 'Bad', timestamp: new Date().toISOString() },
];

// --- Components ---
const StatusBadge = ({ status }: { status: 'Good' | 'Bad' }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
    status === 'Good' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
  }`}>
    {status === 'Good' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
    {status}
  </span>
);

const MapAutoCenter = ({ coords }: { coords: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (coords[0] !== 0 && coords[1] !== 0) {
      map.setView(coords, map.getZoom());
    }
  }, [coords, map]);
  return null;
};

interface HeatmapLayerProps {
  points: TelemetryPoint[];
}

const HeatmapLayer = ({ points }: HeatmapLayerProps) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    const heatPoints = points.map(p => [p.latitude, p.longitude, p.vibration_variance]);
    const heat = (L as any).heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.2: 'green', 0.5: 'yellow', 0.8: 'orange', 1.0: 'red' }
    }).addTo(map);
    return () => heat.remove();
  }, [points, map]);

  return null;
};

// Marker for selected row
const SelectedPointMarker = ({ point }: { point: TelemetryPoint | null }) => {
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

// --- Main App ---
export default function App() {
  const [points, setPoints] = useState<TelemetryPoint[]>([]);
  const [latestGPS, setLatestGPS] = useState<[number, number]>([0, 0]);
  const [selectedPoint, setSelectedPoint] = useState<TelemetryPoint | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // GitHub OAuth
  const connectGitHub = async () => {
    try {
      const res = await fetch('/api/auth/github/url');
      const { url } = await res.json();
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch (err) {
      console.error("GitHub Auth failed:", err);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        setUser(event.data.user);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // --- Fetch Adafruit IO Data ---
  const fetchAdafruitData = useCallback(async () => {
    try {
      const username = 'YOUR_ADAFRUIT_IO_USERNAME';
      const key = 'YOUR_ADAFRUIT_IO_KEY';
      const feed = 'road-variance';

      const res = await axios.get(`https://io.adafruit.com/api/v2/${username}/feeds/${feed}/data`, {
        headers: { 'X-AIO-Key': key }
      });

      const adafruitPoints: TelemetryPoint[] = res.data.map((item: any, index: number) => ({
        id: index,
        latitude: parseFloat(item.lat || '0'),
        longitude: parseFloat(item.lon || '0'),
        vibration_variance: parseFloat(item.value),
        status: parseFloat(item.value) > 0.5 ? 'Bad' : 'Good',
        timestamp: item.created_at
      }));

      setPoints(adafruitPoints);
      if (adafruitPoints.length > 0) {
        setLatestGPS([adafruitPoints[adafruitPoints.length - 1].latitude, adafruitPoints[adafruitPoints.length - 1].longitude]);
      }
    } catch (err) {
      console.error("Failed to fetch Adafruit IO data:", err);
    }
  }, []);

  // --- Use sample data for testing ---
  useEffect(() => {
    // To test with Adafruit, uncomment the below:
    // fetchAdafruitData();
    // const interval = setInterval(fetchAdafruitData, 10000); // every 10s
    // return () => clearInterval(interval);

    // For local testing:
    setPoints(samplePoints);
    setLatestGPS([samplePoints[samplePoints.length - 1].latitude, samplePoints[samplePoints.length - 1].longitude]);
  }, [fetchAdafruitData]);

  // --- GPS tracking simulation ---
  const sendGPSUpdate = useCallback((lat: number, lng: number) => {
    setLatestGPS([lat, lng]);
  }, []);

  useEffect(() => {
    if (isTracking) {
      const watchId = navigator.geolocation.watchPosition(
        pos => sendGPSUpdate(pos.coords.latitude, pos.coords.longitude),
        err => console.error(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isTracking, sendGPSUpdate]);

  // --- Polyline segments ---
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
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-[1000] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity className="text-black" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Trail Marshal</h1>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Infrastructure Monitoring v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-white/5">
              <img src={user.avatar_url} alt={user.username} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
              <span className="text-xs font-mono text-zinc-300">{user.username}</span>
            </div>
          ) : (
            <button 
              onClick={connectGitHub}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 text-zinc-100 text-sm font-medium hover:bg-zinc-700 transition-all border border-white/5"
            >
              <Github size={16} />
              CONNECT
            </button>
          )}

          <button 
            onClick={() => setIsTracking(!isTracking)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isTracking 
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/40' 
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Navigation size={16} className={isTracking ? 'animate-pulse' : ''} />
            {isTracking ? 'GPS ACTIVE' : 'START GPS BRIDGE'}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-88px)]">
        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
          <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={14} /> Road Severity Feed
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[70vh] pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {[...points].reverse().map((p) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-black/30 p-2 rounded-xl border border-white/5 text-[11px] font-mono cursor-pointer hover:bg-zinc-800"
                    onClick={() => setSelectedPoint(p)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">{new Date(p.timestamp).toLocaleTimeString()}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="text-zinc-400">
                      VAR: {p.vibration_variance.toFixed(4)}
                    </div>
                    <div className="text-zinc-600 truncate">
                      LOC: {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Map */}
        <div className="lg:col-span-3 bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 relative shadow-2xl">
          <MapContainer 
            center={latestGPS} 
            zoom={13} 
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />

            {/* Polylines */}
            {segments.map((seg, idx) => (
              <Polyline key={idx} positions={seg.positions} color={seg.status === 'Good' ? '#10b981' : '#f43f5e'} weight={6} opacity={0.8} />
            ))}

            {/* Latest marker */}
            {points.length > 0 && (
              <CircleMarker 
                center={[points[points.length - 1].latitude, points[points.length - 1].longitude]}
                radius={8}
                pathOptions={{ fillColor: '#fff', fillOpacity: 1, color: '#000', weight: 2 }}
              >
                <Popup>
                  <div className="font-sans">
                    <p className="font-bold">Current Location</p>
                    <p className="text-xs text-zinc-500">Variance: {points[points.length - 1].vibration_variance.toFixed(4)}</p>
                  </div>
                </Popup>
              </CircleMarker>
            )}

            {/* Heatmap */}
            <HeatmapLayer points={points} />

            {/* Selected marker */}
            {selectedPoint && <SelectedPointMarker point={selectedPoint} />}

            <MapAutoCenter coords={latestGPS} />
          </MapContainer>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .leaflet-container { background: #0a0a0a !important; }
      `}</style>
    </div>
  );
}