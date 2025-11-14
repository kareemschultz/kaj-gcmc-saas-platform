# Analytics & Reporting Documentation

The KGC Compliance Cloud provides advanced analytics and correlation views for compliance operations in Guyana.

## Overview

The analytics system offers:
- **Trend Analysis** - Compliance and filing trends over time
- **Authority Insights** - GRA, NIS, DCRA, Immigration, Deeds, GO-Invest specific metrics
- **Sector Analysis** - Compliance by industry sector
- **Risk Correlation** - Identify high-risk clients
- **Workload Metrics** - Task and service request distribution

## Analytics Dashboard

**Route:** `/analytics`

### Key Features

#### Compliance Trend Chart
- Line chart showing green/amber/red client distribution over time
- Average compliance score trend
- 6-month historical view (configurable)

#### Filing Trend Chart
- Bar chart showing filing activity by month
- Submitted vs overdue filings
- Helps identify seasonal patterns

#### Authority Breakdown
- Pie charts for overdue filings and expiring documents by authority
- Quick visual identification of problematic authorities

#### Authority Cards
- Detailed metrics for each authority:
  - Compliance rate (%)
  - Overdue filings count
  - Expiring documents (7-day and 30-day windows)
  - Most common overdue filing types

#### Sector Compliance Chart
- Horizontal stacked bar chart
- Green/amber/red distribution per sector
- Helps identify sector-specific compliance challenges

#### Risk Correlation Table
- Top 10 highest risk clients
- Factors considered:
  - Compliance level (red > amber > green)
  - Risk level (high > medium > low)
  - Overdue filings count
  - Missing documents count
  - High filing volume flag
- Direct links to client pages

#### Workload Metrics
- Tasks by status (open, in_progress, blocked, completed)
- Service requests by status
- Average tasks per client
- Visual progress bars

## Analytics Queries

### Compliance Trends

```typescript
import { fetchComplianceTrends } from '@/src/lib/actions/analytics';

const trends = await fetchComplianceTrends(6); // 6 months
```

Returns:
```typescript
interface ComplianceTrend {
  date: Date;
  green: number;
  amber: number;
  red: number;
  avgScore: number;
}
```

### Filing Trends

```typescript
import { fetchFilingTrends } from '@/src/lib/actions/analytics';

const trends = await fetchFilingTrends(6); // 6 months
```

Returns:
```typescript
interface FilingTrend {
  month: string; // YYYY-MM
  submitted: number;
  overdue: number;
  total: number;
}
```

### Authority Analysis

```typescript
import { fetchAuthorityAnalysis } from '@/src/lib/actions/analytics';

const analysis = await fetchAuthorityAnalysis('GRA');
```

Returns:
```typescript
interface AuthorityAnalysis {
  authority: string;
  lateFilings: {
    total: number;
    byType: Record<string, number>;
  };
  expiringDocs: {
    total: number;
    within7Days: number;
    within30Days: number;
  };
  complianceRate: number; // 0-100
}
```

### Sector Compliance

```typescript
import { fetchSectorCompliance } from '@/src/lib/actions/analytics';

const sectors = await fetchSectorCompliance();
```

Returns:
```typescript
interface SectorCompliance {
  sector: string;
  clientCount: number;
  avgScore: number;
  greenCount: number;
  amberCount: number;
  redCount: number;
}
```

### Risk Correlation

```typescript
import { fetchRiskCorrelation } from '@/src/lib/actions/analytics';

const risks = await fetchRiskCorrelation();
```

Returns:
```typescript
interface RiskCorrelation {
  clientId: number;
  clientName: string;
  riskLevel: string;
  complianceLevel: string;
  overdueFilings: number;
  missingDocs: number;
  highFilingVolume: boolean; // >20 total filings
}
```

### Workload Metrics

```typescript
import { fetchWorkloadMetrics } from '@/src/lib/actions/analytics';

const metrics = await fetchWorkloadMetrics();
```

Returns:
```typescript
interface WorkloadMetrics {
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  serviceRequestsByStatus: Record<string, number>;
  avgTasksPerClient: number;
}
```

## Client Profile Analytics

**Location:** Client detail page (`/clients/[id]`)

**Component:** `<ClientAnalyticsPanel />`

### Features

#### Compliance Overview
- Current compliance score and level
- Missing items, expiring items, overdue filings counts
- Color-coded badges (green/amber/red)

#### Bundle Progress Tab
- Visual progress bars for each assigned bundle
- Completion percentage
- Authority and category labels
- Item counts (completed/total)

#### Activity Timeline Tab
- Bar chart of filing activity by month
- Overdue vs total filings
- Recent events timeline
- Audit log integration

#### Risk Factors Tab
- Color-coded alerts (red for high, amber for medium)
- Overdue filings
- Missing documents
- Expiring documents
- Action recommendations

## Guyana-Specific Metrics

### GRA (Guyana Revenue Authority)
- Late PAYE, VAT, Corporation Tax, Individual Tax filings
- Tax compliance certificates
- Tender compliance documents

### NIS (National Insurance Scheme)
- Late contribution filings
- Missing NIS certificates
- Employer registration status

### DCRA (Deeds & Commercial Registry Authority)
- Missing annual returns
- Business registration documentation
- Company incorporation documents

### Immigration
- Work permits expiring in X days
- Residence permits status
- Immigration compliance documents

### Deeds Registry
- Property transfer documents
- Mortgage registration
- Title deed status

### GO-Invest
- Investment registration documents
- Incentive applications
- Compliance certificates

## Chart Components

All charts use **Recharts** library with consistent theming:
- Primary color: `#0d9488` (Teal)
- Green: `#10b981`
- Amber: `#f59e0b`
- Red: `#ef4444`

### Available Charts

1. **ComplianceTrendChart** - Line chart for compliance over time
2. **FilingTrendChart** - Bar chart for filing activity
3. **SectorComplianceChart** - Horizontal stacked bar chart
4. **AuthorityBreakdownChart** - Dual pie charts
5. **RiskCorrelationTable** - Sortable data table

## Performance Considerations

- Analytics queries use Prisma's parallel execution with `Promise.all`
- Results are server-rendered (no client-side data fetching)
- Caching can be added via Next.js `revalidate` or React Query
- Large datasets should use pagination

## Future Enhancements

- Export analytics to PDF/Excel
- Custom date range selection
- Scheduled email reports
- Comparative analysis (month-over-month, year-over-year)
- Predictive analytics using ML
- Real-time dashboard updates via WebSockets

## Related Documentation

- [Dashboard](./DASHBOARD.md)
- [Compliance Engine](./COMPLIANCE_ENGINE.md)
- [Reporting](./REPORTING.md)
