/**
 * Example: Clients List Component Using tRPC
 *
 * This is an example component demonstrating how to use tRPC hooks
 * for data fetching with automatic caching, loading states, and error handling.
 */

'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/react';
import { toast } from 'sonner';

export function ClientsListExample() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Query with automatic caching and refetching
  const { data, isLoading, error, refetch } = trpc.clients.list.useQuery({
    page,
    pageSize: 10,
    search,
  });

  // Mutation with optimistic updates
  const utils = trpc.useContext();
  const deleteClient = trpc.clients.delete.useMutation({
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await utils.clients.list.cancel();

      // Optimistically remove from list
      const previous = utils.clients.list.getData({ page, pageSize: 10, search });

      if (previous) {
        utils.clients.list.setData({ page, pageSize: 10, search }, {
          ...previous,
          clients: previous.clients.filter((c: any) => c.id !== deletedId),
        });
      }

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        utils.clients.list.setData({ page, pageSize: 10, search }, context.previous);
      }
      toast.error(`Failed to delete client: ${err.message}`);
    },
    onSuccess: () => {
      toast.success('Client deleted successfully');
    },
    onSettled: () => {
      // Refetch after mutation
      utils.clients.list.invalidate();
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Error: {error.message}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm text-red-600 hover:text-red-900"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.clients.map((client: any) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {client.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {client.type}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {client.email || '-'}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <button
                    onClick={() => handleDelete(client.id)}
                    disabled={deleteClient.isLoading}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {deleteClient.isLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md bg-white px-4 py-2 text-sm border disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= data.pagination.totalPages}
            className="rounded-md bg-white px-4 py-2 text-sm border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
