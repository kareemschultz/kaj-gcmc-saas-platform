// Guyana-specific requirement bundles seed data
// Defines document and filing bundles for GRA, NIS, DCRA, Immigration, Deeds, and GO-Invest

import { PrismaClient } from '@prisma/client';

interface BundleDefinition {
  name: string;
  authority: string;
  category: string;
  description: string;
  items: Array<{
    documentTypeName?: string;
    filingTypeCode?: string;
    required: boolean;
    description?: string;
    order: number;
  }>;
}

export async function seedGuyanaRequirementBundles(
  prisma: PrismaClient,
  tenantId: number
) {
  console.log('Seeding Guyana requirement bundles...');

  // Define all bundles
  const bundles: BundleDefinition[] = [
    // ========================================
    // GRA BUNDLES
    // ========================================
    {
      name: 'GRA Individual Income Tax Filing',
      authority: 'GRA',
      category: 'tax',
      description: 'Required documents for individual income tax return filing',
      items: [
        {
          documentTypeName: 'Form G0004 - Individual Income Tax Return',
          required: true,
          description: 'Completed and signed tax return form',
          order: 1,
        },
        {
          documentTypeName: 'TIN Certificate',
          required: true,
          description: 'Valid taxpayer identification number',
          order: 2,
        },
        {
          documentTypeName: 'National ID Card',
          required: true,
          description: 'Valid national identification',
          order: 3,
        },
        {
          documentTypeName: 'Bank Statement',
          required: false,
          description: 'Recent bank statements for verification',
          order: 4,
        },
      ],
    },
    {
      name: 'GRA PAYE Employer Setup',
      authority: 'GRA',
      category: 'tax',
      description: 'Required documents for employer PAYE registration and monthly filing',
      items: [
        {
          documentTypeName: 'Form G0003 - PAYE Withholding Return',
          required: true,
          description: 'Monthly PAYE return form',
          order: 1,
        },
        {
          documentTypeName: 'Business Registration Certificate',
          required: true,
          description: 'Valid business registration',
          order: 2,
        },
        {
          documentTypeName: 'TIN Certificate',
          required: true,
          description: 'Business TIN certificate',
          order: 3,
        },
        {
          documentTypeName: 'Form F7B - Employer\'s Annual Reconciliation',
          required: true,
          description: 'Annual PAYE reconciliation (due January 31)',
          order: 4,
        },
      ],
    },
    {
      name: 'GRA VAT Compliance',
      authority: 'GRA',
      category: 'tax',
      description: 'Required documents for VAT registration and monthly returns',
      items: [
        {
          documentTypeName: 'GRA VAT Registration Certificate',
          required: true,
          description: 'VAT registration certificate',
          order: 1,
        },
        {
          documentTypeName: 'Form G0017 - VAT Return',
          required: true,
          description: 'Monthly VAT return',
          order: 2,
        },
        {
          documentTypeName: 'Business Registration Certificate',
          required: true,
          description: 'Valid business registration',
          order: 3,
        },
        {
          documentTypeName: 'TIN Certificate',
          required: true,
          description: 'Business TIN certificate',
          order: 4,
        },
      ],
    },
    {
      name: 'GRA Corporation Tax Filing',
      authority: 'GRA',
      category: 'tax',
      description: 'Required documents for annual corporation tax return',
      items: [
        {
          documentTypeName: 'Form G0022 - Corporation Tax Return',
          required: true,
          description: 'Completed corporation tax return',
          order: 1,
        },
        {
          documentTypeName: 'Audited Financial Statements',
          required: true,
          description: 'Audited financial statements for the tax year',
          order: 2,
        },
        {
          documentTypeName: 'Certificate of Incorporation',
          required: true,
          description: 'Company incorporation certificate',
          order: 3,
        },
        {
          documentTypeName: 'TIN Certificate',
          required: true,
          description: 'Company TIN certificate',
          order: 4,
        },
      ],
    },
    {
      name: 'GRA Tender Compliance Certificate',
      authority: 'GRA',
      category: 'compliance',
      description: 'Required documents to obtain tender compliance certificate',
      items: [
        {
          documentTypeName: 'GRA Tender Compliance Certificate',
          required: true,
          description: 'Issued compliance certificate (valid 3 months)',
          order: 1,
        },
        {
          documentTypeName: 'TIN Certificate',
          required: true,
          description: 'Valid TIN certificate',
          order: 2,
        },
        {
          documentTypeName: 'Tax Clearance Certificate',
          required: true,
          description: 'All taxes paid and current',
          order: 3,
        },
      ],
    },
    {
      name: 'GRA Land Compliance Certificate',
      authority: 'GRA',
      category: 'compliance',
      description: 'Required documents for land transaction compliance',
      items: [
        {
          documentTypeName: 'GRA Land Compliance Certificate',
          required: true,
          description: 'Issued compliance certificate (valid 3 months)',
          order: 1,
        },
        {
          documentTypeName: 'TIN Certificate',
          required: true,
          description: 'Valid TIN certificate',
          order: 2,
        },
        {
          documentTypeName: 'Tax Clearance Certificate',
          required: true,
          description: 'All taxes paid and current',
          order: 3,
        },
      ],
    },

    // ========================================
    // NIS BUNDLES
    // ========================================
    {
      name: 'NIS Employer Registration',
      authority: 'NIS',
      category: 'registration',
      description: 'Required documents for employer NIS registration',
      items: [
        {
          documentTypeName: 'NIS Employer Registration Certificate',
          required: true,
          description: 'Issued employer registration certificate',
          order: 1,
        },
        {
          documentTypeName: 'Business Registration Certificate',
          required: true,
          description: 'Valid business registration',
          order: 2,
        },
        {
          documentTypeName: 'TIN Certificate',
          required: true,
          description: 'Business TIN certificate',
          order: 3,
        },
      ],
    },
    {
      name: 'NIS Monthly Employer Contributions',
      authority: 'NIS',
      category: 'contribution',
      description: 'Required documents for monthly NIS contributions',
      items: [
        {
          documentTypeName: 'NIS Monthly Contribution Statement',
          required: true,
          description: 'Completed monthly contribution statement',
          order: 1,
        },
        {
          documentTypeName: 'NIS Employer Registration Certificate',
          required: true,
          description: 'Valid employer registration',
          order: 2,
        },
        {
          documentTypeName: 'NIS Employee Registration Form',
          required: true,
          description: 'Registration forms for all new employees',
          order: 3,
        },
      ],
    },
    {
      name: 'NIS Employer Compliance Certificate',
      authority: 'NIS',
      category: 'compliance',
      description: 'Required documents to obtain employer compliance certificate',
      items: [
        {
          documentTypeName: 'NIS Compliance Certificate - Employer',
          required: true,
          description: 'Issued compliance certificate (valid 3 months)',
          order: 1,
        },
        {
          documentTypeName: 'NIS Employer Registration Certificate',
          required: true,
          description: 'Valid employer registration',
          order: 2,
        },
        {
          documentTypeName: 'NIS Monthly Contribution Statement',
          required: true,
          description: 'All contributions current and paid',
          order: 3,
        },
      ],
    },
    {
      name: 'NIS Self-Employed Registration',
      authority: 'NIS',
      category: 'registration',
      description: 'Required documents for self-employed NIS registration',
      items: [
        {
          documentTypeName: 'NIS Registration Card',
          required: true,
          description: 'Issued NIS registration card',
          order: 1,
        },
        {
          documentTypeName: 'National ID Card',
          required: true,
          description: 'Valid national identification',
          order: 2,
        },
        {
          documentTypeName: 'TIN Certificate',
          required: true,
          description: 'Valid TIN certificate',
          order: 3,
        },
        {
          documentTypeName: 'Business Registration Certificate',
          required: false,
          description: 'Business registration if applicable',
          order: 4,
        },
      ],
    },

    // ========================================
    // DCRA BUNDLES
    // ========================================
    {
      name: 'DCRA Business Name Registration',
      authority: 'DCRA',
      category: 'registration',
      description: 'Required documents for business name registration',
      items: [
        {
          documentTypeName: 'Business Name Registration Certificate',
          required: true,
          description: 'Issued registration certificate',
          order: 1,
        },
        {
          documentTypeName: 'National ID Card',
          required: true,
          description: 'Owner\'s national identification',
          order: 2,
        },
        {
          documentTypeName: 'TIN Certificate',
          required: true,
          description: 'Owner\'s TIN certificate',
          order: 3,
        },
        {
          documentTypeName: 'Trade License',
          required: true,
          description: 'Municipal trade license',
          order: 4,
        },
        {
          documentTypeName: 'Proof of Address',
          required: true,
          description: 'Business address verification',
          order: 5,
        },
      ],
    },
    {
      name: 'DCRA Company Incorporation',
      authority: 'DCRA',
      category: 'registration',
      description: 'Required documents for company incorporation',
      items: [
        {
          documentTypeName: 'Certificate of Incorporation',
          required: true,
          description: 'Issued incorporation certificate',
          order: 1,
        },
        {
          documentTypeName: 'Articles of Incorporation',
          required: true,
          description: 'Filed articles of incorporation',
          order: 2,
        },
        {
          documentTypeName: 'Memorandum of Association',
          required: true,
          description: 'Filed memorandum of association',
          order: 3,
        },
        {
          documentTypeName: 'Notice of Directors',
          required: true,
          description: 'Notice of initial directors',
          order: 4,
        },
        {
          documentTypeName: 'Notice of Registered Office',
          required: true,
          description: 'Notice of registered office address',
          order: 5,
        },
        {
          documentTypeName: 'National ID Card',
          required: true,
          description: 'ID cards of all directors',
          order: 6,
        },
      ],
    },
    {
      name: 'DCRA Annual Company Compliance',
      authority: 'DCRA',
      category: 'compliance',
      description: 'Required annual filings for companies',
      items: [
        {
          documentTypeName: 'Annual Return',
          required: true,
          description: 'Annual company return',
          order: 1,
        },
        {
          documentTypeName: 'Audited Financial Statements',
          required: true,
          description: 'Annual audited financials',
          order: 2,
        },
        {
          documentTypeName: 'Notice of Directors',
          required: true,
          description: 'Current directors list',
          order: 3,
        },
        {
          documentTypeName: 'Notice of Registered Office',
          required: true,
          description: 'Current registered office',
          order: 4,
        },
      ],
    },

    // ========================================
    // IMMIGRATION BUNDLES
    // ========================================
    {
      name: 'Immigration Work Permit Application',
      authority: 'Immigration',
      category: 'permit',
      description: 'Required documents for work permit application',
      items: [
        {
          documentTypeName: 'Work Permit Application Form',
          required: true,
          description: 'Completed application form',
          order: 1,
        },
        {
          documentTypeName: 'Passport',
          required: true,
          description: 'Valid passport with 6+ months validity',
          order: 2,
        },
        {
          documentTypeName: 'Employment Contract',
          required: true,
          description: 'Signed employment contract',
          order: 3,
        },
        {
          documentTypeName: 'Police Clearance Certificate',
          required: true,
          description: 'Police clearance from country of origin',
          order: 4,
        },
        {
          documentTypeName: 'Business Registration Certificate',
          required: true,
          description: 'Employer\'s business registration',
          order: 5,
        },
        {
          documentTypeName: 'NIS Compliance Certificate - Employer',
          required: true,
          description: 'Employer NIS compliance',
          order: 6,
        },
        {
          documentTypeName: 'GRA Tender Compliance Certificate',
          required: true,
          description: 'Employer GRA compliance',
          order: 7,
        },
      ],
    },
    {
      name: 'Immigration Work Permit Renewal',
      authority: 'Immigration',
      category: 'permit',
      description: 'Required documents for work permit renewal',
      items: [
        {
          documentTypeName: 'Work Permit',
          required: true,
          description: 'Current/expired work permit',
          order: 1,
        },
        {
          documentTypeName: 'Passport',
          required: true,
          description: 'Valid passport with 6+ months validity',
          order: 2,
        },
        {
          documentTypeName: 'Employment Contract',
          required: true,
          description: 'Current employment contract',
          order: 3,
        },
        {
          documentTypeName: 'NIS Compliance Certificate - Employer',
          required: true,
          description: 'Employer NIS compliance',
          order: 4,
        },
        {
          documentTypeName: 'GRA Tender Compliance Certificate',
          required: true,
          description: 'Employer GRA compliance',
          order: 5,
        },
      ],
    },
    {
      name: 'Immigration Residence Permit',
      authority: 'Immigration',
      category: 'permit',
      description: 'Required documents for residence permit application',
      items: [
        {
          documentTypeName: 'Passport',
          required: true,
          description: 'Valid passport',
          order: 1,
        },
        {
          documentTypeName: 'Police Clearance Certificate',
          required: true,
          description: 'Police clearance certificate',
          order: 2,
        },
        {
          documentTypeName: 'Proof of Address',
          required: true,
          description: 'Proof of Guyana residential address',
          order: 3,
        },
        {
          documentTypeName: 'Bank Statement',
          required: true,
          description: 'Recent bank statements',
          order: 4,
        },
      ],
    },

    // ========================================
    // DEEDS REGISTRY BUNDLES
    // ========================================
    {
      name: 'Deeds Property Transfer',
      authority: 'Deeds Registry',
      category: 'property',
      description: 'Required documents for property transfer/purchase',
      items: [
        {
          documentTypeName: 'Transport (Property Deed)',
          required: true,
          description: 'Executed transport deed',
          order: 1,
        },
        {
          documentTypeName: 'Title Search Report',
          required: true,
          description: 'Recent title search (within 3 months)',
          order: 2,
        },
        {
          documentTypeName: 'Property Valuation Report',
          required: true,
          description: 'Professional property valuation',
          order: 3,
        },
        {
          documentTypeName: 'National ID Card',
          required: true,
          description: 'Buyer and seller identification',
          order: 4,
        },
        {
          documentTypeName: 'GRA Land Compliance Certificate',
          required: true,
          description: 'Seller\'s tax compliance',
          order: 5,
        },
        {
          documentTypeName: 'Power of Attorney (Property)',
          required: false,
          description: 'If transacting through attorney',
          order: 6,
        },
      ],
    },
    {
      name: 'Deeds Mortgage Registration',
      authority: 'Deeds Registry',
      category: 'property',
      description: 'Required documents for mortgage registration',
      items: [
        {
          documentTypeName: 'Mortgage Document',
          required: true,
          description: 'Executed mortgage deed',
          order: 1,
        },
        {
          documentTypeName: 'Transport (Property Deed)',
          required: true,
          description: 'Property transport/title deed',
          order: 2,
        },
        {
          documentTypeName: 'Title Search Report',
          required: true,
          description: 'Recent title search',
          order: 3,
        },
        {
          documentTypeName: 'Property Valuation Report',
          required: true,
          description: 'Bank-approved valuation',
          order: 4,
        },
        {
          documentTypeName: 'National ID Card',
          required: true,
          description: 'Mortgagor identification',
          order: 5,
        },
      ],
    },

    // ========================================
    // GO-INVEST BUNDLES
    // ========================================
    {
      name: 'GO-Invest Investment Registration',
      authority: 'GO-Invest',
      category: 'investment',
      description: 'Required documents for investment registration and incentives',
      items: [
        {
          documentTypeName: 'Investment Incentive Application',
          required: true,
          description: 'Completed application form',
          order: 1,
        },
        {
          documentTypeName: 'Certificate of Incorporation',
          required: true,
          description: 'Company incorporation certificate',
          order: 2,
        },
        {
          documentTypeName: 'Articles of Incorporation',
          required: true,
          description: 'Company articles',
          order: 3,
        },
        {
          documentTypeName: 'Audited Financial Statements',
          required: false,
          description: 'Financial statements if existing company',
          order: 4,
        },
        {
          documentTypeName: 'Bank Statement',
          required: true,
          description: 'Proof of investment funds',
          order: 5,
        },
        {
          documentTypeName: 'Passport',
          required: true,
          description: 'Investor identification',
          order: 6,
        },
      ],
    },
  ];

  // Create bundles and their items
  let createdCount = 0;
  for (const bundleDef of bundles) {
    // Create or update the bundle
    const bundle = await prisma.requirementBundle.upsert({
      where: {
        // Use a composite to check uniqueness
        id: (
          await prisma.requirementBundle.findFirst({
            where: {
              tenantId,
              name: bundleDef.name,
              authority: bundleDef.authority,
            },
          })
        )?.id ?? 0,
      },
      update: {
        category: bundleDef.category,
        description: bundleDef.description,
      },
      create: {
        tenantId,
        name: bundleDef.name,
        authority: bundleDef.authority,
        category: bundleDef.category,
        description: bundleDef.description,
      },
    });

    // Delete existing items for this bundle to refresh
    await prisma.requirementBundleItem.deleteMany({
      where: { bundleId: bundle.id },
    });

    // Create bundle items
    for (const item of bundleDef.items) {
      let documentTypeId: number | null = null;
      let filingTypeId: number | null = null;

      if (item.documentTypeName) {
        const docType = await prisma.documentType.findFirst({
          where: {
            tenantId,
            name: item.documentTypeName,
          },
        });
        if (docType) {
          documentTypeId = docType.id;
        }
      }

      if (item.filingTypeCode) {
        const filingType = await prisma.filingType.findFirst({
          where: {
            tenantId,
            code: item.filingTypeCode,
          },
        });
        if (filingType) {
          filingTypeId = filingType.id;
        }
      }

      await prisma.requirementBundleItem.create({
        data: {
          bundleId: bundle.id,
          documentTypeId,
          filingTypeId,
          required: item.required,
          description: item.description,
          order: item.order,
        },
      });
    }

    createdCount++;
  }

  console.log(`✓ Seeded ${createdCount} requirement bundles`);
  return createdCount;
}
