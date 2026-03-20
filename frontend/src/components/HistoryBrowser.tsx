import React, { useCallback, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Download, ImageIcon, Trash2 } from 'lucide-react';

export interface PhotoSession {
  id: string;
  originalUrl: string;
  transformedUrl: string;
  prompt: string;
  createdAt: string;
}

interface HistoryBrowserProps {
  sessions: PhotoSession[];
  apiUrl: string;
  onSelectImage: (session: PhotoSession) => void;
  onDeleteSession: (id: string) => void;
}

export function HistoryBrowser({ sessions, apiUrl, onSelectImage, onDeleteSession }: HistoryBrowserProps) {
  // showOriginalId: which tile is currently revealing the original (after 5s hold)
  const [showOriginalId, setShowOriginalId] = useState<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((id: string) => {
    hoverTimer.current = setTimeout(() => setShowOriginalId(id), 5000);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setShowOriginalId(null);
  }, []);

  if (sessions.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">History</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-lg">
          <ImageIcon className="w-10 h-10 text-gray-700 mb-3" />
          <p className="text-gray-600 text-sm">No photos yet — take your first snap!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-amber-400/70" />
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          History
        </h2>
        <span className="text-xs text-gray-600 ml-1">({sessions.length} photo{sessions.length !== 1 ? 's' : ''})</span>
      </div>

      <ScrollArea className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="relative group cursor-pointer rounded-lg overflow-hidden border border-white/10 hover:border-amber-400/50 transition-all duration-200 aspect-square"
              onMouseEnter={() => handleMouseEnter(session.id)}
              onMouseLeave={handleMouseLeave}
              onClick={() => onSelectImage(session)}
              title={`Taken: ${new Date(session.createdAt).toLocaleString()}`}
            >
              {/* Original (revealed after 5s hover) */}
              <img
                src={`${apiUrl}${session.originalUrl}`}
                alt="Original"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  showOriginalId === session.id ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {/* Transformed (shown by default) */}
              <img
                src={`${apiUrl}${session.transformedUrl}`}
                alt="Transformed"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  showOriginalId === session.id ? 'opacity-0' : 'opacity-100'
                }`}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              {/* Labels */}
              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-white text-xs font-medium">
                  {showOriginalId === session.id ? 'Showing original' : 'Hold 5s to see original'}
                </p>
                <p className="text-gray-400 text-xs">
                  {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-amber-300 border border-amber-400/40">
                AI result
              </div>

              <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={`${apiUrl}${session.transformedUrl}`}
                  download={`ai-photo-${session.id}.png`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center w-7 h-7 rounded bg-black/65 border border-white/20 text-white hover:text-amber-300 hover:border-amber-300/50"
                  title="Download transformed image"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="inline-flex items-center justify-center w-7 h-7 rounded bg-black/65 border border-white/20 text-white hover:text-red-300 hover:border-red-300/50"
                  title="Delete from history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Hover indicator */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
