'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type ConversationWithDetails = {
  id: number;
  subject: string | null;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: number;
    name: string;
  } | null;
  serviceRequest: {
    id: number;
    service: {
      name: string;
    };
  } | null;
  messages: Array<{
    id: number;
    body: string;
    createdAt: Date;
    readAt: Date | null;
    author: {
      id: number;
      name: string | null;
    };
  }>;
  _count: {
    messages: number;
  };
};

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  currentUserId?: number;
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  const pathname = usePathname();

  const hasUnreadMessages = (conversation: ConversationWithDetails) => {
    return conversation.messages.some(
      (msg) => !msg.readAt && msg.author.id !== currentUserId
    );
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-gray-500">No conversations found</p>
        <p className="mt-1 text-xs text-gray-400">
          Start a new conversation to get started
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => {
        const lastMessage = conversation.messages[0];
        const isUnread = hasUnreadMessages(conversation);
        const isActive = pathname === `/messages/${conversation.id}`;

        return (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className={cn(
              'block px-4 py-4 transition-colors hover:bg-gray-50',
              isActive && 'bg-teal-50 hover:bg-teal-50',
              isUnread && !isActive && 'bg-blue-50/50'
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar
                src={null}
                fallback={
                  conversation.client?.name ||
                  lastMessage?.author.name ||
                  'Unknown'
                }
                className="mt-1"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3
                      className={cn(
                        'truncate text-sm',
                        isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                      )}
                    >
                      {conversation.subject || 'No subject'}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {conversation.client && (
                        <Badge variant="outline" className="text-xs">
                          {conversation.client.name}
                        </Badge>
                      )}
                      {conversation.serviceRequest && (
                        <Badge variant="secondary" className="text-xs">
                          {conversation.serviceRequest.service.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="whitespace-nowrap text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {isUnread && (
                      <div className="h-2 w-2 rounded-full bg-teal-600"></div>
                    )}
                  </div>
                </div>

                {lastMessage && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        'line-clamp-2 text-sm',
                        isUnread ? 'text-gray-700' : 'text-gray-500'
                      )}
                    >
                      <span className="font-medium">
                        {lastMessage.author.name}:
                      </span>{' '}
                      {lastMessage.body}
                    </p>
                    <span className="shrink-0 text-xs text-gray-400">
                      {conversation._count.messages}{' '}
                      {conversation._count.messages === 1 ? 'message' : 'messages'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
