import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { io, Socket } from 'socket.io-client';
import { Activity, Map as MapIcon, ShieldAlert, ShieldCheck, Navigation, Radio, Github } from 'lucide-react';
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

export default function App() {
  const [points, setPoints] = useState<TelemetryPoint[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [latestGPS, setLatestGPS] = useState<[number, number]>([0, 0]);
  const [user, setUser] = useState<GitHubUser | null>(null);

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

  // 1. Architecture Plan: Bridge Phone GPS
  // This function would be called on the phone client to send GPS to the server
  const sendGPSUpdate = useCallback(async (lat: number, lng: number) => {
    try {
      await fetch('/api/gps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      setLatestGPS([lat, lng]);
    } catch (err) {
      console.error("Failed to send GPS:", err);
    }
  }, []);

  // Start GPS tracking (Simulating the phone's role)
  useEffect(() => {
    if (isTracking) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          sendGPSUpdate(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isTracking, sendGPSUpdate]);

  // 2. Real-time Sync via WebSockets
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    // Load history
    fetch('/api/history')
      .then(res => res.json())
      .then(data => setPoints(data));

    newSocket.on('telemetry_update', (data: TelemetryPoint) => {
      setPoints(prev => [...prev, data]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 3. Logic: Threshold Function
  // (Handled on server for persistence, but we can simulate Pi sending data here)
  const simulatePiData = async () => {
    const variance = Math.random(); // Simulated accelerometer variance
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vibration_variance: variance, session_id: 'mission-alpha' }),
    });
  };

  // Group points into segments for color coding
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
            <h1 className="text-xl font-bold tracking-tight">MISSION CONTROL</h1>
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
          
          <button 
            onClick={simulatePiData}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 text-zinc-100 text-sm font-medium hover:bg-zinc-700 transition-all border border-white/5"
          >
            <Radio size={16} />
            SIMULATE PI
          </button>
        </div>
      </header>

      <main className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-88px)]">
        {/* Sidebar: Stats & Logs */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
          <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={14} /> System Telemetry
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] text-zinc-500 uppercase mb-1">Total Points</p>
                <p className="text-2xl font-mono font-bold">{points.length}</p>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] text-zinc-500 uppercase mb-1">Current Status</p>
                {points.length > 0 ? (
                  <StatusBadge status={points[points.length - 1].status} />
                ) : (
                  <span className="text-zinc-600">IDLE</span>
                )}
              </div>
            </div>
          </section>

          <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex-1 flex flex-col overflow-hidden">
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Live Feed</h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {[...points].reverse().map((p) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-black/30 p-3 rounded-xl border border-white/5 text-[11px] font-mono"
                  >
                    <div className="flex justify-between items-start mb-1">
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

        {/* Main Content: Map */}
        <div className="lg:col-span-3 bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 relative shadow-2xl">
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <div className="bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10 text-[10px] font-mono">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-1 bg-emerald-500 rounded-full"></div>
                <span>STRUCTURAL INTEGRITY: GOOD</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-rose-500 rounded-full"></div>
                <span>STRUCTURAL INTEGRITY: BAD</span>
              </div>
            </div>
          </div>

          <MapContainer 
            center={[37.7749, -122.4194]} 
            zoom={13} 
            className="h-full w-full grayscale-[0.8] contrast-[1.2] invert-[0.9] hue-rotate-[180deg]"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Color-coded Polyline segments */}
            {segments.map((seg, idx) => (
              <Polyline 
                key={idx} 
                positions={seg.positions} 
                color={seg.status === 'Good' ? '#10b981' : '#f43f5e'} 
                weight={6}
                opacity={0.8}
              />
            ))}

            {/* Latest point marker */}
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

            <MapAutoCenter coords={latestGPS} />
          </MapContainer>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .leaflet-container {
          background: #0a0a0a !important;
        }
      `}</style>
    </div>
  );
}

