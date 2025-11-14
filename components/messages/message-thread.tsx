'use client';

import { useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type Message = {
  id: number;
  body: string;
  createdAt: Date;
  readAt: Date | null;
  author: {
    id: number;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
};

interface MessageThreadProps {
  messages: Message[];
  currentUserId?: number;
}

export function MessageThread({ messages, currentUserId }: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to latest message on mount and when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500">No messages yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Start the conversation by sending a message below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 space-y-4 overflow-y-auto p-4"
    >
      {messages.map((message, index) => {
        const isOwnMessage = message.author.id === currentUserId;
        const showDateDivider =
          index === 0 ||
          format(new Date(messages[index - 1].createdAt), 'yyyy-MM-dd') !==
            format(new Date(message.createdAt), 'yyyy-MM-dd');

        return (
          <div key={message.id}>
            {showDateDivider && (
              <div className="mb-4 flex items-center justify-center">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {format(new Date(message.createdAt), 'MMMM d, yyyy')}
                </span>
              </div>
            )}

            <div
              className={cn(
                'flex gap-3',
                isOwnMessage ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <Avatar
                src={message.author.avatarUrl}
                fallback={message.author.name || message.author.email || 'U'}
                className={cn(
                  'h-8 w-8',
                  isOwnMessage && 'ring-2 ring-teal-200'
                )}
              />

              <div
                className={cn(
                  'flex max-w-[70%] flex-col gap-1',
                  isOwnMessage ? 'items-end' : 'items-start'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isOwnMessage ? 'text-teal-700' : 'text-gray-700'
                    )}
                  >
                    {isOwnMessage ? 'You' : message.author.name || message.author.email}
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(message.createdAt), 'h:mm a')}
                  </span>
                </div>

                <div
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm',
                    isOwnMessage
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.body}
                  </p>
                </div>

                {!message.readAt && !isOwnMessage && (
                  <span className="text-xs text-gray-400">Unread</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
