import React, { useCallback, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebcam } from '@/hooks/useWebcam';

interface CameraButtonProps {
  onCapture: (blob: Blob) => void;
  disabled?: boolean;
}

export function CameraButton({ onCapture, disabled }: CameraButtonProps) {
  const { videoRef, canvasRef, isActive, error, startWebcam, stopWebcam, capturePhoto } =
    useWebcam();
  const [showWebcam, setShowWebcam] = React.useState(false);

  const handleOpen = useCallback(async () => {
    setShowWebcam(true);
    await startWebcam();
  }, [startWebcam]);

  const handleClose = useCallback(() => {
    stopWebcam();
    setShowWebcam(false);
  }, [stopWebcam]);

  const handleCapture = useCallback(() => {
    const blob = capturePhoto();
    if (blob) {
      stopWebcam();
      setShowWebcam(false);
      onCapture(blob);
    }
  }, [capturePhoto, stopWebcam, onCapture]);

  // Listen for spacebar to take photo when webcam is active
  useEffect(() => {
    if (!showWebcam) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleCapture();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [showWebcam, handleCapture]);

  if (showWebcam) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Close webcam"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {error ? (
          <div className="text-center px-8">
            <div className="text-red-400 text-lg mb-4">Camera Error</div>
            <div className="text-gray-400 text-sm mb-6">{error}</div>
            <Button onClick={handleClose} variant="outline">
              Go Back
            </Button>
          </div>
        ) : (
          <>
            {/* Webcam preview — 5/6 screen height, centered */}
            <div className="relative mx-4" style={{ height: '83.333vh', aspectRatio: '4/3', maxWidth: '100vw' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-lg border border-white/10 bg-black"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Camera frame overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-400/70 rounded-tl-sm" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-400/70 rounded-tr-sm" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-400/70 rounded-bl-sm" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-400/70 rounded-br-sm" />
              </div>

              {/* Capture button overlaid at the bottom of the preview */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                <button
                  onClick={handleCapture}
                  disabled={!isActive}
                  className="relative w-20 h-20 rounded-full bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-all active:scale-95 shadow-lg shadow-white/20"
                  aria-label="Take photo"
                >
                  <div className="absolute inset-2 rounded-full border-2 border-gray-300" />
                </button>
                <p className="text-gray-300 text-sm">Take Photo</p>
                <p className="text-gray-300 text-xs">or press Space</p>
              </div>
            </div>
          </>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <button
      onClick={handleOpen}
      disabled={disabled}
      className="group relative flex flex-col items-center justify-center gap-6 w-64 h-64 rounded-full bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-amber-400/30 hover:border-amber-400/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed pulse-amber hover:scale-105 active:scale-95 shadow-2xl shadow-black"
      aria-label="Open camera"
    >
      <Camera
        className="w-24 h-24 text-amber-400 group-hover:text-amber-300 transition-colors drop-shadow-lg"
        strokeWidth={1.5}
      />
      <span className="text-amber-400/80 group-hover:text-amber-300 text-lg font-medium tracking-widest uppercase">
        Snap
      </span>

      {/* Decorative ring */}
      <div className="absolute inset-0 rounded-full border border-amber-400/10 group-hover:border-amber-400/20 transition-colors" style={{ margin: '-8px' }} />
    </button>
  );
}
