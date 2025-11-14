'use client';

import { useState } from 'react';
import { toggleRecurringFilingActive } from '@/src/lib/actions/recurring-filings';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

interface ToggleActiveButtonProps {
  id: number;
  active: boolean;
}

export function ToggleActiveButton({ id, active }: ToggleActiveButtonProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await toggleRecurringFilingActive(id);
      toast({
        title: active ? 'Recurring filing deactivated' : 'Recurring filing activated',
        description: `Recurring filing has been ${active ? 'deactivated' : 'activated'} successfully.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to toggle recurring filing.',
        variant: 'destructive',
      });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className="text-teal-600 hover:text-teal-900 font-medium disabled:opacity-50"
    >
      {isToggling ? 'Toggling...' : active ? 'Deactivate' : 'Activate'}
    </button>
  );
}
