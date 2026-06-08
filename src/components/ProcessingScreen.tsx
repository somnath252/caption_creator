import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProcessingScreenProps {
  progressMessage: string;
}

export function ProcessingScreen({ progressMessage }: ProcessingScreenProps) {
  const steps = [
    { id: 'upload', label: 'Uploading secure asset' },
    { id: 'extract', label: 'Extracting audio channels' },
    { id: 'transcribe', label: 'WhisperX Speech-to-Text' },
    { id: 'nlp', label: 'NLP segmentation & emotion mapping' },
    { id: 'render', label: 'Generating kinetic parameters' },
  ];

  const getCurrentStepIndex = () => {
    const msg = progressMessage.toLowerCase();
    if (msg.includes('uploading')) return 0;
    if (msg.includes('extracting')) return 1;
    if (msg.includes('transcribing') || msg.includes('gemini')) return 2;
    if (msg.includes('analyzing') || msg.includes('generate')) return 3;
    if (msg.includes('finishing')) return 4;
    return 2; // Default running state
  };

  const activeIndex = getCurrentStepIndex();

  return (
    <div className="flex flex-col flex-1 items-center justify-center w-full max-w-xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-16 h-16 border-4 border-slate-700 border-t-[#00FF7F] rounded-full mx-auto"
        />
        <h2 className="text-2xl font-bold text-white tracking-tight">Processing Video</h2>
        <p className="text-slate-400">Using Gemini AI architecture to craft perfect timings.</p>
      </div>

      <div className="w-full bg-slate-800/50 rounded-2xl p-6 space-y-6 flex flex-col border border-slate-700/50 box-border">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;
          const isPending = index > activeIndex;

          return (
            <div key={step.id} className="flex items-center space-x-4">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors duration-300",
                  isComplete ? "bg-[#00FF7F] border-[#00FF7F]" : 
                  isActive ? "border-[#00FF7F] text-[#00FF7F]" : "border-slate-600 text-slate-600"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-slate-900" strokeWidth={3} />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                )}
              </div>
              <div
                className={cn(
                  "font-medium transition-colors duration-300 w-full flex justify-between",
                  isComplete ? "text-slate-300" :
                  isActive ? "text-white" : "text-slate-600"
                )}
              >
                <span>{step.label}</span>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-[#00FF7F]"
                  >
                    ...
                  </motion.span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
