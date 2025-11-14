import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getConversation } from '@/src/lib/actions/conversations';
import { MessageThread } from '@/components/messages/message-thread';
import { MessageComposer } from '@/components/messages/message-composer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Briefcase } from 'lucide-react';

interface MessageDetailPageProps {
  params: {
    id: string;
  };
}

export default async function MessageDetailPage({ params }: MessageDetailPageProps) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const conversationId = parseInt(params.id);

  if (isNaN(conversationId)) {
    notFound();
  }

  let conversation;
  try {
    conversation = await getConversation(conversationId);
  } catch (error) {
    notFound();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/messages">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {conversation.subject || 'No subject'}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {conversation.client && (
                <Link
                  href={`/clients/${conversation.client.id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <User className="h-3 w-3" />
                  {conversation.client.name}
                </Link>
              )}

              {conversation.serviceRequest && (
                <Link
                  href={`/services/requests/${conversation.serviceRequest.id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-teal-300 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
                >
                  <Briefcase className="h-3 w-3" />
                  {conversation.serviceRequest.service.name}
                </Link>
              )}

              {!conversation.client && !conversation.serviceRequest && (
                <span className="text-xs text-gray-500">General conversation</span>
              )}
            </div>
          </div>

          <div className="text-right text-sm text-gray-500">
            {conversation.messages.length} message
            {conversation.messages.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
        <MessageThread
          messages={conversation.messages}
          currentUserId={session.user?.id}
        />

        {/* Composer */}
        <MessageComposer conversationId={conversationId} />
      </div>
    </div>
  );
}
