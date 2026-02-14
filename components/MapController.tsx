import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Location } from '../types';

interface MapControllerProps {
  location: Location;
  active?: boolean;
}

const MapController: React.FC<MapControllerProps> = ({ location, active = true }) => {
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
    if (location && active) {
      const currentZoom = map.getZoom();
      const targetZoom = Math.max(currentZoom, 16); // Don't zoom out if user is already deep in

      map.flyTo([location.lat, location.lng], targetZoom, {
        animate: true,
        duration: 2.5, // Slow, romantic flight speed
        easeLinearity: 0.25
      });
    }
  }, [location, map, active]);

  return null;
};

export default MapController;