export interface TelemetryPoint {
    id: number;
    latitude: number;
    longitude: number;
    vibration_variance: number;
    status: 'Good' | 'Bad';
    timestamp: string;
  }
  
  export interface GitHubUser {
    username: string;
    avatar_url: string;
  }