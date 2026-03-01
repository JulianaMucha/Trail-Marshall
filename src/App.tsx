import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { samplePoints } from './sampleData';
import { TelemetryPoint, GitHubUser } from './types';
import axios from 'axios';

export default function App() {
  const UD_COORDS: [number, number] = [39.6789, -75.7496]; // University of Delaware

  const [points, setPoints] = useState<TelemetryPoint[]>([]);
  const [latestGPS, setLatestGPS] = useState<[number, number]>(UD_COORDS);
  const [selectedPoint, setSelectedPoint] = useState<TelemetryPoint | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [useSampleData, setUseSampleData] = useState(true); // toggle sample vs Adafruit

  // --- Location tracker ---
  useEffect(() => {
    if (!isTracking) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setLatestGPS([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error('GPS error:', err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTracking]);

  // --- Sample data or Adafruit IO ---
  // EDIT HERE IF ADAFRUIT IS WORKING
  const fetchAdafruitData = useCallback(async () => {
    try {
      const username = 'YOUR_ADAFRUIT_IO_USERNAME';
      const key = 'YOUR_ADAFRUIT_IO_KEY';
      const feed = 'road-variance';

      const res = await axios.get(
        `https://io.adafruit.com/api/v2/${username}/feeds/${feed}/data`,
        { headers: { 'X-AIO-Key': key } }
      );

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
      console.error('Failed to fetch Adafruit IO data:', err);
    }
  }, []);

  // --- Load data on mount ---
  useEffect(() => {
    if (useSampleData) {
      setPoints(samplePoints);
      setLatestGPS([samplePoints[samplePoints.length - 1].latitude, samplePoints[samplePoints.length - 1].longitude]);
    } else {
      fetchAdafruitData();
      const interval = setInterval(fetchAdafruitData, 10000); // refresh every 10s
      return () => clearInterval(interval);
    }
  }, [useSampleData, fetchAdafruitData]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans">
      <header className="p-4 flex justify-between items-center bg-black/50 border-b border-white/10 sticky top-0 z-[1000]">
        <h1 className="text-xl font-bold">Trail Marshal</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              isTracking ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
            }`}
          >
            {isTracking ? 'GPS ACTIVE' : 'START GPS TRACKER'}
          </button>

          <button
            onClick={() => setUseSampleData(!useSampleData)}
            className="px-4 py-2 rounded-full text-sm font-medium bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
          >
            {useSampleData ? 'USE ADAFRUIT DATA' : 'USE SAMPLE DATA'}
          </button>
        </div>
      </header>

      <main className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-88px)]">
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
          <Sidebar points={points} onSelect={setSelectedPoint} />
        </div>
        <div className="lg:col-span-3 bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
          <MapView points={points} latestGPS={latestGPS} selectedPoint={selectedPoint} />
        </div>
      </main>
    </div>
  );
}