import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, ChevronRight, Calendar, MapPin, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { MEMORIES } from './constants';
import MapController from './components/MapController';
import { Memory } from './types';

// Fix for default marker icon in React Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Photo Marker
const createPhotoIcon = (imageUrl: string, isActive: boolean) => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `<div class="photo-marker ${isActive ? 'scale-110 ring-4 ring-rose-400' : ''}" style="background-image: url('${imageUrl}');"></div>`,
    iconSize: isActive ? [60, 60] : [50, 50],
    iconAnchor: isActive ? [30, 30] : [25, 25],
    popupAnchor: [0, -25]
  });
};

const App: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredMemory, setHoveredMemory] = useState<Memory | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentMemory = MEMORIES[currentIndex];
  const isWorldView = !hasInteracted || currentIndex === MEMORIES.length;

  const handleNext = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % (MEMORIES.length + 1));
  };


  const handlePrev = () => {
    setHasInteracted(true);
    setCurrentIndex((prev) => (prev - 1 + (MEMORIES.length + 1)) % (MEMORIES.length + 1));
  };


  const goToMemory = (index: number) => {
    setHasInteracted(true);
    setCurrentIndex(index);
  };

  // Interaction handlers with delay for smooth transition
  const handleMarkerEnter = (memory: Memory) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

    // Add delay before opening to prevent accidental triggers
    openTimeoutRef.current = setTimeout(() => {
      setHoveredMemory(memory);
    }, 500); // 500ms delay
  };

  const handleMarkerLeave = () => {
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);

    closeTimeoutRef.current = setTimeout(() => {
      setHoveredMemory(null);
    }, 300); // 300ms grace period to move to overlay
  };

  const handleOverlayEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };

  const handleOverlayLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredMemory(null);
    }, 300);
  };

  // Clean up timeout
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    };
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        setHoveredMemory(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Calculate polyline coordinates from memories
  const pathCoordinates = MEMORIES.map(m => [m.location.lat, m.location.lng] as [number, number]);

  // Create custom cluster icon to match theme
  const createClusterCustomIcon = function (cluster: any) {
    return L.divIcon({
      html: `<div class="flex items-center justify-center w-full h-full bg-rose-500 text-white font-bold rounded-full border-4 border-white shadow-lg">${cluster.getChildCount()}</div>`,
      className: 'custom-cluster-icon',
      iconSize: L.point(40, 40, true),
    });
  }

  return (
    <div className="relative w-full h-full bg-rose-50 overflow-hidden">

      {/* Map Container */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom={true}
          zoomControl={false}
          className="w-full h-full outline-none"
          style={{ height: '100%', width: '100%', background: 'transparent' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          <MapController
            location={currentMemory?.location}
            active={hasInteracted}
            view={isWorldView ? 'world' : 'memory'}
          />

          <Polyline
            positions={pathCoordinates}
            pathOptions={{
              color: '#fda4af', // rose-300
              weight: 3,
              dashArray: '10, 10',
              opacity: 0.7,
              lineCap: 'round'
            }}
          />

          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            spiderfyDistanceMultiplier={2.5}
            showCoverageOnHover={false}
            // Use standard Leaflet event name in eventHandlers
            eventHandlers={{
              clustermouseover: (e: any) => {
                if (e.layer) e.layer.spiderfy();
              }
            }}
          >
            {MEMORIES.map((memory, index) => (
              <Marker
                key={memory.id}
                position={[memory.location.lat, memory.location.lng]}
                icon={createPhotoIcon(memory.imageUrl, index === currentIndex)}
                eventHandlers={{
                  click: () => {
                    goToMemory(index);
                    setHoveredMemory(memory); // Open overlay on click (mobile support)
                  },
                  mouseover: () => handleMarkerEnter(memory),
                  mouseout: handleMarkerLeave
                }}
                zIndexOffset={index === currentIndex ? 1000 : 0}
              />
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      {/* Header / Title Overlay */}
      <div className="absolute top-0 left-0 w-full z-[1000] p-4 sm:p-6 pointer-events-none flex justify-center bg-gradient-to-b from-white/60 to-transparent">
        <h1 className="text-3xl sm:text-5xl font-handwriting text-rose-600 drop-shadow-sm pointer-events-auto bg-white/30 backdrop-blur-sm px-6 py-2 rounded-full border border-white/50">
          {currentIndex === MEMORIES.length
            ? "Where we are gonna dance next?"
            : "Dancing together around the world"
          }
        </h1>
      </div>

      {/* Full Screen Overlay on Hover */}
      <AnimatePresence>
        {hoveredMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 sm:p-8 cursor-pointer"
            onClick={() => setHoveredMemory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl max-h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row pointer-events-auto cursor-auto"
              onMouseEnter={handleOverlayEnter}
              onMouseLeave={handleOverlayLeave}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button (Mobile/Desktop helper) */}
              <button
                onClick={() => setHoveredMemory(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors md:hidden"
              >
                <X size={20} />
              </button>

              {/* Image / Video Section */}
              <div className="w-full md:w-2/3 h-64 md:h-auto relative bg-gray-100 flex items-center justify-center bg-black">
                {hoveredMemory.videoUrl ? (
                  <video
                    src={hoveredMemory.videoUrl}
                    className="w-full h-full object-contain"
                    autoPlay
                    controls
                    loop
                    // muted // Autoplay often requires muted, but user might want sound. Let's try without first, or add a toggle.
                    poster={hoveredMemory.imageUrl}
                  />
                ) : (
                  <img
                    src={hoveredMemory.imageUrl}
                    alt={hoveredMemory.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Content Section */}
              <div className="w-full md:w-1/3 p-6 md:p-8 flex flex-col justify-center bg-white/95 backdrop-blur">
                <h2 className="text-3xl font-handwriting text-rose-600 mb-4">{hoveredMemory.title}</h2>

                <div className="flex items-center gap-4 text-sm text-gray-500 font-medium mb-6">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} className="text-rose-400" />
                    <span>{new Date(hoveredMemory.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={16} className="text-rose-400" />
                    <span>{hoveredMemory.location.lat.toFixed(2)}, {hoveredMemory.location.lng.toFixed(2)}</span>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed font-light text-lg">
                  {hoveredMemory.description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Controls (Bottom Right) */}
      <div className="absolute bottom-8 right-8 z-[1000] flex gap-3 pointer-events-auto">
        <button
          onClick={handlePrev}
          className="p-3 bg-white hover:bg-rose-50 text-rose-500 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 border border-rose-100"
          aria-label="Previous Memory"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={handleNext}
          className="p-3 bg-white hover:bg-rose-50 text-rose-500 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 border border-rose-100"
          aria-label="Next Memory"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );

};

export default App;