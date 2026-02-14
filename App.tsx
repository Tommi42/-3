import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
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

// Internal component to handle map clicks
const MapClickHandler = ({ onClick }: { onClick: () => void }) => {
  useMapEvents({
    click: onClick,
  });
  return null;
};

const App: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // We can derive the memory to show from currentIndex
  const currentMemory = MEMORIES[currentIndex];
  // Check if we are in "World View"
  const isWorldView = !hasInteracted || currentIndex === MEMORIES.length;

  const handleNext = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      setIsPanelOpen(true); // Open panel on first interaction
      return;
    }

    setCurrentIndex((prev) => {
      const nextIndex = (prev + 1) % (MEMORIES.length + 1);
      // Close panel if we reach World View
      if (nextIndex === MEMORIES.length) {
        setIsPanelOpen(false);
      } else {
        setIsPanelOpen(true);
      }
      return nextIndex;
    });
  };

  const handlePrev = () => {
    setHasInteracted(true);
    setCurrentIndex((prev) => {
      const nextIndex = (prev - 1 + (MEMORIES.length + 1)) % (MEMORIES.length + 1);
      // Close panel if we reach World View
      if (nextIndex === MEMORIES.length) {
        setIsPanelOpen(false);
      } else {
        setIsPanelOpen(true);
      }
      return nextIndex;
    });
  };

  const goToMemory = (index: number) => {
    setHasInteracted(true);
    setCurrentIndex(index);
    setIsPanelOpen(true);
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        setIsPanelOpen(false);
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
    <div className="relative w-full h-full bg-rose-50 overflow-hidden flex">

      {/* Side Panel (Left) */}
      <AnimatePresence>
        {isPanelOpen && !isWorldView && currentMemory && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-4 left-4 bottom-4 w-auto min-w-[380px] max-w-[75vw] z-[500] bg-white shadow-2xl flex flex-col overflow-hidden rounded-3xl"
          >
            {/* Close Button (Mobile helper) */}
            <button
              onClick={() => setIsPanelOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-md"
            >
              <X size={20} />
            </button>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Image / Video Section - Fixed Height to drive width */}
              <div className="h-[55vh] bg-black flex items-center justify-center shrink-0">
                {currentMemory.videoUrl ? (
                  <video
                    src={currentMemory.videoUrl}
                    className="h-full w-auto max-w-full object-contain"
                    autoPlay
                    controls
                    loop
                    poster={currentMemory.imageUrl}
                  />
                ) : (
                  <img
                    src={currentMemory.imageUrl}
                    alt={currentMemory.title}
                    className="h-full w-auto max-w-full object-contain"
                  />
                )}
              </div>

              {/* Content Section */}
              <div className="p-6 flex flex-col gap-4">
                <h2 className="text-4xl font-handwriting text-rose-600 leading-tight">
                  {currentMemory.title}
                </h2>

                <div className="flex flex-col gap-2 text-sm text-gray-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-rose-400" />
                    <span>{new Date(currentMemory.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-rose-400" />
                    <span>{currentMemory.location.lat.toFixed(4)}, {currentMemory.location.lng.toFixed(4)}</span>
                  </div>
                </div>

                <div className="w-full h-px bg-rose-100 my-2" />

                <p className="text-gray-700 leading-relaxed font-light text-lg">
                  {currentMemory.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Map Container (Takes remaining space) */}
      <div className="flex-1 w-full h-full relative z-0">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom={true}
          zoomControl={false}
          className="w-full h-full outline-none"
          style={{ height: '100%', width: '100%', background: 'transparent' }}
        >
          <MapClickHandler onClick={() => setIsPanelOpen(false)} />

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
                    goToMemory(index); // This handles setting panel open
                  }
                }}
                zIndexOffset={index === currentIndex ? 1000 : 0}
              />
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      {/* Header / Title Overlay - Centered or shifted? Let's keep it centered on screen for now */}
      <div className={`absolute top-0 left-0 w-full z-[1000] p-4 sm:p-6 pointer-events-none flex justify-center transition-all duration-500 ${isPanelOpen && !isWorldView ? 'pl-[37.5%]' : ''}`}>
        <h1 className="text-2xl sm:text-4xl font-handwriting text-rose-600 drop-shadow-sm pointer-events-auto bg-white/30 backdrop-blur-sm px-6 py-2 rounded-full border border-white/50 text-center">
          {currentIndex === MEMORIES.length
            ? "Where we are gonna dance next?"
            : "Dancing together around the world"
          }
        </h1>
      </div>

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