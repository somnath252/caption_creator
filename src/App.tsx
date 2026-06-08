import { useState } from 'react';
import { UploadScreen } from './components/UploadScreen';
import { ProcessingScreen } from './components/ProcessingScreen';
import { PreviewScreen } from './components/PreviewScreen';
import { AppState, CaptionChunk } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>('UPLOAD');
  const [progressMsg, setProgressMsg] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<CaptionChunk[]>([]);

  const handleUpload = async (file: File) => {
    setAppState('PROCESSING');
    setProgressMsg('Uploading secure asset...');
    
    try {
      const formData = new FormData();
      formData.append('video', file);

      // We poll messages via generic timeouts to simulate the backend steps since
      // Gemini processing takes around ~10-20 seconds.
      setTimeout(() => setProgressMsg('Transcribing and processing with Gemini AI...'), 3000);
      setTimeout(() => setProgressMsg('Analyzing NLP emotion mapping & kinetic timings...'), 10000);

      const res = await fetch('/api/generate-captions', {
        method: 'POST',
        body: formData,
      });

      let responseText = '';
      let data;
      
      responseText = await res.text();
      if (responseText.includes('413 Request Entity Too Large') || res.status === 413) {
        throw new Error("File is too large for the preview environment proxy. Please use a smaller video (under 10MB).");
      }
      if (responseText.includes('Cookie check') || responseText.includes('<title>Cookie check</title>')) {
        throw new Error("Authentication request blocked by proxy. Please open the app in a new tab (top right icon) to upload video files.");
      }
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON, raw text response:", responseText);
        throw new Error("Server returned an invalid response. See console for details.");
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload and process');
      }

      setProgressMsg('Finishing kinetic logic...');

      
      setVideoUrl(data.videoUrl);
      setCaptions(data.captions || []);
      setAppState('PREVIEW');
    } catch (err) {
      console.error(err);
      alert('An error occurred during processing. Please try again.');
      setAppState('UPLOAD');
    }
  };

  const handleReset = () => {
    setVideoUrl(null);
    setCaptions([]);
    setAppState('UPLOAD');
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans selection:bg-[#00FF7F]/30 overflow-x-hidden">
      <main className="container mx-auto px-4 min-h-screen flex flex-col justify-center py-10">
        {appState === 'UPLOAD' && <UploadScreen onUpload={handleUpload} />}
        {appState === 'PROCESSING' && <ProcessingScreen progressMessage={progressMsg} />}
        {appState === 'PREVIEW' && videoUrl && (
          <PreviewScreen 
            videoUrl={videoUrl} 
            captions={captions} 
            onReset={handleReset} 
          />
        )}
      </main>
    </div>
  );
}
