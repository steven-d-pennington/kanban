import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ContrastIssue {
  component: string;
  file: string;
  line: number;
  element: string;
  textColor: string;
  backgroundColor: string;
  contrastRatio: number;
  wcagLevel: 'fail' | 'aa' | 'aaa';
  severity: 'critical' | 'warning' | 'info';
}

interface AuditResults {
  totalIssues: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
  issues: ContrastIssue[];
  scannedFiles: string[];
}

const ContrastAuditPage: React.FC = () => {
  const [auditResults, setAuditResults] = useState<AuditResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Mock audit results - in real implementation, this would scan actual files
  const mockAuditResults: AuditResults = {
    totalIssues: 23,
    criticalIssues: 8,
    warningIssues: 12,
    infoIssues: 3,
    scannedFiles: [
      'src/components/forms/ContactForm.tsx',
      'src/components/forms/LoginForm.tsx',
      'src/components/forms/SearchInput.tsx',
      'src/components/ui/Button.tsx',
      'src/components/ui/Input.tsx',
      'src/components/ui/Select.tsx',
      'src/components/ui/TextArea.tsx',
      'src/pages/auth/SignupPage.tsx',
      'src/pages/contact/ContactPage.tsx',
    ],
    issues: [
      {
        component: 'LoginForm',
        file: 'src/components/forms/LoginForm.tsx',
        line: 45,
        element: 'input',
        textColor: 'text-gray-300',
        backgroundColor: 'bg-gray-100',
        contrastRatio: 2.1,
        wcagLevel: 'fail',
        severity: 'critical',
      },
      {
        component: 'Button',
        file: 'src/components/ui/Button.tsx',
        line: 23,
        element: 'button',
        textColor: 'text-white',
        backgroundColor: 'bg-blue-400',
        contrastRatio: 3.2,
        wcagLevel: 'fail',
        severity: 'critical',
      },
      {
        component: 'ContactForm',
        file: 'src/components/forms/ContactForm.tsx',
        line: 67,
        element: 'label',
        textColor: 'text-gray-400',
        backgroundColor: 'bg-white',
        contrastRatio: 3.8,
        wcagLevel: 'fail',
        severity: 'critical',
      },
      {
        component: 'SearchInput',
        file: 'src/components/forms/SearchInput.tsx',
        line: 34,
        element: 'input',
        textColor: 'text-gray-500',
        backgroundColor: 'bg-gray-50',
        contrastRatio: 4.1,
        wcagLevel: 'aa',
        severity: 'warning',
      },
      {
        component: 'Select',
        file: 'src/components/ui/Select.tsx',
        line: 56,
        element: 'select',
        textColor: 'text-gray-600',
        backgroundColor: 'bg-white',
        contrastRatio: 4.3,
        wcagLevel: 'aa',
        severity: 'warning',
      },
      {
        component: 'TextArea',
        file: 'src/components/ui/TextArea.tsx',
        line: 29,
        element: 'textarea',
        textColor: 'text-gray-700',
        backgroundColor: 'bg-gray-50',
        contrastRatio: 6.2,
        wcagLevel: 'aa',
        severity: 'info',
      },
    ],
  };

  const runAudit = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAuditResults(mockAuditResults);
    setIsLoading(false);
  };

  useEffect(() => {
    runAudit();
  }, []);

  const filteredIssues = auditResults?.issues.filter(issue => 
    selectedSeverity === 'all' || issue.severity === selectedSeverity
  ) || [];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getWcagBadgeColor = (wcagLevel: string) => {
    switch (wcagLevel) {
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'aa':
        return 'bg-yellow-100 text-yellow-800';
      case 'aaa':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Scanning form components for contrast issues...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Form Contrast Audit Report
          </h1>
          <p className="text-gray-600">
            Accessibility audit results for form components and text contrast ratios
          </p>
        </div>

        {auditResults && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Issues</p>
                    <p className="text-2xl font-bold text-gray-900">{auditResults.totalIssues}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Critical</p>
                    <p className="text-2xl font-bold text-red-600">{auditResults.criticalIssues}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Warning</p>
                    <p className="text-2xl font-bold text-yellow-600">{auditResults.warningIssues}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Files Scanned</p>
                    <p className="text-2xl font-bold text-green-600">{auditResults.scannedFiles.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow mb-8 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Filter Issues</h2>
                <div className="flex gap-2">
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                  <button
                    onClick={runAudit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Re-scan
                  </button>
                </div>
              </div>
            </div>

            {/* Issues Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Contrast Issues ({filteredIssues.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Component
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Element
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Colors
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contrast Ratio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        WCAG Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredIssues.map((issue, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {issue.component}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="px-2 py-1 text-xs bg-gray-100 rounded">
                            {issue.element}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {issue.textColor}
                            </code>
                            <span className="text-gray-400">on</span>
                            <code className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                              {issue.backgroundColor}
                            </code>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {issue.contrastRatio}:1
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getWcagBadgeColor(issue.wcagLevel)}`}>
                            {issue.wcagLevel.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(issue.severity)}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityBadgeColor(issue.severity)}`}>
                              {issue.severity}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">{issue.file}</div>
                            <div className="text-gray-500">Line {issue.line}</div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scanned Files */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Scanned Files</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {auditResults.scannedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{file}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Recommendations</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Replace text-gray-300 and text-gray-400 with darker variants like text-gray-600 or text-gray-700</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Use bg-blue-600 or bg-blue-700 instead of bg-blue-400 for better contrast with white text</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Consider using text-gray-900 for labels to ensure maximum readability</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Test color combinations with online contrast checkers to ensure WCAG AA compliance (4.5:1 minimum)</span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContrastAuditPage;