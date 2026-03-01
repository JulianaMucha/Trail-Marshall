// src/sampleData.ts
import { TelemetryPoint } from './types';

export const samplePoints: TelemetryPoint[] = [
  { id: 1, latitude: 39.678, longitude: -75.7536, vibration_variance: 0.1, status: 'Good', timestamp: new Date().toISOString() },
  { id: 2, latitude: 39.672, longitude: -75.7534, vibration_variance: 0.2, status: 'Good', timestamp: new Date().toISOString() },
  { id: 3, latitude: 39.668, longitude: -75.753, vibration_variance: 0.4, status: 'Good', timestamp: new Date().toISOString() },
  { id: 4, latitude: 39.661, longitude: -75.752, vibration_variance: 0.6, status: 'Bad', timestamp: new Date().toISOString() },
  { id: 5, latitude: 39.659, longitude: -75.7516, vibration_variance: 0.7, status: 'Bad', timestamp: new Date().toISOString() },
  { id: 6, latitude: 39.654, longitude: -75.751, vibration_variance: 0.3, status: 'Good', timestamp: new Date().toISOString() },
];