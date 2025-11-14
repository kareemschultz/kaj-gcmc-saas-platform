import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getConversations, getUnreadMessageCount } from '@/lib/actions/conversations';
import { ConversationList } from '@/components/messages/conversation-list';
import { MessageSquare, Search, Filter } from 'lucide-react';

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    search?: string;
    clientId?: string;
    unreadOnly?: string;
  };
}) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const page = parseInt(searchParams.page || '1');
  const unreadOnly = searchParams.unreadOnly === 'true';
  const clientId = searchParams.clientId ? parseInt(searchParams.clientId) : undefined;

  const [conversationsData, unreadCount] = await Promise.all([
    getConversations({
      page,
      pageSize: 20,
      search: searchParams.search,
      clientId,
      unreadOnly,
    }),
    getUnreadMessageCount(),
  ]);

  const { conversations, total, totalPages } = conversationsData;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="mt-1 text-sm text-gray-600">
              {unreadCount > 0 && (
                <span className="font-medium text-teal-600">
                  {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
              {unreadCount === 0 && 'All caught up!'}
            </p>
          </div>
          <Link
            href="/messages/new"
            className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            <MessageSquare className="h-4 w-4" />
            New Conversation
          </Link>
        </div>
      </div>

      <div className="border-b bg-white px-6 py-4">
        <form className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline h-4 w-4 mr-1" />
              Search
            </label>
            <input
              type="text"
              id="search"
              name="search"
              defaultValue={searchParams.search}
              placeholder="Search conversations..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="unreadOnly"
                value="true"
                defaultChecked={unreadOnly}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="font-medium text-gray-700">Unread only</span>
            </label>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              <Filter className="h-4 w-4" />
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-hidden bg-white">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No conversations</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchParams.search || unreadOnly
                  ? 'No conversations match your filters.'
                  : 'Get started by creating your first conversation.'}
              </p>
              {!searchParams.search && !unreadOnly && (
                <Link
                  href="/messages/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                  <MessageSquare className="h-4 w-4" />
                  New Conversation
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <ConversationList
              conversations={conversations}
              currentUserId={session.user?.id}
            />

            {totalPages > 1 && (
              <div className="border-t bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{page}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link
                        href={`/messages?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}${unreadOnly ? '&unreadOnly=true' : ''}`}
                        className="rounded-md border bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Previous
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link
                        href={`/messages?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}${unreadOnly ? '&unreadOnly=true' : ''}`}
                        className="rounded-md border bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
