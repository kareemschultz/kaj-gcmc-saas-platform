import { Metadata } from 'next';
import { NewClientWizard } from '@/components/wizards/new-client-wizard';
import { getBundlesForAuthorities, getServicesForWizard } from '@/lib/actions/wizards';

export const metadata: Metadata = {
  title: 'New Client Onboarding Wizard | KGC Compliance Cloud',
};

export default async function NewClientWizardPage() {
  // Pre-fetch data for the wizard
  const [bundles, services] = await Promise.all([
    getBundlesForAuthorities(['GRA', 'NIS', 'DCRA', 'Immigration', 'Deeds', 'GO-Invest']),
    getServicesForWizard(),
  ]);

  return <NewClientWizard bundles={bundles} services={services} />;
}
