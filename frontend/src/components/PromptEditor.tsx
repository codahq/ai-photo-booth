import React, { useState } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const DEFAULT_PROMPT =
  'Transform this photo to look like it was taken in the 1950s. Convert to black and white or sepia tone. Change the clothing of any people to 1950s style fashion. Place the scene in a 1950s setting with period-appropriate props, furniture, and environment.';

interface PromptEditorProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
}

export function PromptEditor({ prompt, onPromptChange }: PromptEditorProps) {
  const [open, setOpen] = useState(false);

  const handleReset = () => {
    onPromptChange(DEFAULT_PROMPT);
  };

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="w-full max-w-2xl mx-auto">
      <Collapsible.Trigger asChild>
        <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/50 hover:bg-gray-900/80 border border-white/10 hover:border-white/20 rounded-lg transition-all text-left group">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              Transformation Prompt
            </span>
            <span className="text-xs text-gray-500 hidden sm:inline">
              — click to {open ? 'collapse' : 'expand'}
            </span>
          </div>
          {open ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </Collapsible.Trigger>

      <Collapsible.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        <div className="mt-2 p-4 bg-gray-900/50 border border-white/10 rounded-lg space-y-3">
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={5}
            placeholder="Describe how you want your photo transformed..."
            className="resize-none bg-gray-950/50 border-white/10 text-gray-200 placeholder:text-gray-600 focus-visible:ring-amber-400/50"
          />
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-gray-400 hover:text-amber-400 text-xs"
            >
              Reset to default
            </Button>
          </div>
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
