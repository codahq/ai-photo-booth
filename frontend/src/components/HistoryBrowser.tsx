import React, { useCallback, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Download, FolderDown, ImageIcon, Trash2 } from 'lucide-react';

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
  // Track which sessions are showing their original vs transformed
  const [shownImageId, setShownImageId] = useState<Record<string, 'transformed' | 'original'>>({});
  const [exporting, setExporting] = useState<'all' | 'originals' | 'transformations' | null>(null);
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number } | null>(null);

  const toggleImage = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShownImageId((prev) => ({
      ...prev,
      [id]: prev[id] === 'original' ? 'transformed' : 'original',
    }));
  }, []);

  const handleDownload = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, []);

  const handleExport = useCallback(async (type: 'all' | 'originals' | 'transformations') => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      setExporting(type);

      const entries: { url: string; filename: string }[] = [];
      for (const session of sessions) {
        const dateStr = formatDateForFilename(session.createdAt);
        if (type === 'all' || type === 'originals') {
          entries.push({ url: `${apiUrl}${session.originalUrl}`, filename: `${dateStr} - original.png` });
        }
        if (type === 'all' || type === 'transformations') {
          entries.push({ url: `${apiUrl}${session.transformedUrl}`, filename: `${dateStr} - ai.png` });
        }
      }

      setExportProgress({ done: 0, total: entries.length });
      for (let i = 0; i < entries.length; i++) {
        const { url, filename } = entries[i];
        const response = await fetch(url);
        const blob = await response.blob();
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        setExportProgress({ done: i + 1, total: entries.length });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Export failed:', err);
      }
    } finally {
      setExporting(null);
      setExportProgress(null);
    }
  }, [sessions, apiUrl]);

  function formatDateForFilename(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  }

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
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Clock className="w-4 h-4 text-amber-400/70" />
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          History
        </h2>
        <span className="text-xs text-gray-600 ml-1">({sessions.length} photo{sessions.length !== 1 ? 's' : ''})</span>

        <div className="ml-auto flex items-center gap-2">
          {exporting && exportProgress ? (
            <span className="text-xs text-amber-400/70">
              Exporting {exportProgress.done}/{exportProgress.total}…
            </span>
          ) : (
            <>
              {(['all', 'originals', 'transformations'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleExport(type)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-gray-400 border border-white/10 hover:border-amber-400/40 hover:text-amber-300 transition-colors"
                  title={`Export ${type === 'all' ? 'all photos' : type === 'originals' ? 'all originals' : 'all transformations'}`}
                >
                  <FolderDown className="w-3 h-3" />
                  {type === 'all' ? 'Export all' : type === 'originals' ? 'Originals' : 'Transformations'}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <ScrollArea className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-2">
          {sessions.map((session) => {
            const isShowingOriginal = shownImageId[session.id] === 'original';
            return (
            <div
              key={session.id}
              className="relative group cursor-pointer rounded-lg overflow-hidden border border-white/10 hover:border-amber-400/50 transition-all duration-200 aspect-square"
              onClick={() => onSelectImage(session)}
              title={`Taken: ${new Date(session.createdAt).toLocaleString()}`}
            >
              {/* Original */}
              <img
                src={`${apiUrl}${session.originalUrl}`}
                alt="Original"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  isShowingOriginal ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {/* Transformed (shown by default) */}
              <img
                src={`${apiUrl}${session.transformedUrl}`}
                alt="Transformed"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  isShowingOriginal ? 'opacity-0' : 'opacity-100'
                }`}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              {/* Labels */}
              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-white text-xs font-medium">Click pill to toggle</p>
                <p className="text-gray-400 text-xs">
                  {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Clickable pill showing current image type */}
              <button
                type="button"
                onClick={(e) => toggleImage(session.id, e)}
                className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-amber-300 border border-amber-400/40 hover:border-amber-300/70 hover:text-amber-200 transition-colors"
                title="Click to switch between original and AI result"
              >
                {isShowingOriginal ? 'Original' : 'AI result'}
              </button>

              <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const dateStr = formatDateForFilename(session.createdAt);
                    handleDownload(
                      `${apiUrl}${isShowingOriginal ? session.originalUrl : session.transformedUrl}`,
                      isShowingOriginal ? `${dateStr} - original.png` : `${dateStr} - ai.png`
                    );
                  }}
                  className="inline-flex items-center justify-center w-7 h-7 rounded bg-black/65 border border-white/20 text-white hover:text-amber-300 hover:border-amber-300/50"
                  title="Download current image"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
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
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
