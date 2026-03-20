import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { CameraButton } from '@/components/CameraButton';
import { PhotoDisplay } from '@/components/PhotoDisplay';
import { PromptEditor } from '@/components/PromptEditor';
import { HistoryBrowser, PhotoSession } from '@/components/HistoryBrowser';

const DEFAULT_PROMPT =
  'Transform this photo to look like it was taken in the 1950s. Convert to black and white or sepia tone. Change the clothing of any people to 1950s style fashion. Place the scene in a 1950s setting with period-appropriate props, furniture, and environment.';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type AppState = 'idle' | 'camera' | 'processing' | 'displaying';

interface DisplaySession {
  originalImageUrl: string;
  transformedImageUrl: string;
  createdAt: string;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [displaySession, setDisplaySession] = useState<DisplaySession | null>(null);
  const [history, setHistory] = useState<PhotoSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const spaceDismissRef = useRef(false);

  // Load history on mount
  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/history`);
      if (response.ok) {
        const sessions: PhotoSession[] = await response.json();
        setHistory(sessions);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Listen for spacebar to open camera when idle
  // keydown: preventDefault to stop page scroll
  // keyup: open camera (avoids conflict with dismiss-Space triggering open)
  useEffect(() => {
    if (appState !== 'idle') return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
      }
    };

    const handleKeyup = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        // If Space was just used to dismiss a photo, skip opening the camera
        if (spaceDismissRef.current) {
          spaceDismissRef.current = false;
          return;
        }
        const cameraButton = document.querySelector('button[aria-label="Open camera"]') as HTMLButtonElement;
        if (cameraButton && !cameraButton.disabled) {
          cameraButton.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('keyup', handleKeyup);
    };
  }, [appState]);

  const handleCameraOpen = useCallback(() => setAppState('camera'), []);
  const handleCameraClose = useCallback(() => setAppState('idle'), []);

  const handleCapture = useCallback(
    async (blob: Blob) => {
      setAppState('processing');
      setError(null);

      try {
        const formData = new FormData();
        formData.append('image', blob, 'photo.png');
        formData.append('prompt', prompt);

        const response = await fetch(`${API_URL}/api/transform`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const apiError = errorData as { error?: string; details?: string };
          throw new Error(
            apiError.details || apiError.error || `Server error: ${response.status}`
          );
        }

        const session: PhotoSession = await response.json();
        setDisplaySession({
          originalImageUrl: `${API_URL}${session.originalUrl}`,
          transformedImageUrl: `${API_URL}${session.transformedUrl}`,
          createdAt: session.createdAt,
        });
        // Add the new session to history
        setHistory((prev) => [session, ...prev]);
        setAppState('displaying');
      } catch (err) {
        console.error('Transform failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to transform image');
        setAppState('idle');
      }
    },
    [prompt]
  );

  const handleDismissPhoto = useCallback(() => {
    spaceDismissRef.current = true;
    setDisplaySession(null);
    setAppState('idle');
  }, []);

  const handleSelectHistoryImage = useCallback((session: PhotoSession) => {
    setDisplaySession({
      originalImageUrl: `${API_URL}${session.originalUrl}`,
      transformedImageUrl: `${API_URL}${session.transformedUrl}`,
      createdAt: session.createdAt,
    });
    setAppState('displaying');
  }, []);

  const handleDeleteHistorySession = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/history/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError = errorData as { error?: string; details?: string };
        throw new Error(apiError.details || apiError.error || 'Failed to delete session');
      }

      setHistory((prev) => prev.filter((session) => session.id !== id));
    } catch (err) {
      console.error('Delete history item failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete history item');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Transformed photo full-screen overlay */}
      {appState === 'displaying' && displaySession && (
        <PhotoDisplay
          originalImageUrl={displaySession.originalImageUrl}
          transformedImageUrl={displaySession.transformedImageUrl}
          createdAt={displaySession.createdAt}
          onDismiss={handleDismissPhoto}
        />
      )}

      {/* Processing overlay */}
      {appState === 'processing' && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black/90">
          <div className="flex flex-col items-center gap-10">
            <div className="relative">
              <Loader2 className="w-40 h-40 text-amber-400 animate-spin" />
              <div className="absolute inset-0 w-40 h-40 rounded-full border-4 border-amber-400/20" />
            </div>
            <div className="text-center">
              <p className="text-white text-5xl font-medium mb-3">Developing your photo...</p>
              <p className="text-gray-400 text-2xl">AI is working its magic</p>
            </div>
            {/* Retro film strip animation */}
            <div className="flex gap-3 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full bg-amber-400/40 animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex flex-col min-h-screen">
        {/* Hero section — full-screen camera button */}
        <section className="flex-1 flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
          {/* Background grain texture */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
            }}
          />

          {/* Title */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
            <h1 className="text-2xl font-bold tracking-[0.3em] text-amber-400/80 uppercase">
              AI Photo Booth
            </h1>
            <p className="text-gray-600 text-xs tracking-widest mt-1 uppercase">
              Step right up
            </p>
          </div>

          {/* Camera button */}
          <CameraButton
            onCapture={handleCapture}
            onCameraOpen={handleCameraOpen}
            onCameraClose={handleCameraClose}
            disabled={appState === 'processing'}
          />

          {/* Error display */}
          {error && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-start gap-2 max-w-sm px-4 py-3 bg-red-950/80 border border-red-800/50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-300 text-sm font-medium">Transform failed</p>
                <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-700 animate-bounce">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </section>

        {/* Bottom section — prompt + history */}
        <section className="px-4 pb-12 pt-8 space-y-8 bg-gradient-to-b from-background to-gray-950">
          {/* Divider */}
          <div className="flex items-center gap-4 max-w-2xl mx-auto">
            <div className="flex-1 h-px bg-white/5" />
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-amber-400/20" />
              ))}
            </div>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* History */}
          <HistoryBrowser
            sessions={history}
            apiUrl={API_URL}
            onSelectImage={handleSelectHistoryImage}
            onDeleteSession={handleDeleteHistorySession}
          />

          {/* Prompt editor */}
          <PromptEditor prompt={prompt} onPromptChange={setPrompt} />
        </section>
      </main>
    </div>
  );
}
