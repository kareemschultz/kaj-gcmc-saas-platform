// Database seed script for development and testing

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { seedDocumentTypes } from './seeds/document-types';
import { seedGuyanaRequirementBundles } from './seeds/guyana-bundles';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create Roles
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'SuperAdmin' },
      update: {},
      create: {
        name: 'SuperAdmin',
        description: 'Full system access across all tenants',
      },
    }),
    prisma.role.upsert({
      where: { name: 'FirmAdmin' },
      update: {},
      create: {
        name: 'FirmAdmin',
        description: 'Full access within tenant, can manage users and settings',
      },
    }),
    prisma.role.upsert({
      where: { name: 'ComplianceManager' },
      update: {},
      create: {
        name: 'ComplianceManager',
        description: 'Manage compliance, filings, and client oversight',
      },
    }),
    prisma.role.upsert({
      where: { name: 'ComplianceOfficer' },
      update: {},
      create: {
        name: 'ComplianceOfficer',
        description: 'Handle client filings and document review',
      },
    }),
    prisma.role.upsert({
      where: { name: 'DocumentOfficer' },
      update: {},
      create: {
        name: 'DocumentOfficer',
        description: 'Manage document uploads and organization',
      },
    }),
    prisma.role.upsert({
      where: { name: 'FilingClerk' },
      update: {},
      create: {
        name: 'FilingClerk',
        description: 'Prepare and submit filings',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Viewer' },
      update: {},
      create: {
        name: 'Viewer',
        description: 'Read-only access to client information',
      },
    }),
    prisma.role.upsert({
      where: { name: 'ClientPortalUser' },
      update: {},
      create: {
        name: 'ClientPortalUser',
        description: 'Client portal access for end users',
      },
    }),
  ]);

  console.log(`Created ${roles.length} roles`);

  // Create Tenants (KAJ and GCMC)
  console.log('Creating tenants...');
  const kajTenant = await prisma.tenant.upsert({
    where: { code: 'KAJ' },
    update: {},
    create: {
      name: 'KAJ & Associates',
      code: 'KAJ',
      contactInfo: {
        email: 'info@kaj.gy',
        phone: '+592-XXX-XXXX',
        address: 'Georgetown, Guyana',
      },
      settings: {
        timezone: 'America/Guyana',
        currency: 'GYD',
      },
    },
  });

  const gcmcTenant = await prisma.tenant.upsert({
    where: { code: 'GCMC' },
    update: {},
    create: {
      name: 'GCMC Professional Services',
      code: 'GCMC',
      contactInfo: {
        email: 'info@gcmc.gy',
        phone: '+592-XXX-XXXX',
        address: 'Georgetown, Guyana',
      },
      settings: {
        timezone: 'America/Guyana',
        currency: 'GYD',
      },
    },
  });

  console.log(`Created tenants: ${kajTenant.name}, ${gcmcTenant.name}`);

  // Create Test Users
  console.log('Creating test users...');
  const adminPassword = await hash('admin123', 10);
  const userPassword = await hash('user123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kaj.gy' },
    update: {},
    create: {
      email: 'admin@kaj.gy',
      name: 'KAJ Administrator',
      password: adminPassword,
      phone: '+592-XXX-0001',
    },
  });

  const complianceUser = await prisma.user.upsert({
    where: { email: 'compliance@kaj.gy' },
    update: {},
    create: {
      email: 'compliance@kaj.gy',
      name: 'Compliance Officer',
      password: userPassword,
      phone: '+592-XXX-0002',
    },
  });

  const gcmcAdmin = await prisma.user.upsert({
    where: { email: 'admin@gcmc.gy' },
    update: {},
    create: {
      email: 'admin@gcmc.gy',
      name: 'GCMC Administrator',
      password: adminPassword,
      phone: '+592-XXX-0003',
    },
  });

  console.log(`Created ${[adminUser, complianceUser, gcmcAdmin].length} test users`);

  // Assign users to tenants with roles
  console.log('Assigning users to tenants...');
  const firmAdminRole = roles.find((r) => r.name === 'FirmAdmin')!;
  const complianceOfficerRole = roles.find((r) => r.name === 'ComplianceOfficer')!;

  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: kajTenant.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      tenantId: kajTenant.id,
      userId: adminUser.id,
      roleId: firmAdminRole.id,
    },
  });

  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: kajTenant.id,
        userId: complianceUser.id,
      },
    },
    update: {},
    create: {
      tenantId: kajTenant.id,
      userId: complianceUser.id,
      roleId: complianceOfficerRole.id,
    },
  });

  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: gcmcTenant.id,
        userId: gcmcAdmin.id,
      },
    },
    update: {},
    create: {
      tenantId: gcmcTenant.id,
      userId: gcmcAdmin.id,
      roleId: firmAdminRole.id,
    },
  });

  // Create Enhanced Document Types for KAJ
  await seedDocumentTypes(prisma, kajTenant.id);

  // Create Filing Types for KAJ
  console.log('Creating filing types...');
  const filingTypes = [
    // GRA Filings
    { name: 'Individual Income Tax Return', code: 'GRA-IIT', authority: 'GRA', frequency: 'annual', defaultDueMonth: 4, defaultDueDay: 30 },
    { name: 'Corporation Tax Return', code: 'GRA-CIT', authority: 'GRA', frequency: 'annual', defaultDueMonth: 6, defaultDueDay: 30 },
    { name: 'PAYE Monthly Return', code: 'GRA-PAYE-M', authority: 'GRA', frequency: 'monthly', defaultDueDay: 15 },
    { name: 'PAYE Annual Reconciliation', code: 'GRA-PAYE-A', authority: 'GRA', frequency: 'annual', defaultDueMonth: 1, defaultDueDay: 31 },
    { name: 'VAT Return', code: 'GRA-VAT', authority: 'GRA', frequency: 'monthly', defaultDueDay: 21 },
    { name: 'Property Tax Return', code: 'GRA-PROPERTY', authority: 'GRA', frequency: 'annual', defaultDueMonth: 1, defaultDueDay: 31 },
    { name: 'Withholding Tax Return', code: 'GRA-WHT', authority: 'GRA', frequency: 'monthly', defaultDueDay: 15 },
    { name: 'GRA Tender Compliance Application', code: 'GRA-TENDER', authority: 'GRA', frequency: 'one_off' },
    { name: 'GRA Land Compliance Application', code: 'GRA-LAND', authority: 'GRA', frequency: 'one_off' },
    
    // NIS Filings
    { name: 'Employer Registration', code: 'NIS-EMP-REG', authority: 'NIS', frequency: 'one_off' },
    { name: 'Employee Registration', code: 'NIS-EE-REG', authority: 'NIS', frequency: 'one_off' },
    { name: 'Self-Employed Registration', code: 'NIS-SE-REG', authority: 'NIS', frequency: 'one_off' },
    { name: 'NIS Monthly Contribution', code: 'NIS-CONTRIB-M', authority: 'NIS', frequency: 'monthly', defaultDueDay: 14 },
    { name: 'NIS Compliance Certificate - Employer', code: 'NIS-COMP-EMP', authority: 'NIS', frequency: 'one_off' },
    { name: 'NIS Compliance Certificate - Self-Employed', code: 'NIS-COMP-SE', authority: 'NIS', frequency: 'one_off' },
    
    // DCRA Filings
    { name: 'Business Name Registration', code: 'DCRA-BIZ-REG', authority: 'DCRA', frequency: 'one_off' },
    { name: 'Company Incorporation', code: 'DCRA-INCORP', authority: 'DCRA', frequency: 'one_off' },
    { name: 'Notice of Directors', code: 'DCRA-DIR-NOTICE', authority: 'DCRA', frequency: 'one_off' },
    { name: 'Change of Directors', code: 'DCRA-DIR-CHANGE', authority: 'DCRA', frequency: 'one_off' },
    { name: 'Change of Address', code: 'DCRA-ADDR-CHANGE', authority: 'DCRA', frequency: 'one_off' },
    
    // Immigration Filings
    { name: 'Work Permit Application', code: 'IMM-WP-APP', authority: 'Immigration', frequency: 'one_off' },
    { name: 'Work Permit Renewal', code: 'IMM-WP-RENEW', authority: 'Immigration', frequency: 'annual' },
    { name: 'Residence Permit Application', code: 'IMM-RP-APP', authority: 'Immigration', frequency: 'one_off' },
    { name: 'Business Visa Application', code: 'IMM-BV-APP', authority: 'Immigration', frequency: 'one_off' },
  ];

  for (const filingType of filingTypes) {
    await prisma.filingType.upsert({
      where: {
        tenantId_code: {
          tenantId: kajTenant.id,
          code: filingType.code,
        },
      },
      update: {},
      create: {
        tenantId: kajTenant.id,
        name: filingType.name,
        code: filingType.code,
        authority: filingType.authority,
        frequency: filingType.frequency,
        defaultDueDay: filingType.defaultDueDay,
        defaultDueMonth: filingType.defaultDueMonth,
      },
    });
  }

  console.log(`Created ${filingTypes.length} filing types for KAJ`);

  // Create Sample Clients for KAJ
  console.log('Creating sample clients...');
  const sampleClients = [
    {
      name: 'ABC Manufacturing Ltd.',
      type: 'company',
      email: 'contact@abcmfg.gy',
      phone: '+592-222-1234',
      tin: 'TIN12345678',
      nisNumber: 'NIS98765432',
      sector: 'Manufacturing',
      riskLevel: 'medium',
    },
    {
      name: 'John Doe',
      type: 'individual',
      email: 'john.doe@email.com',
      phone: '+592-333-4567',
      tin: 'TIN87654321',
      nisNumber: 'NIS12348765',
      sector: 'Professional Services',
      riskLevel: 'low',
    },
    {
      name: 'XYZ Consulting Partnership',
      type: 'partnership',
      email: 'info@xyzconsulting.gy',
      phone: '+592-444-7890',
      tin: 'TIN11223344',
      nisNumber: 'NIS44332211',
      sector: 'Consulting',
      riskLevel: 'low',
    },
  ];

  for (const client of sampleClients) {
    await prisma.client.create({
      data: {
        tenantId: kajTenant.id,
        ...client,
      },
    });
  }

  console.log(`Created ${sampleClients.length} sample clients for KAJ`);

  // Create Services for KAJ
  console.log('Creating services...');
  const services = [
    {
      name: 'Taxpayer Registration (TIN)',
      category: 'Tax Services',
      description: 'Assistance with GRA taxpayer registration and TIN acquisition',
      basePrice: 15000,
      estimatedDays: 7,
    },
    {
      name: 'Monthly Payroll & PAYE Compliance',
      category: 'Tax Services',
      description: 'Monthly payroll processing and PAYE filing services',
      basePrice: 25000,
      estimatedDays: 5,
    },
    {
      name: 'Annual Tax Return Preparation',
      category: 'Tax Services',
      description: 'Individual and corporate tax return preparation and filing',
      basePrice: 50000,
      estimatedDays: 14,
    },
    {
      name: 'GRA Compliance Certificate Services',
      category: 'Tax Services',
      description: 'Application for GRA tender and land compliance certificates',
      basePrice: 20000,
      estimatedDays: 10,
    },
    {
      name: 'NIS Employer Setup & Registration',
      category: 'Insurance',
      description: 'Employer and employee NIS registration services',
      basePrice: 12000,
      estimatedDays: 5,
    },
    {
      name: 'Business Name Registration',
      category: 'Business Registration',
      description: 'DCRA business name registration services',
      basePrice: 18000,
      estimatedDays: 10,
    },
    {
      name: 'Company Incorporation',
      category: 'Business Registration',
      description: 'Full company incorporation services with DCRA',
      basePrice: 75000,
      estimatedDays: 21,
    },
    {
      name: 'Work Permit Application & Renewal',
      category: 'Immigration Services',
      description: 'Work permit application and renewal services',
      basePrice: 45000,
      estimatedDays: 30,
    },
  ];

  for (const service of services) {
    await prisma.service.create({
      data: {
        tenantId: kajTenant.id,
        ...service,
      },
    });
  }

  console.log(`Created ${services.length} services for KAJ`);

  // Create Guyana Requirement Bundles for KAJ
  await seedGuyanaRequirementBundles(prisma, kajTenant.id);

  // Create subscription plan
  console.log('Creating subscription plan...');
  const plan = await prisma.plan.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Professional',
      description: 'Full platform access for professional services firms',
      monthlyPrice: 49900,
      yearlyPrice: 499000,
      limits: {
        maxClients: 1000,
        maxUsers: 25,
        maxStorageGB: 100,
      },
    },
  });

  await prisma.subscription.upsert({
    where: { id: 1 },
    update: {},
    create: {
      tenantId: kajTenant.id,
      planId: plan.id,
      status: 'active',
      startDate: new Date(),
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  });

  console.log('Database seed completed successfully!');
  console.log('\nTest Credentials:');
  console.log('─────────────────────────────────');
  console.log('KAJ Administrator:');
  console.log('  Email: admin@kaj.gy');
  console.log('  Password: admin123');
  console.log('\nKAJ Compliance Officer:');
  console.log('  Email: compliance@kaj.gy');
  console.log('  Password: user123');
  console.log('\nGCMC Administrator:');
  console.log('  Email: admin@gcmc.gy');
  console.log('  Password: admin123');
  console.log('─────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
