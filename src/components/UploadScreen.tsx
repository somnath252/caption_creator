import React, { useCallback, useState } from 'react';
import { UploadCloud, FileVideo, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface UploadScreenProps {
  onUpload: (file: File) => void;
}

export function UploadScreen({ onUpload }: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const validateAndUpload = (file: File) => {
    setError(null);
    if (!file.type.startsWith('video/')) {
      setError('Please upload a valid video file (.mp4, .mov)');
      return;
    }
    if (file.size > 60 * 1024 * 1024) {
      setError('File size must be under 60MB');
      return;
    }
    onUpload(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto min-h-[60vh] space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">AutoCaption <span className="text-[#00FF7F]">Pro</span></h1>
        <p className="text-slate-400">Upload a vertical video to generate AI-powered kinetic typography captions.</p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "w-full flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-3xl transition-colors duration-200 cursor-pointer",
          isDragging ? "border-[#00FF7F] bg-[#00FF7F]/10" : "border-slate-700 bg-slate-800 hover:border-slate-500"
        )}
      >
        <div className="space-y-4 flex flex-col items-center p-12 text-center pointer-events-none">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center">
            <UploadCloud className={cn("w-10 h-10", isDragging ? "text-[#00FF7F]" : "text-slate-400")} />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium text-white">
              <span className="text-[#00FF7F] hover:underline relative z-10 pointer-events-auto cursor-pointer flex-inline" onClick={() => document.getElementById('file-upload')?.click()}>
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-sm text-slate-400">MP4, MOV (up to 60MB)</p>
          </div>
        </div>
        <input
          id="file-upload"
          name="video"
          type="file"
          accept="video/mp4,video/quicktime"
          className="sr-only"
          onChange={handleChange}
        />
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex items-center space-x-2 text-rose-500 bg-rose-500/10 px-4 py-3 rounded-lg w-full"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
