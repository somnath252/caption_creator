import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, RotateCcw } from 'lucide-react';
import { CaptionChunk } from '../types';
import { cn } from '../lib/utils';

interface PreviewScreenProps {
  videoUrl: string;
  captions: CaptionChunk[];
  onReset: () => void;
}

export function PreviewScreen({ videoUrl, captions, onReset }: PreviewScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentMs, setCurrentMs] = useState(0);
  const [activeChunkIndex, setActiveChunkIndex] = useState<number | null>(null);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const ms = videoRef.current.currentTime * 1000;
    setCurrentMs(ms);

    // Find active chunk
    const index = captions.findIndex((c) => ms >= c.startMs && ms <= c.endMs);
    setActiveChunkIndex(index !== -1 ? index : null);
  };

  const activeChunk = activeChunkIndex !== null ? captions[activeChunkIndex] : null;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto space-y-8 py-8">
      <div className="flex flex-col items-center space-y-2 text-center">
        <h2 className="text-3xl font-extrabold text-white">Your Render is Ready</h2>
        <p className="text-slate-400">Kinetic typography perfectly synced and ready to deploy.</p>
      </div>

      <div className="relative rounded-3xl overflow-hidden bg-black ring-4 ring-slate-800 shadow-2xl flex items-center justify-center" style={{ aspectRatio: '9/16', maxHeight: '70vh' }}>
        {/* Video Player */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-contain"
          autoPlay
          controls
          controlsList="nodownload"
          onTimeUpdate={handleTimeUpdate}
          crossOrigin="anonymous"
        />

        {/* Captions Overlay Container */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center pt-[30%]">
          <AnimatePresence mode="popLayout">
            {activeChunk && (
              <motion.div
                key={activeChunkIndex}
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2, type: 'spring', damping: 15 }}
                className="flex flex-col items-center space-y-4"
              >
                {/* Emoji Float */}
                {activeChunk.emoji && (
                  <motion.div
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: 0.1, type: 'spring', bounce: 0.6 }}
                    className="text-6xl filter drop-shadow-xl"
                  >
                    {activeChunk.emoji}
                  </motion.div>
                )}

                {/* Words Container */}
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 px-8">
                  {activeChunk.words.map((w, idx) => {
                     // Fast staggered pop for each word
                     const delay = idx * 0.1;
                     const isHighlight = w.color && w.color.toLowerCase() !== '#ffffff';
                     
                     return (
                       <motion.span
                         key={idx}
                         initial={{ opacity: 0, scale: 0.5, rotate: isHighlight ? -2 : 0 }}
                         animate={{ opacity: 1, scale: isHighlight ? 1.1 : 1, rotate: 0 }}
                         transition={{ delay, type: 'spring', bounce: 0.5 }}
                         style={{ 
                           color: w.color || '#FFF',
                           WebkitTextStroke: '2px black'
                         }}
                         className={cn(
                           "font-[family:var(--font-montserrat)] font-extrabold uppercase tracking-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] leading-none",
                           isHighlight ? "text-5xl" : "text-4xl"
                         )}
                       >
                         {w.word}
                       </motion.span>
                     );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={onReset}
          className="px-6 py-3 rounded-full font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center space-x-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Process Another</span>
        </button>
        <a
          href={videoUrl}
          download="autocaption-pro-render.mp4"
          className="px-8 py-3 rounded-full font-bold bg-[#00FF7F] text-slate-900 hover:bg-[#00FF7F]/90 hover:scale-105 active:scale-95 transition-all flex items-center space-x-2 shadow-[0_0_20px_rgba(0,255,127,0.3)]"
        >
          <Download className="w-5 h-5" />
          <span>Download Video</span>
        </a>
      </div>
    </div>
  );
}
