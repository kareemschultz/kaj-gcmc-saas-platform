'use server';

// Server actions for wizard workflows

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { recalculateClientCompliance } from '@/lib/compliance-engine';
import { revalidatePath } from 'next/cache';

// ========================================
// NEW CLIENT ONBOARDING WIZARD
// ========================================

export interface NewClientWizardData {
  // Step 1: Basic Info
  name: string;
  type: 'individual' | 'company' | 'partnership';
  email?: string;
  phone?: string;
  address?: string;
  tin?: string;
  nisNumber?: string;
  sector?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  notes?: string;

  // Step 2: Business Entities (if type === 'company')
  businesses?: Array<{
    name: string;
    registrationNumber?: string;
    registrationType?: string;
    incorporationDate?: string;
    country?: string;
    sector?: string;
    status?: string;
  }>;

  // Step 3: Authorities & Bundles
  selectedBundleIds?: number[];

  // Step 4: Initial Service Requests
  initialServiceRequests?: Array<{
    serviceId: number;
    priority?: string;
    notes?: string;
  }>;
}

export async function completeNewClientWizard(data: NewClientWizardData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const tenantId = session.user.tenantId;

  try {
    // Create client
    const client = await prisma.client.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type,
        email: data.email,
        phone: data.phone,
        address: data.address,
        tin: data.tin,
        nisNumber: data.nisNumber,
        sector: data.sector,
        riskLevel: data.riskLevel || 'medium',
        notes: data.notes,
      },
    });

    // Create businesses if applicable
    if (data.businesses && data.businesses.length > 0) {
      await prisma.clientBusiness.createMany({
        data: data.businesses.map((business) => ({
          tenantId,
          clientId: client.id,
          name: business.name,
          registrationNumber: business.registrationNumber,
          registrationType: business.registrationType,
          incorporationDate: business.incorporationDate
            ? new Date(business.incorporationDate)
            : null,
          country: business.country || 'Guyana',
          sector: business.sector,
          status: business.status || 'active',
        })),
      });
    }

    // Create initial service requests if provided
    if (data.initialServiceRequests && data.initialServiceRequests.length > 0) {
      await prisma.serviceRequest.createMany({
        data: data.initialServiceRequests.map((sr) => ({
          tenantId,
          clientId: client.id,
          serviceId: sr.serviceId,
          status: 'new',
          priority: sr.priority || 'medium',
          metadata: sr.notes ? { notes: sr.notes } : undefined,
        })),
      });
    }

    // Recalculate compliance score
    await recalculateClientCompliance(client.id, tenantId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: session.user.id,
        clientId: client.id,
        entityType: 'Client',
        entityId: client.id,
        action: 'create_via_wizard',
        changes: {
          wizard: 'new_client_onboarding',
          bundlesSelected: data.selectedBundleIds?.length || 0,
          businessesCreated: data.businesses?.length || 0,
          serviceRequestsCreated: data.initialServiceRequests?.length || 0,
        },
      },
    });

    revalidatePath('/clients');
    revalidatePath('/dashboard');

    return { success: true, clientId: client.id };
  } catch (error) {
    console.error('Error completing new client wizard:', error);
    throw new ApiError('Failed to create client', 500);
  }
}

// ========================================
// COMPLIANCE SETUP WIZARD
// ========================================

export interface ComplianceSetupWizardData {
  clientId: number;
  selectedAuthorities: string[]; // GRA, NIS, DCRA, Immigration, Deeds, GO-Invest
  selectedBundleIds: number[];
  // Map of bundleId -> array of item IDs to toggle off
  disabledBundleItems?: Record<number, number[]>;
  // Auto-create tasks for missing items
  createTasksForGaps?: boolean;
}

export async function completeComplianceSetupWizard(data: ComplianceSetupWizardData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const tenantId = session.user.tenantId;

  // Verify client exists and belongs to tenant
  const client = await prisma.client.findFirst({
    where: { id: data.clientId, tenantId },
  });

  if (!client) {
    throw new ApiError('Client not found', 404);
  }

  try {
    // If createTasksForGaps is true, analyze bundles and create tasks
    if (data.createTasksForGaps && data.selectedBundleIds.length > 0) {
      const bundles = await prisma.requirementBundle.findMany({
        where: {
          id: { in: data.selectedBundleIds },
          tenantId,
        },
        include: {
          items: {
            include: {
              documentType: true,
              filingType: true,
            },
          },
        },
      });

      // Get existing documents and filings for this client
      const [existingDocs, existingFilings] = await Promise.all([
        prisma.document.findMany({
          where: { clientId: data.clientId, tenantId },
          select: { documentTypeId: true },
        }),
        prisma.filing.findMany({
          where: { clientId: data.clientId, tenantId },
          select: { filingTypeId: true },
        }),
      ]);

      const existingDocTypeIds = new Set(existingDocs.map((d) => d.documentTypeId));
      const existingFilingTypeIds = new Set(existingFilings.map((f) => f.filingTypeId));

      // Create tasks for missing requirements
      const tasksToCreate = [];

      for (const bundle of bundles) {
        for (const item of bundle.items) {
          // Skip if disabled
          const disabledItems = data.disabledBundleItems?.[bundle.id] || [];
          if (disabledItems.includes(item.id)) continue;

          // Check if document type is missing
          if (item.documentTypeId && !existingDocTypeIds.has(item.documentTypeId)) {
            tasksToCreate.push({
              tenantId,
              clientId: data.clientId,
              title: `Collect ${item.documentType?.name}`,
              description: `Required for ${bundle.name} (${bundle.authority})`,
              status: 'open',
              priority: item.required ? 'high' : 'medium',
            });
          }

          // Check if filing type is missing
          if (item.filingTypeId && !existingFilingTypeIds.has(item.filingTypeId)) {
            tasksToCreate.push({
              tenantId,
              clientId: data.clientId,
              title: `Prepare ${item.filingType?.name}`,
              description: `Required for ${bundle.name} (${bundle.authority})`,
              status: 'open',
              priority: item.required ? 'high' : 'medium',
            });
          }
        }
      }

      if (tasksToCreate.length > 0) {
        await prisma.task.createMany({ data: tasksToCreate });
      }
    }

    // Recalculate compliance
    await recalculateClientCompliance(data.clientId, tenantId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: session.user.id,
        clientId: data.clientId,
        entityType: 'Client',
        entityId: data.clientId,
        action: 'compliance_setup_via_wizard',
        changes: {
          wizard: 'compliance_setup',
          authorities: data.selectedAuthorities,
          bundlesConfigured: data.selectedBundleIds,
        },
      },
    });

    revalidatePath(`/clients/${data.clientId}`);
    revalidatePath('/compliance/overview');

    return { success: true, clientId: data.clientId };
  } catch (error) {
    console.error('Error completing compliance setup wizard:', error);
    throw new ApiError('Failed to setup compliance', 500);
  }
}

// ========================================
// SERVICE REQUEST WIZARD
// ========================================

export interface ServiceRequestWizardData {
  clientId: number;
  clientBusinessId?: number;
  serviceId: number;
  priority?: string;
  notes?: string;
  // Auto-load workflow steps from template
  templateId?: number;
  // Manual steps if no template
  customSteps?: Array<{
    title: string;
    description?: string;
    order: number;
    dueDate?: string;
  }>;
  // Assign responsible staff
  assignedUserId?: number;
  // Create related tasks
  createTasks?: boolean;
}

export async function completeServiceRequestWizard(data: ServiceRequestWizardData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const tenantId = session.user.tenantId;

  // Verify client exists
  const client = await prisma.client.findFirst({
    where: { id: data.clientId, tenantId },
  });

  if (!client) {
    throw new ApiError('Client not found', 404);
  }

  try {
    // Create service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        tenantId,
        clientId: data.clientId,
        clientBusinessId: data.clientBusinessId,
        serviceId: data.serviceId,
        templateId: data.templateId,
        status: 'new',
        priority: data.priority || 'medium',
        metadata: data.notes ? { notes: data.notes } : undefined,
      },
    });

    // Create steps from template or custom steps
    if (data.templateId) {
      const template = await prisma.serviceRequestTemplate.findFirst({
        where: { id: data.templateId, tenantId },
      });

      if (template && template.stepsDefinition) {
        const steps = template.stepsDefinition as any;
        if (Array.isArray(steps)) {
          await prisma.serviceStep.createMany({
            data: steps.map((step: any, index: number) => ({
              serviceRequestId: serviceRequest.id,
              title: step.title,
              description: step.description,
              order: index + 1,
              status: 'not_started',
            })),
          });
        }
      }
    } else if (data.customSteps && data.customSteps.length > 0) {
      await prisma.serviceStep.createMany({
        data: data.customSteps.map((step) => ({
          serviceRequestId: serviceRequest.id,
          title: step.title,
          description: step.description,
          order: step.order,
          status: 'not_started',
          dueDate: step.dueDate ? new Date(step.dueDate) : null,
        })),
      });
    }

    // Create initial task if requested
    if (data.createTasks) {
      await prisma.task.create({
        data: {
          tenantId,
          clientId: data.clientId,
          serviceRequestId: serviceRequest.id,
          title: `Process service request`,
          description: `Handle service request for client ${client.name}`,
          status: 'open',
          priority: data.priority || 'medium',
          assignedToId: data.assignedUserId,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: session.user.id,
        clientId: data.clientId,
        entityType: 'ServiceRequest',
        entityId: serviceRequest.id,
        action: 'create_via_wizard',
        changes: {
          wizard: 'service_request',
          serviceId: data.serviceId,
          templateId: data.templateId,
        },
      },
    });

    revalidatePath(`/clients/${data.clientId}`);
    revalidatePath('/services/requests');

    return { success: true, serviceRequestId: serviceRequest.id };
  } catch (error) {
    console.error('Error completing service request wizard:', error);
    throw new ApiError('Failed to create service request', 500);
  }
}

// Helper: Get available bundles for authorities
export async function getBundlesForAuthorities(authorities: string[]) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const bundles = await prisma.requirementBundle.findMany({
    where: {
      tenantId: session.user.tenantId,
      authority: { in: authorities },
    },
    include: {
      items: {
        include: {
          documentType: {
            select: { name: true, category: true },
          },
          filingType: {
            select: { name: true, frequency: true },
          },
        },
      },
    },
    orderBy: [{ authority: 'asc' }, { name: 'asc' }],
  });

  return bundles;
}

// Helper: Get services for wizard
export async function getServicesForWizard() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const services = await prisma.service.findMany({
    where: {
      tenantId: session.user.tenantId,
      active: true,
    },
    include: {
      templates: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return services;
}
