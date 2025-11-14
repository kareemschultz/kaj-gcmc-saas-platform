import { Metadata } from 'next';
import { getClients } from '@/src/lib/actions/clients';
import { getServicesForWizard } from '@/src/lib/actions/wizards';
import { ServiceRequestWizard } from '@/components/wizards/service-request-wizard';

export const metadata: Metadata = {
  title: 'New Service Request Wizard | KGC Compliance Cloud',
};

export default async function ServiceRequestWizardPage() {
  const [clients, services] = await Promise.all([getClients(), getServicesForWizard()]);

  return <ServiceRequestWizard clients={clients} services={services} />;
}
