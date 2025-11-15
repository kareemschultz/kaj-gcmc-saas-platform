/**
 * Wizards Router
 *
 * Handles multi-step wizard workflows
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { TRPCError } from '@trpc/server';

// Validation schemas
const newClientWizardSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(1),
  type: z.enum(['individual', 'company', 'partnership']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  tin: z.string().optional(),
  nisNumber: z.string().optional(),
  sector: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: z.string().optional(),

  // Step 2: Business Entities
  businesses: z
    .array(
      z.object({
        name: z.string(),
        registrationNumber: z.string().optional(),
        registrationType: z.string().optional(),
        incorporationDate: z.string().optional(),
        country: z.string().optional(),
        sector: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .optional(),

  // Step 3: Authorities & Bundles
  selectedBundleIds: z.array(z.number()).optional(),

  // Step 4: Initial Service Requests
  initialServiceRequests: z
    .array(
      z.object({
        serviceId: z.number(),
        priority: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
});

const complianceSetupWizardSchema = z.object({
  clientId: z.number(),
  selectedAuthorities: z.array(z.string()),
  selectedBundleIds: z.array(z.number()),
  disabledBundleItems: z.record(z.array(z.number())).optional(),
  createTasksForGaps: z.boolean().default(false),
});

const serviceRequestWizardSchema = z.object({
  clientId: z.number(),
  clientBusinessId: z.number().optional(),
  serviceId: z.number(),
  priority: z.string().default('medium'),
  notes: z.string().optional(),
  templateId: z.number().optional(),
  customSteps: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        order: z.number(),
        dueDate: z.string().optional(),
      })
    )
    .optional(),
  assignedUserId: z.number().optional(),
  createTasks: z.boolean().default(false),
});

export const wizardsRouter = router({
  // Complete new client wizard
  completeNewClient: protectedProcedure
    .use(requirePermission('clients', 'create'))
    .input(newClientWizardSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.user.tenantId;

      // Create client
      const client = await ctx.prisma.client.create({
        data: {
          tenantId,
          name: input.name,
          type: input.type,
          email: input.email,
          phone: input.phone,
          address: input.address,
          tin: input.tin,
          nisNumber: input.nisNumber,
          sector: input.sector,
          riskLevel: input.riskLevel,
          notes: input.notes,
        },
      });

      // Create businesses if applicable
      if (input.businesses && input.businesses.length > 0) {
        await ctx.prisma.clientBusiness.createMany({
          data: input.businesses.map((business) => ({
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
      if (input.initialServiceRequests && input.initialServiceRequests.length > 0) {
        await ctx.prisma.serviceRequest.createMany({
          data: input.initialServiceRequests.map((sr) => ({
            tenantId,
            clientId: client.id,
            serviceId: sr.serviceId,
            status: 'new',
            priority: sr.priority || 'medium',
            metadata: sr.notes ? { notes: sr.notes } : undefined,
          })),
        });
      }

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId,
          actorUserId: ctx.user.id,
          clientId: client.id,
          entityType: 'Client',
          entityId: client.id,
          action: 'CREATE',
          changes: {
            wizard: 'new_client_onboarding',
            bundlesSelected: input.selectedBundleIds?.length || 0,
            businessesCreated: input.businesses?.length || 0,
            serviceRequestsCreated: input.initialServiceRequests?.length || 0,
          },
        },
      });

      ctx.logger.info('New client wizard completed:', { clientId: client.id });

      return { success: true, clientId: client.id };
    }),

  // Complete compliance setup wizard
  completeComplianceSetup: protectedProcedure
    .use(requirePermission('clients', 'edit'))
    .input(complianceSetupWizardSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.user.tenantId;

      // Verify client exists and belongs to tenant
      const client = await ctx.prisma.client.findFirst({
        where: { id: input.clientId, tenantId },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }

      // If createTasksForGaps is true, analyze bundles and create tasks
      if (input.createTasksForGaps && input.selectedBundleIds.length > 0) {
        const bundles = await ctx.prisma.requirementBundle.findMany({
          where: {
            id: { in: input.selectedBundleIds },
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
          ctx.prisma.document.findMany({
            where: { clientId: input.clientId, tenantId },
            select: { documentTypeId: true },
          }),
          ctx.prisma.filing.findMany({
            where: { clientId: input.clientId, tenantId },
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
            const disabledItems = input.disabledBundleItems?.[bundle.id] || [];
            if (disabledItems.includes(item.id)) continue;

            // Check if document type is missing
            if (item.documentTypeId && !existingDocTypeIds.has(item.documentTypeId)) {
              tasksToCreate.push({
                tenantId,
                clientId: input.clientId,
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
                clientId: input.clientId,
                title: `Prepare ${item.filingType?.name}`,
                description: `Required for ${bundle.name} (${bundle.authority})`,
                status: 'open',
                priority: item.required ? 'high' : 'medium',
              });
            }
          }
        }

        if (tasksToCreate.length > 0) {
          await ctx.prisma.task.createMany({ data: tasksToCreate });
        }
      }

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId,
          actorUserId: ctx.user.id,
          clientId: input.clientId,
          entityType: 'Client',
          entityId: input.clientId,
          action: 'UPDATE',
          changes: {
            wizard: 'compliance_setup',
            authorities: input.selectedAuthorities,
            bundlesConfigured: input.selectedBundleIds,
          },
        },
      });

      ctx.logger.info('Compliance setup wizard completed:', { clientId: input.clientId });

      return { success: true, clientId: input.clientId };
    }),

  // Complete service request wizard
  completeServiceRequest: protectedProcedure
    .use(requirePermission('service_requests', 'create'))
    .input(serviceRequestWizardSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.user.tenantId;

      // Verify client exists
      const client = await ctx.prisma.client.findFirst({
        where: { id: input.clientId, tenantId },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }

      // Create service request
      const serviceRequest = await ctx.prisma.serviceRequest.create({
        data: {
          tenantId,
          clientId: input.clientId,
          clientBusinessId: input.clientBusinessId,
          serviceId: input.serviceId,
          templateId: input.templateId,
          status: 'new',
          priority: input.priority,
          metadata: input.notes ? { notes: input.notes } : undefined,
        },
      });

      // Create steps from template or custom steps
      if (input.templateId) {
        const template = await ctx.prisma.serviceRequestTemplate.findFirst({
          where: { id: input.templateId, tenantId },
        });

        if (template && template.stepsDefinition) {
          const steps = template.stepsDefinition as any;
          if (Array.isArray(steps)) {
            await ctx.prisma.serviceStep.createMany({
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
      } else if (input.customSteps && input.customSteps.length > 0) {
        await ctx.prisma.serviceStep.createMany({
          data: input.customSteps.map((step) => ({
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
      if (input.createTasks) {
        await ctx.prisma.task.create({
          data: {
            tenantId,
            clientId: input.clientId,
            serviceRequestId: serviceRequest.id,
            title: `Process service request`,
            description: `Handle service request for client ${client.name}`,
            status: 'open',
            priority: input.priority,
            assignedToId: input.assignedUserId,
          },
        });
      }

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId,
          actorUserId: ctx.user.id,
          clientId: input.clientId,
          entityType: 'ServiceRequest',
          entityId: serviceRequest.id,
          action: 'CREATE',
          changes: {
            wizard: 'service_request',
            serviceId: input.serviceId,
            templateId: input.templateId,
          },
        },
      });

      ctx.logger.info('Service request wizard completed:', {
        serviceRequestId: serviceRequest.id,
      });

      return { success: true, serviceRequestId: serviceRequest.id };
    }),

  // Get bundles for authorities
  getBundlesForAuthorities: protectedProcedure
    .use(requirePermission('requirement_bundles', 'view'))
    .input(z.object({ authorities: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const bundles = await ctx.prisma.requirementBundle.findMany({
        where: {
          tenantId: ctx.user.tenantId,
          authority: { in: input.authorities },
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
    }),

  // Get services for wizard
  getServicesForWizard: protectedProcedure
    .use(requirePermission('services', 'view'))
    .query(async ({ ctx }) => {
      const services = await ctx.prisma.service.findMany({
        where: {
          tenantId: ctx.user.tenantId,
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
    }),
});
