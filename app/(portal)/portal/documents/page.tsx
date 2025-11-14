import { Metadata } from 'next';
import { getPortalDocuments } from '@/lib/actions/portal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documents | Client Portal',
};

export default async function PortalDocumentsPage() {
  const clientId = 1; // From session in real app
  const documents = await getPortalDocuments(clientId);

  // Group by category
  const grouped: Record<string, any[]> = {};
  documents.forEach((doc: any) => {
    const category = doc.documentType.category || 'Other';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(doc);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Documents</h1>
        <p className="text-muted-foreground mt-1">
          View and download your compliance documents
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-2xl font-bold">{documents.length}</div>
          <div className="text-sm text-muted-foreground">Total Documents</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {documents.filter((d: any) => d.status === 'valid').length}
          </div>
          <div className="text-sm text-muted-foreground">Valid Documents</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-amber-600">
            {documents.filter((d: any) => {
              if (!d.latestVersion?.expiryDate) return false;
              const daysUntil = Math.ceil(
                (new Date(d.latestVersion.expiryDate).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              );
              return daysUntil <= 30 && daysUntil >= 0;
            }).length}
          </div>
          <div className="text-sm text-muted-foreground">Expiring Soon</div>
        </Card>
      </div>

      {/* Documents by Category */}
      {Object.entries(grouped).map(([category, docs]) => (
        <div key={category}>
          <h2 className="text-xl font-semibold mb-4">{category}</h2>
          <div className="grid gap-4">
            {docs.map((doc: any) => {
              const expiryDate = doc.latestVersion?.expiryDate
                ? new Date(doc.latestVersion.expiryDate)
                : null;
              const daysUntilExpiry = expiryDate
                ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;
              const isExpiring = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
              const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

              return (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {doc.documentType.name} • {doc.documentType.authority}
                        </div>
                        {doc.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {doc.description}
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{doc.status}</Badge>
                          {expiryDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Expires: {expiryDate.toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        {(isExpiring || isExpired) && (
                          <div className={`flex items-center gap-2 text-sm mt-2 p-2 rounded ${
                            isExpired ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              {isExpired ? 'Expired' : `Expires in ${daysUntilExpiry} days`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {documents.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No documents available</p>
        </Card>
      )}
    </div>
  );
}
