import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getClient } from '@/lib/actions/clients';
import { getBundlesForAuthorities } from '@/lib/actions/wizards';
import { ComplianceSetupWizard } from '@/components/wizards/compliance-setup-wizard';

export const metadata: Metadata = {
  title: 'Compliance Setup Wizard | KGC Compliance Cloud',
};

interface PageProps {
  params: Promise<{
    clientId: string;
  }>;
}

export default async function ComplianceSetupWizardPage({ params }: PageProps) {
  const { clientId: clientIdParam } = await params;
  const clientId = parseInt(clientIdParam);

  const [client, bundles] = await Promise.all([
    getClient(clientId),
    getBundlesForAuthorities(['GRA', 'NIS', 'DCRA', 'Immigration', 'Deeds', 'GO-Invest']),
  ]);

  if (!client) {
    notFound();
  }

  return <ComplianceSetupWizard client={client} bundles={bundles} />;
}
