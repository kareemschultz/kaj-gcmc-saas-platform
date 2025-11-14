'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createMessage } from '@/src/lib/actions/conversations';
import { Send } from 'lucide-react';

interface MessageComposerProps {
  conversationId: number;
}

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!body.trim()) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await createMessage({
          conversationId,
          body: body.trim(),
        });

        setBody('');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t bg-white p-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            disabled={isPending}
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
          />
          {error && (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          )}
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={!body.trim() || isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </form>
  );
}
