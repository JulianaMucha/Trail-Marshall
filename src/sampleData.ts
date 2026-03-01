// src/sampleData.ts
import { TelemetryPoint } from './types';

// Sample telemetry points along East Main Street, Newark, DE (UD campus)
export const samplePoints: TelemetryPoint[] = [
  { id: 1, latitude: 39.6778, longitude: -75.7465, vibration_variance: 0.1, status: 'Good', timestamp: new Date().toISOString() },
  { id: 2, latitude: 39.6782, longitude: -75.7467, vibration_variance: 0.3, status: 'Good', timestamp: new Date().toISOString() },
  { id: 3, latitude: 39.6787, longitude: -75.7470, vibration_variance: 0.6, status: 'Bad', timestamp: new Date().toISOString() },
  { id: 4, latitude: 39.6790, longitude: -75.7473, vibration_variance: 0.2, status: 'Good', timestamp: new Date().toISOString() },
  { id: 5, latitude: 39.6795, longitude: -75.7475, vibration_variance: 0.8, status: 'Bad', timestamp: new Date().toISOString() },
  { id: 6, latitude: 39.6799, longitude: -75.7478, vibration_variance: 0.4, status: 'Good', timestamp: new Date().toISOString() },
  { id: 7, latitude: 39.6803, longitude: -75.7480, vibration_variance: 0.9, status: 'Bad', timestamp: new Date().toISOString() },
];