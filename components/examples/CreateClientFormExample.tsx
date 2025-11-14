/**
 * Example: Create Client Form Using tRPC
 *
 * This is an example component demonstrating how to use tRPC mutations
 * with form handling and validation.
 */

'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/react';
import { toast } from 'sonner';

export function CreateClientFormExample() {
  const [formData, setFormData] = useState({
    name: '',
    type: 'company' as 'individual' | 'company' | 'partnership',
    email: '',
    phone: '',
    address: '',
    tin: '',
    nisNumber: '',
    sector: '',
    riskLevel: 'low' as 'low' | 'medium' | 'high',
  });

  const utils = trpc.useContext();

  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success('Client created successfully');
      // Invalidate and refetch clients list
      utils.clients.list.invalidate();
      // Reset form
      setFormData({
        name: '',
        type: 'company',
        email: '',
        phone: '',
        address: '',
        tin: '',
        nisNumber: '',
        sector: '',
        riskLevel: 'low',
      });
    },
    onError: (error) => {
      toast.error(`Failed to create client: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClient.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="individual">Individual</option>
            <option value="company">Company</option>
            <option value="partnership">Partnership</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            TIN
          </label>
          <input
            type="text"
            value={formData.tin}
            onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            NIS Number
          </label>
          <input
            type="text"
            value={formData.nisNumber}
            onChange={(e) => setFormData({ ...formData, nisNumber: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sector
          </label>
          <input
            type="text"
            value={formData.sector}
            onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Risk Level
          </label>
          <select
            value={formData.riskLevel}
            onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={createClient.isLoading}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {createClient.isLoading ? 'Creating...' : 'Create Client'}
        </button>
        <button
          type="button"
          onClick={() => setFormData({
            name: '',
            type: 'company',
            email: '',
            phone: '',
            address: '',
            tin: '',
            nisNumber: '',
            sector: '',
            riskLevel: 'low',
          })}
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
