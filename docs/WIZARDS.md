# Wizard System Documentation

The KGC Compliance Cloud includes a powerful wizard framework for guiding staff through complex multi-step workflows.

## Overview

The wizard system provides:
- **Generic framework** for building multi-step wizards
- **Progress tracking** with visual indicators
- **Step validation** before proceeding
- **Navigation controls** (Next, Back, Skip, Save draft)
- **Review & confirm** final step patterns

## Available Wizards

### 1. New Client Onboarding Wizard

**Route:** `/wizards/new-client`

**Purpose:** Streamline the process of onboarding new clients with all necessary compliance setup.

**Steps:**
1. **Basic Info** - Client contact and identification details
   - Name, type (individual/company/partnership)
   - Email, phone, address
   - TIN, NIS number, sector
   - Risk level

2. **Businesses** (Optional) - Business entities for company clients
   - Business name, registration number
   - Incorporation date, country
   - Sector and status

3. **Compliance** - Select authorities and compliance bundles
   - Choose relevant authorities (GRA, NIS, DCRA, Immigration, Deeds, GO-Invest)
   - Select pre-configured bundles for each authority
   - View bundle contents (documents & filings)

4. **Services** (Optional) - Create initial service requests
   - Select service types
   - Set priority levels
   - Add notes and context

5. **Review** - Confirm all details
   - Summary of all entered information
   - Bundle and service request overview

**On Completion:**
- Client record created
- Business entities created (if applicable)
- Initial service requests created
- Compliance score calculated
- Audit log entry created

**Server Action:** `completeNewClientWizard(data)`

---

### 2. Compliance Setup Wizard

**Route:** `/wizards/compliance-setup/[clientId]`

**Purpose:** Configure compliance requirements and bundles for an existing client.

**Steps:**
1. **Authorities** - Select relevant regulatory authorities
   - GRA, NIS, DCRA, Immigration, Deeds, GO-Invest
   - Authority descriptions and scope

2. **Bundles** - Choose compliance bundles
   - Authority-specific bundles
   - View requirements (documents & filings)
   - Bundle categories (tax, registration, permits, etc.)

3. **Configure** (Optional) - Customize bundle requirements
   - Enable/disable specific requirements
   - Mark items as required or optional

4. **Tasks** - Auto-create tasks for gaps
   - Option to automatically create tasks for missing items
   - Tasks will be assigned appropriate priority

5. **Review** - Confirm compliance setup
   - Summary of authorities and bundles
   - Active requirements count

**On Completion:**
- Tasks created for missing requirements (if enabled)
- Compliance score recalculated
- Audit log entry created

**Server Action:** `completeComplianceSetupWizard(data)`

---

### 3. Service Request Wizard

**Route:** `/wizards/service-request/new`

**Purpose:** Create new service requests with workflow configuration.

**Steps:**
1. **Client** - Select the client
   - Search and filter clients
   - View client details

2. **Service** - Choose service to provide
   - Services grouped by category
   - View pricing and estimated timeline
   - Select workflow template (if available)
   - Set priority and add notes

3. **Workflow** (Optional) - Configure workflow steps
   - Use template steps or define custom steps
   - Set step titles, descriptions, and due dates
   - Reorder steps with drag-and-drop

4. **Assign** - Configure task and assignment
   - Option to auto-create initial task
   - Set task priority

5. **Review** - Confirm service request
   - Summary of service, workflow, and settings

**On Completion:**
- Service request created
- Workflow steps created from template or custom steps
- Initial task created (if enabled)
- Audit log entry created

**Server Action:** `completeServiceRequestWizard(data)`

---

## Wizard Framework Components

### WizardProvider

React context provider that manages wizard state.

```tsx
<WizardProvider
  config={wizardConfig}
  initialData={initialData}
  onComplete={handleComplete}
>
  {children}
</WizardProvider>
```

### WizardLayout

Layout component providing:
- Progress bar
- Step indicators
- Visual step navigation

### WizardNavigation

Navigation controls:
- Back button (hidden on first step)
- Next button (hidden on last step)
- Complete button (shown on last step)
- Optional validation before proceeding

### useWizard Hook

Access wizard state and controls:

```tsx
const {
  state,
  currentStep,
  isFirstStep,
  isLastStep,
  nextStep,
  previousStep,
  updateData,
  completeWizard,
} = useWizard<DataType>();
```

## Creating Custom Wizards

### 1. Define Configuration

```tsx
const wizardConfig: WizardConfig = {
  id: 'my-wizard',
  title: 'My Custom Wizard',
  description: 'Description of wizard purpose',
  steps: [
    {
      id: 'step-1',
      title: 'Step One',
      description: 'Description of this step',
      optional: false,
    },
    // ... more steps
  ],
};
```

### 2. Create Step Components

Each step should:
- Use `useWizard()` hook
- Update data with `updateData()`
- Include `<WizardNavigation />` with optional validation

```tsx
export function MyStep() {
  const { state, updateData } = useWizard<MyDataType>();

  const handleNext = () => {
    if (!state.data.requiredField) {
      alert('Please fill required field');
      return false;
    }
    return true;
  };

  return (
    <div>
      {/* Step content */}
      <WizardNavigation onNext={handleNext} />
    </div>
  );
}
```

### 3. Create Main Wizard Component

```tsx
export function MyWizard({ /* props */ }) {
  const router = useRouter();

  const handleComplete = async (data: MyDataType) => {
    const result = await myServerAction(data);
    if (result.success) {
      toast.success('Success!');
      router.push('/destination');
    }
  };

  return (
    <WizardProvider
      config={wizardConfig}
      initialData={initialData}
      onComplete={handleComplete}
    >
      <WizardLayout>
        <WizardStepRenderer />
      </WizardLayout>
    </WizardProvider>
  );
}
```

## Best Practices

1. **Validation** - Always validate required fields before allowing navigation
2. **Progress Feedback** - Use loading states during submission
3. **Error Handling** - Display clear error messages
4. **Data Persistence** - Consider saving draft state for long wizards
5. **Accessibility** - Ensure keyboard navigation works
6. **Mobile** - Test wizard flow on mobile devices

## Related Documentation

- [Server Actions](./SERVER_ACTIONS.md)
- [RBAC](./RBAC.md)
- [Client Management](./CLIENTS.md)
