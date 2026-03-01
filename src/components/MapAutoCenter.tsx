import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapAutoCenter({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (coords[0] && coords[1]) map.setView(coords, map.getZoom());
  }, [coords, map]);
  return null;
}