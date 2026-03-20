import { useCallback, useEffect, useState } from 'react';
import { Download, RotateCcw, Sparkles, X } from 'lucide-react';
import { PromptEditor } from './PromptEditor';

interface PhotoDisplayProps {
  originalImageUrl: string;
  transformedImageUrl: string;
  createdAt: string;
  onDismiss: () => void;
  prompt?: string;
  promptHistory?: string[];
  model?: string;
  onModelChange?: (model: string) => void;
  onReprocess?: (prompt: string, model: string) => void;
}

function formatDateForFilename(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

export function PhotoDisplay({ originalImageUrl, transformedImageUrl, createdAt, onDismiss, prompt, promptHistory, model, onModelChange, onReprocess }: PhotoDisplayProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState(prompt ?? '');
  const [editableModel, setEditableModel] = useState(model ?? 'gpt-image-1');
  const dateStr = formatDateForFilename(createdAt);

  const handleDownload = useCallback(async () => {
    const url = showOriginal ? originalImageUrl : transformedImageUrl;
    const filename = showOriginal ? `${dateStr} - original.png` : `${dateStr} - ai.png`;

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
  }, [showOriginal, originalImageUrl, transformedImageUrl]);

  // Listen for spacebar to dismiss
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement;
      return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable);
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping()) {
        e.preventDefault();
        onDismiss();
      }
    };

    const handleKeyup = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping()) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('keyup', handleKeyup);
    };
  }, [onDismiss]);

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
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/60 border border-white/20 text-white text-xs hover:border-amber-400/50"
          title="Download current image"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
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

      {/* Prompt editor + Reprocess — history only */}
      {prompt !== undefined && (
        <div
          className="absolute bottom-0 left-8 right-8 z-40 pb-4"
          onClick={(e) => e.stopPropagation()}
        >
          <PromptEditor
            prompt={editablePrompt}
            onPromptChange={(p) => { setEditablePrompt(p); }}
            promptHistory={promptHistory ?? []}
            model={editableModel}
            onModelChange={(m) => { setEditableModel(m); onModelChange?.(m); }}
            onReprocess={onReprocess ? () => onReprocess(editablePrompt, editableModel) : undefined}
          />
        </div>
      )}

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
