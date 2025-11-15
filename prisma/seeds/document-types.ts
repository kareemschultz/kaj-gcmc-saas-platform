// Enhanced Guyana-specific document types seed data
// Includes GRA forms, NIS documents, DCRA registration, Immigration, and Deeds

import { PrismaClient } from '@prisma/client';

export async function seedDocumentTypes(prisma: PrismaClient, tenantId: number) {
  console.log('Seeding enhanced Guyana document types...');

  const documentTypes = [
    // ========================================
    // IDENTIFICATION DOCUMENTS
    // ========================================
    {
      name: 'National ID Card',
      category: 'Identification',
      authority: 'General Register Office',
      description: 'Guyana National Identification Card',
      tags: ['identity', 'government-issued'],
      metadata: { validityPeriod: 'lifetime', renewalRequired: false },
    },
    {
      name: 'Passport',
      category: 'Identification',
      authority: 'Immigration',
      description: 'Valid Guyana or foreign passport',
      tags: ['identity', 'travel', 'government-issued'],
      metadata: { validityPeriod: '10 years', renewalRequired: true },
    },
    {
      name: 'Birth Certificate',
      category: 'Identification',
      authority: 'General Register Office',
      description: 'Official birth certificate',
      tags: ['identity', 'vital-record'],
      metadata: { validityPeriod: 'lifetime', renewalRequired: false },
    },
    {
      name: 'Driver\'s License',
      category: 'Identification',
      authority: 'Police Force',
      description: 'Valid Guyana driver\'s license',
      tags: ['identity', 'government-issued'],
      metadata: { validityPeriod: '3 years', renewalRequired: true },
    },

    // ========================================
    // GRA TAX DOCUMENTS & FORMS
    // ========================================
    {
      name: 'TIN Certificate',
      category: 'Tax',
      authority: 'GRA',
      description: 'Taxpayer Identification Number Certificate',
      tags: ['tax', 'registration', 'gra'],
      metadata: { formCode: 'TIN-CERT', validityPeriod: 'lifetime' },
    },
    {
      name: 'Form G0004 - Individual Income Tax Return',
      category: 'Tax',
      authority: 'GRA',
      description: 'Annual income tax return for individuals',
      tags: ['tax', 'filing', 'gra', 'annual'],
      metadata: { formCode: 'G0004', frequency: 'annual', dueDate: 'April 30' },
    },
    {
      name: 'Form G0003 - PAYE Withholding Return',
      category: 'Tax',
      authority: 'GRA',
      description: 'Monthly PAYE withholding tax return for employers',
      tags: ['tax', 'filing', 'gra', 'monthly', 'paye'],
      metadata: { formCode: 'G0003', frequency: 'monthly', dueDate: '15th of following month' },
    },
    {
      name: 'Form G0017 - VAT Return',
      category: 'Tax',
      authority: 'GRA',
      description: 'Monthly Value Added Tax return',
      tags: ['tax', 'filing', 'gra', 'monthly', 'vat'],
      metadata: { formCode: 'G0017', frequency: 'monthly', dueDate: '21st of following month' },
    },
    {
      name: 'Form G0018 - Withholding Tax Return',
      category: 'Tax',
      authority: 'GRA',
      description: 'Monthly withholding tax on payments to contractors/professionals',
      tags: ['tax', 'filing', 'gra', 'monthly', 'withholding'],
      metadata: { formCode: 'G0018', frequency: 'monthly', dueDate: '15th of following month' },
    },
    {
      name: 'Form G0022 - Corporation Tax Return',
      category: 'Tax',
      authority: 'GRA',
      description: 'Annual corporation tax return',
      tags: ['tax', 'filing', 'gra', 'annual', 'corporate'],
      metadata: { formCode: 'G0022', frequency: 'annual', dueDate: 'June 30' },
    },
    {
      name: 'Form F7B - Employer\'s Annual Reconciliation',
      category: 'Tax',
      authority: 'GRA',
      description: 'Annual reconciliation of PAYE deductions',
      tags: ['tax', 'filing', 'gra', 'annual', 'paye'],
      metadata: { formCode: 'F7B', frequency: 'annual', dueDate: 'January 31' },
    },
    {
      name: 'Form F200 - Property Tax Return',
      category: 'Tax',
      authority: 'GRA',
      description: 'Annual property tax return',
      tags: ['tax', 'filing', 'gra', 'annual', 'property'],
      metadata: { formCode: 'F200', frequency: 'annual', dueDate: 'January 31' },
    },
    {
      name: 'GRA Tender Compliance Certificate',
      category: 'Tax',
      authority: 'GRA',
      description: 'Tax compliance certificate required for government tenders',
      tags: ['tax', 'compliance', 'gra', 'tender'],
      metadata: { validityPeriod: '3 months', renewalRequired: true },
    },
    {
      name: 'GRA Land Compliance Certificate',
      category: 'Tax',
      authority: 'GRA',
      description: 'Tax compliance certificate required for land transactions',
      tags: ['tax', 'compliance', 'gra', 'land'],
      metadata: { validityPeriod: '3 months', renewalRequired: true },
    },
    {
      name: 'GRA VAT Registration Certificate',
      category: 'Tax',
      authority: 'GRA',
      description: 'VAT registration certificate for businesses',
      tags: ['tax', 'registration', 'gra', 'vat'],
      metadata: { validityPeriod: 'lifetime', renewalRequired: false },
    },
    {
      name: 'Tax Clearance Certificate',
      category: 'Tax',
      authority: 'GRA',
      description: 'Certificate confirming all taxes are paid',
      tags: ['tax', 'compliance', 'gra'],
      metadata: { validityPeriod: '3 months', renewalRequired: true },
    },

    // ========================================
    // NIS (National Insurance Scheme) DOCUMENTS
    // ========================================
    {
      name: 'NIS Registration Card',
      category: 'Insurance',
      authority: 'NIS',
      description: 'National Insurance Scheme registration card',
      tags: ['insurance', 'nis', 'registration'],
      metadata: { validityPeriod: 'lifetime', renewalRequired: false },
    },
    {
      name: 'NIS Employer Registration Certificate',
      category: 'Insurance',
      authority: 'NIS',
      description: 'Employer registration with NIS',
      tags: ['insurance', 'nis', 'employer', 'registration'],
      metadata: { validityPeriod: 'lifetime', renewalRequired: false },
    },
    {
      name: 'NIS Compliance Certificate - Employer',
      category: 'Insurance',
      authority: 'NIS',
      description: 'Certificate confirming employer NIS contributions are current',
      tags: ['insurance', 'nis', 'employer', 'compliance'],
      metadata: { validityPeriod: '3 months', renewalRequired: true },
    },
    {
      name: 'NIS Compliance Certificate - Self-Employed',
      category: 'Insurance',
      authority: 'NIS',
      description: 'Certificate confirming self-employed contributions are current',
      tags: ['insurance', 'nis', 'self-employed', 'compliance'],
      metadata: { validityPeriod: '3 months', renewalRequired: true },
    },
    {
      name: 'NIS Monthly Contribution Statement',
      category: 'Insurance',
      authority: 'NIS',
      description: 'Monthly NIS contribution statement and payment',
      tags: ['insurance', 'nis', 'monthly', 'contribution'],
      metadata: { frequency: 'monthly', dueDate: '14th of following month' },
    },
    {
      name: 'NIS Employee Registration Form',
      category: 'Insurance',
      authority: 'NIS',
      description: 'Form to register new employees with NIS',
      tags: ['insurance', 'nis', 'employee', 'registration'],
      metadata: { renewalRequired: false },
    },

    // ========================================
    // DCRA (Deeds & Commercial Registry Authority) DOCUMENTS
    // ========================================
    {
      name: 'Business Name Registration Certificate',
      category: 'Business Registration',
      authority: 'DCRA',
      description: 'Certificate of business name registration',
      tags: ['business', 'dcra', 'registration'],
      metadata: { validityPeriod: '1 year', renewalRequired: true },
    },
    {
      name: 'Certificate of Incorporation',
      category: 'Business Registration',
      authority: 'DCRA',
      description: 'Company incorporation certificate',
      tags: ['business', 'dcra', 'incorporation', 'company'],
      metadata: { validityPeriod: 'lifetime', renewalRequired: false },
    },
    {
      name: 'Articles of Incorporation',
      category: 'Business Registration',
      authority: 'DCRA',
      description: 'Company articles of incorporation',
      tags: ['business', 'dcra', 'incorporation', 'company'],
      metadata: { renewalRequired: false },
    },
    {
      name: 'Memorandum of Association',
      category: 'Business Registration',
      authority: 'DCRA',
      description: 'Company memorandum of association',
      tags: ['business', 'dcra', 'incorporation', 'company'],
      metadata: { renewalRequired: false },
    },
    {
      name: 'Notice of Directors',
      category: 'Business Registration',
      authority: 'DCRA',
      description: 'Notice of company directors and officers',
      tags: ['business', 'dcra', 'company', 'directors'],
      metadata: { renewalRequired: true },
    },
    {
      name: 'Notice of Registered Office',
      category: 'Business Registration',
      authority: 'DCRA',
      description: 'Notice of company registered office address',
      tags: ['business', 'dcra', 'company', 'address'],
      metadata: { renewalRequired: true },
    },
    {
      name: 'Change of Directors Form',
      category: 'Business Registration',
      authority: 'DCRA',
      description: 'Form to notify changes in company directors',
      tags: ['business', 'dcra', 'company', 'directors', 'change'],
      metadata: { renewalRequired: false },
    },
    {
      name: 'Change of Address Form',
      category: 'Business Registration',
      authority: 'DCRA',
      description: 'Form to notify change of registered address',
      tags: ['business', 'dcra', 'company', 'address', 'change'],
      metadata: { renewalRequired: false },
    },
    {
      name: 'Annual Return',
      category: 'Business Registration',
      authority: 'DCRA',
      description: 'Annual company return filing',
      tags: ['business', 'dcra', 'company', 'annual'],
      metadata: { frequency: 'annual', dueDate: 'Anniversary of incorporation' },
    },
    {
      name: 'Trade License',
      category: 'Business Registration',
      authority: 'Municipal Authority',
      description: 'Municipal trade license for business operation',
      tags: ['business', 'license', 'trade'],
      metadata: { validityPeriod: '1 year', renewalRequired: true },
    },

    // ========================================
    // IMMIGRATION DOCUMENTS
    // ========================================
    {
      name: 'Work Permit',
      category: 'Immigration',
      authority: 'Immigration',
      description: 'Work permit for foreign nationals',
      tags: ['immigration', 'work', 'permit'],
      metadata: { validityPeriod: '1 year', renewalRequired: true },
    },
    {
      name: 'Work Permit Application Form',
      category: 'Immigration',
      authority: 'Immigration',
      description: 'Application form for work permit',
      tags: ['immigration', 'work', 'permit', 'application'],
      metadata: { renewalRequired: false },
    },
    {
      name: 'Residence Permit',
      category: 'Immigration',
      authority: 'Immigration',
      description: 'Residence permit for foreign nationals',
      tags: ['immigration', 'residence', 'permit'],
      metadata: { validityPeriod: '1 year', renewalRequired: true },
    },
    {
      name: 'Business Visa',
      category: 'Immigration',
      authority: 'Immigration',
      description: 'Business visa for short-term business activities',
      tags: ['immigration', 'visa', 'business'],
      metadata: { validityPeriod: '6 months', renewalRequired: true },
    },
    {
      name: 'Landing Permit',
      category: 'Immigration',
      authority: 'Immigration',
      description: 'Landing permit for entry into Guyana',
      tags: ['immigration', 'landing', 'permit'],
      metadata: { validityPeriod: '90 days', renewalRequired: true },
    },
    {
      name: 'Employment Contract',
      category: 'Immigration',
      authority: null,
      description: 'Employment contract for work permit application',
      tags: ['immigration', 'employment', 'contract'],
      metadata: { renewalRequired: false },
    },
    {
      name: 'Police Clearance Certificate',
      category: 'Immigration',
      authority: 'Police Force',
      description: 'Police clearance certificate for immigration',
      tags: ['immigration', 'police', 'clearance'],
      metadata: { validityPeriod: '6 months', renewalRequired: true },
    },

    // ========================================
    // DEEDS REGISTRY DOCUMENTS
    // ========================================
    {
      name: 'Transport (Property Deed)',
      category: 'Deeds',
      authority: 'Deeds Registry',
      description: 'Property transport/transfer deed',
      tags: ['property', 'deeds', 'transfer'],
      metadata: { renewalRequired: false },
    },
    {
      name: 'Title Search Report',
      category: 'Deeds',
      authority: 'Deeds Registry',
      description: 'Property title search report',
      tags: ['property', 'deeds', 'title'],
      metadata: { validityPeriod: '3 months', renewalRequired: true },
    },
    {
      name: 'Property Valuation Report',
      category: 'Deeds',
      authority: 'Licensed Valuer',
      description: 'Professional property valuation report',
      tags: ['property', 'valuation'],
      metadata: { validityPeriod: '6 months', renewalRequired: true },
    },
    {
      name: 'Mortgage Document',
      category: 'Deeds',
      authority: 'Deeds Registry',
      description: 'Registered mortgage document',
      tags: ['property', 'deeds', 'mortgage'],
      metadata: { renewalRequired: false },
    },
    {
      name: 'Power of Attorney (Property)',
      category: 'Deeds',
      authority: 'Attorney-at-Law',
      description: 'Power of attorney for property transactions',
      tags: ['property', 'legal', 'poa'],
      metadata: { renewalRequired: false },
    },

    // ========================================
    // GO-INVEST DOCUMENTS
    // ========================================
    {
      name: 'Investment Certificate',
      category: 'Investment',
      authority: 'GO-Invest',
      description: 'GO-Invest investment certificate',
      tags: ['investment', 'go-invest'],
      metadata: { validityPeriod: '5 years', renewalRequired: true },
    },
    {
      name: 'Investment Incentive Application',
      category: 'Investment',
      authority: 'GO-Invest',
      description: 'Application for investment incentives',
      tags: ['investment', 'go-invest', 'incentive'],
      metadata: { renewalRequired: false },
    },

    // ========================================
    // FINANCIAL DOCUMENTS
    // ========================================
    {
      name: 'Bank Statement',
      category: 'Financial',
      authority: null,
      description: 'Bank account statement',
      tags: ['financial', 'banking'],
      metadata: { validityPeriod: '3 months', renewalRequired: true },
    },
    {
      name: 'Proof of Address',
      category: 'Financial',
      authority: null,
      description: 'Utility bill or other proof of residential address',
      tags: ['financial', 'address', 'proof'],
      metadata: { validityPeriod: '3 months', renewalRequired: true },
    },
    {
      name: 'Audited Financial Statements',
      category: 'Financial',
      authority: null,
      description: 'Audited company financial statements',
      tags: ['financial', 'audit', 'statements'],
      metadata: { frequency: 'annual', renewalRequired: true },
    },

    // ========================================
    // LEGAL DOCUMENTS
    // ========================================
    {
      name: 'Affidavit',
      category: 'Legal',
      authority: null,
      description: 'Sworn affidavit',
      tags: ['legal', 'affidavit'],
      metadata: { renewalRequired: false },
    },
    {
      name: 'Power of Attorney',
      category: 'Legal',
      authority: null,
      description: 'General power of attorney',
      tags: ['legal', 'poa'],
      metadata: { renewalRequired: false },
    },
    {
      name: 'Statutory Declaration',
      category: 'Legal',
      authority: null,
      description: 'Statutory declaration',
      tags: ['legal', 'declaration'],
      metadata: { renewalRequired: false },
    },
  ];

  for (const docType of documentTypes) {
    await prisma.documentType.upsert({
      where: {
        tenantId_name_category: {
          tenantId,
          name: docType.name,
          category: docType.category,
        },
      },
      update: {
        authority: docType.authority,
        description: docType.description,
        tags: docType.tags,
        metadata: docType.metadata,
      },
      create: {
        tenantId,
        ...docType,
      },
    });
  }

  console.log(`✓ Seeded ${documentTypes.length} enhanced document types`);
  return documentTypes.length;
}
