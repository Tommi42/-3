import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Heart } from 'lucide-react';
import { Memory } from '../types';

interface MemoryCardProps {
  memory: Memory;
  isActive?: boolean;
  className?: string;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ memory, isActive = true, className = '' }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`bg-white/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white/50 flex flex-col ${className}`}
    >
      <div className="relative h-48 sm:h-56 w-full overflow-hidden">
        <img 
          src={memory.imageUrl} 
          alt={memory.title}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
        />
        <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-sm text-rose-500">
          <Heart fill="currentColor" size={20} />
        </div>
      </div>
      
      <div className="p-6 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl sm:text-3xl font-handwriting text-gray-800">{memory.title}</h2>
        </div>
        
        <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-rose-400" />
            <span>{new Date(memory.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={14} className="text-rose-400" />
            <span>{memory.location.lat.toFixed(2)}, {memory.location.lng.toFixed(2)}</span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed mt-2 font-light">
          {memory.description}
        </p>
      </div>
    </motion.div>
  );
};

export default MemoryCard;