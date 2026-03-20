import React, { useState } from 'react';
import { Download, RotateCcw, Sparkles, X } from 'lucide-react';

interface PhotoDisplayProps {
  originalImageUrl: string;
  transformedImageUrl: string;
  onDismiss: () => void;
}

export function PhotoDisplay({ originalImageUrl, transformedImageUrl, onDismiss }: PhotoDisplayProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black cursor-pointer animate-fade-in"
      onClick={onDismiss}
    >
      {/* Dismiss hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/70 text-sm pointer-events-none">
        <X className="w-4 h-4" />
        <span>Click anywhere to return</span>
      </div>

      {/* Top-right controls */}
      <div className="absolute top-4 right-12 z-40 flex items-center gap-2">
        <a
          href={showOriginal ? originalImageUrl : transformedImageUrl}
          download={showOriginal ? 'original.png' : 'ai-result.png'}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/60 border border-white/20 text-white text-xs hover:border-amber-400/50"
          title="Download current image"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </a>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowOriginal((prev) => !prev);
          }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 border border-white/20 text-white text-xs hover:border-amber-400/50"
        >
          {showOriginal ? <RotateCcw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          {showOriginal ? 'Showing original' : 'Showing AI result'}
        </button>
      </div>

      {/* Image — click passes through to parent overlay to dismiss */}
      <img
        src={showOriginal ? originalImageUrl : transformedImageUrl}
        alt={showOriginal ? 'Original photo' : 'Transformed photo'}
        className="max-w-full max-h-full object-contain"
      />

      {/* Decorative film strip effect */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-black flex flex-col justify-around items-center pointer-events-none opacity-60">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-4 h-3 rounded-sm bg-gray-800 border border-gray-700" />
        ))}
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-black flex flex-col justify-around items-center pointer-events-none opacity-60">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-4 h-3 rounded-sm bg-gray-800 border border-gray-700" />
        ))}
      </div>
    </div>
  );
}
