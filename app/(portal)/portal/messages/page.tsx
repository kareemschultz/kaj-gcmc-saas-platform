import { Metadata } from 'next';
import Link from 'next/link';
import { getPortalConversations } from '@/lib/actions/portal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Messages | Client Portal',
};

export default async function PortalMessagesPage() {
  const clientId = 1; // From session in real app
  const conversations = await getPortalConversations(clientId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Communicate securely with your compliance team
        </p>
      </div>

      {/* Conversations List */}
      <div className="space-y-3">
        {conversations.map((conversation) => {
          const lastMessage = conversation.messages[0];
          const messageCount = conversation._count.messages;

          return (
            <Card key={conversation.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    <MessageSquare className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {conversation.subject || 'General Inquiry'}
                    </div>
                    {lastMessage && (
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">{lastMessage.author.name}:</span>{' '}
                        {lastMessage.body.length > 100
                          ? lastMessage.body.substring(0, 100) + '...'
                          : lastMessage.body}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {messageCount} message{messageCount !== 1 ? 's' : ''}
                      </Badge>
                      {lastMessage && (
                        <span>
                          Last updated: {new Date(conversation.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/portal/messages/${conversation.id}`}>
                    View <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {conversations.length === 0 && (
        <Card className="p-12 text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">No conversations yet</p>
          <p className="text-sm text-muted-foreground">
            Contact your compliance team to start a conversation
          </p>
        </Card>
      )}
    </div>
  );
}
