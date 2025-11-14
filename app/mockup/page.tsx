// Static HTML mockup to showcase the UI design

export default function MockupPage() {
  return (
    <html lang="en" className="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>KGC Compliance Cloud - Mockup</title>
        <style dangerouslySetInnerHTML={{__html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; background: #fafafa; }
          
          .header { background: white; border-bottom: 1px solid #e5e5e5; padding: 1rem 2rem; }
          .header-content { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 1.5rem; font-weight: bold; color: #0f766e; }
          .subtitle { font-size: 0.875rem; color: #737373; margin-top: 0.25rem; }
          
          .main { max-width: 1400px; margin: 0 auto; padding: 2rem; }
          .page-header { margin-bottom: 2rem; }
          .page-title { font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem; }
          .page-desc { color: #737373; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
          .stat-card { background: white; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 1.5rem; }
          .stat-card-content { display: flex; justify-content: space-between; align-items: center; }
          .stat-label { font-size: 0.875rem; color: #737373; }
          .stat-value { font-size: 2rem; font-weight: bold; margin-top: 0.5rem; }
          .stat-icon { width: 2rem; height: 2rem; }
          
          .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; }
          .feature-card { background: white; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 1.5rem; }
          .feature-icon { width: 3rem; height: 3rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
          .feature-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }
          .feature-desc { font-size: 0.875rem; color: #737373; margin-bottom: 1rem; line-height: 1.5; }
          .feature-list { list-style: none; }
          .feature-list li { font-size: 0.875rem; color: #737373; padding: 0.25rem 0; }
          
          .tech-stack { background: white; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 2rem; margin-top: 3rem; }
          .tech-stack-title { font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem; }
          .tech-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; }
          .tech-category h4 { font-weight: 600; color: #0f766e; margin-bottom: 0.5rem; }
          .tech-list { list-style: none; }
          .tech-list li { font-size: 0.875rem; color: #737373; padding: 0.25rem 0; }
          
          .btn { padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; }
          .btn-primary { background: #0f766e; color: white; }
          .btn-outline { background: white; color: #0f766e; border: 1px solid #0f766e; }
        `}} />
      </head>
      <body>
        <div className="header">
          <div className="header-content">
            <div>
              <div className="logo">KGC Compliance Cloud</div>
              <div className="subtitle">Multi-tenant Compliance Platform for Guyana</div>
            </div>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button className="btn btn-outline">Documentation</button>
              <button className="btn btn-primary">Login</button>
            </div>
          </div>
        </div>

        <div className="main">
          <div className="page-header">
            <h1 className="page-title">Welcome to KGC Compliance Cloud</h1>
            <p className="page-desc">
              A comprehensive multi-tenant SaaS platform for managing compliance, filings, documents, and services for professional services firms in Guyana.
            </p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <div className="stat-label">Total Clients</div>
                  <div className="stat-value">24</div>
                </div>
                <div className="stat-icon" style={{color: '#3b82f6'}}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <div className="stat-label">Documents</div>
                  <div className="stat-value">156</div>
                </div>
                <div className="stat-icon" style={{color: '#16a34a'}}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <div className="stat-label">Filings</div>
                  <div className="stat-value">89</div>
                </div>
                <div className="stat-icon" style={{color: '#9333ea'}}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <div className="stat-label">Services</div>
                  <div className="stat-value">12</div>
                </div>
                <div className="stat-icon" style={{color: '#ea580c'}}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon" style={{background: '#dbeafe', color: '#3b82f6'}}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="feature-title">Client Management</h3>
              <p className="feature-desc">
                Manage individual, company, and partnership clients with comprehensive profiles, risk levels, and compliance tracking.
              </p>
              <ul className="feature-list">
                <li>• Multi-type client support</li>
                <li>• Risk level assessment</li>
                <li>• TIN/NIS tracking</li>
                <li>• Business relationships</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{background: '#dcfce7', color: '#16a34a'}}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="feature-title">Document Management</h3>
              <p className="feature-desc">
                Store and manage documents with versioning, expiry tracking, and integration with MinIO object storage.
              </p>
              <ul className="feature-list">
                <li>• Version control</li>
                <li>• Expiry date tracking</li>
                <li>• MinIO storage integration</li>
                <li>• Authority categorization</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{background: '#f3e8ff', color: '#9333ea'}}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              </div>
              <h3 className="feature-title">Filings & Compliance</h3>
              <p className="feature-desc">
                Track filings for GRA, NIS, DCRA, and Immigration with automated calculations and document attachments.
              </p>
              <ul className="feature-list">
                <li>• Multi-authority support</li>
                <li>• Tax calculations</li>
                <li>• Deadline tracking</li>
                <li>• Document linking</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{background: '#fed7aa', color: '#ea580c'}}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="feature-title">Service Requests</h3>
              <p className="feature-desc">
                Manage service requests with SLA tracking, assignments, and progress monitoring for client work.
              </p>
              <ul className="feature-list">
                <li>• SLA management</li>
                <li>• Team assignments</li>
                <li>• Priority tracking</li>
                <li>• Status workflows</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{background: '#ccfbf1', color: '#0f766e'}}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="feature-title">Multi-Tenant Security</h3>
              <p className="feature-desc">
                Row-level security with tenant isolation, role-based access control, and comprehensive audit logging.
              </p>
              <ul className="feature-list">
                <li>• Tenant isolation</li>
                <li>• 8 role types</li>
                <li>• Audit logging</li>
                <li>• Permission system</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{background: '#fecaca', color: '#dc2626'}}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="feature-title">Reports & Analytics</h3>
              <p className="feature-desc">
                Generate compliance reports, track deadlines, and analyze performance across all authorities and clients.
              </p>
              <ul className="feature-list">
                <li>• Custom reports</li>
                <li>• Deadline dashboards</li>
                <li>• Performance metrics</li>
                <li>• Export capabilities</li>
              </ul>
            </div>
          </div>

          <div className="tech-stack">
            <h3 className="tech-stack-title">Technology Stack</h3>
            <div className="tech-grid">
              <div className="tech-category">
                <h4>Frontend</h4>
                <ul className="tech-list">
                  <li>• Next.js 16 (App Router)</li>
                  <li>• React 19.2</li>
                  <li>• Tailwind CSS v4</li>
                  <li>• shadcn/ui Components</li>
                </ul>
              </div>
              <div className="tech-category">
                <h4>Backend</h4>
                <ul className="tech-list">
                  <li>• Node.js</li>
                  <li>• NextAuth v5</li>
                  <li>• Prisma ORM</li>
                  <li>• Server Actions</li>
                </ul>
              </div>
              <div className="tech-category">
                <h4>Infrastructure</h4>
                <ul className="tech-list">
                  <li>• PostgreSQL (Neon)</li>
                  <li>• Redis (Upstash)</li>
                  <li>• MinIO Object Storage</li>
                  <li>• Docker Compose</li>
                </ul>
              </div>
              <div className="tech-category">
                <h4>Features</h4>
                <ul className="tech-list">
                  <li>• BullMQ Job Queue</li>
                  <li>• Multi-tenant Architecture</li>
                  <li>• Role-based Access</li>
                  <li>• Audit Logging</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
