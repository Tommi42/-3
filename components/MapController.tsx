import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Location } from '../types';

interface MapControllerProps {
  location?: Location;
  active?: boolean;
  view?: 'memory' | 'world';
}

const MapController: React.FC<MapControllerProps> = ({ location, active = true, view = 'memory' }) => {
  const map = useMap();

  // FIX: Force Leaflet to re-calculate container size.
  // This fixes the "grey/missing tiles" issue that happens because the map 
  // initializes before the container has fully expanded.
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250); // Small delay to ensure DOM is ready

    // Also run immediately just in case
    map.invalidateSize();

    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (!active) return;

    if (view === 'world') {
      map.flyTo([20, 0], 2, {
        animate: true,
        duration: 2.5,
        easeLinearity: 0.25
      });
    } else if (location) {
      const currentZoom = map.getZoom();
      const targetZoom = Math.max(currentZoom, 16); // Don't zoom out if user is already deep in

      map.flyTo([location.lat, location.lng], targetZoom, {
        animate: true,
        duration: 2.5, // Slow, romantic flight speed
        easeLinearity: 0.25
      });
    }
  }, [location, map, active, view]);

  return null;
};

export default MapController;