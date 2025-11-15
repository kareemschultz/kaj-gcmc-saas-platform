import { getComplianceRuleSet } from '@/lib/actions/compliance-rules';
import { RuleSetForm } from '@/components/compliance/rule-set-form';
import { RuleForm } from '@/components/compliance/rule-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditRuleSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const { id: idParam } = await params;
  const id = parseInt(idParam);
  if (isNaN(id)) {
    notFound();
  }

  try {
    const ruleSet = await getComplianceRuleSet(id);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Rule Set</h1>
            <p className="mt-1 text-sm text-gray-600">
              Update {ruleSet.name} details and rules
            </p>
          </div>
          <Link
            href="/compliance/rules"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to Rule Sets
          </Link>
        </div>

        {/* Rule Set Form */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Rule Set Details</h2>
          <RuleSetForm ruleSet={ruleSet} />
        </div>

        {/* Rules Section */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Compliance Rules</h2>
            <span className="text-sm text-gray-600">{ruleSet.rules.length} rules</span>
          </div>

          {/* Add New Rule Form */}
          <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <h3 className="text-sm font-semibold text-teal-900 mb-3">Add New Rule</h3>
            <RuleForm ruleSetId={ruleSet.id} />
          </div>

          {/* Existing Rules */}
          {ruleSet.rules.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No rules defined yet. Add your first rule above.
            </div>
          ) : (
            <div className="space-y-4">
              {ruleSet.rules.map((rule: any) => (
                <div key={rule.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <RuleForm ruleSetId={ruleSet.id} rule={rule} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
