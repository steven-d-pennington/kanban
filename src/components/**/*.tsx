import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Search, FileText } from 'lucide-react';

interface ContrastIssue {
  component: string;
  file: string;
  line: number;
  textColor: string;
  backgroundColor: string;
  contrastRatio: number;
  wcagLevel: 'Pass' | 'AA' | 'AAA' | 'Fail';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ContrastAuditStats {
  total: number;
  passing: number;
  failing: number;
  critical: number;
}

const ContrastAuditReport: React.FC = () => {
  const [auditResults, setAuditResults] = useState<ContrastIssue[]>([]);
  const [stats, setStats] = useState<ContrastAuditStats>({
    total: 0,
    passing: 0,
    failing: 0,
    critical: 0,
  });
  const [filter, setFilter] = useState<'all' | 'failing' | 'critical'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Mock audit data - in real implementation, this would scan actual files
  const mockAuditData: ContrastIssue[] = [
    {
      component: 'Input',
      file: 'src/components/ui/input.tsx',
      line: 15,
      textColor: 'text-gray-300',
      backgroundColor: 'bg-white',
      contrastRatio: 2.8,
      wcagLevel: 'Fail',
      severity: 'high',
    },
    {
      component: 'Button',
      file: 'src/components/ui/button.tsx',
      line: 23,
      textColor: 'text-white',
      backgroundColor: 'bg-blue-400',
      contrastRatio: 3.2,
      wcagLevel: 'AA',
      severity: 'medium',
    },
    {
      component: 'Label',
      file: 'src/components/forms/form-label.tsx',
      line: 8,
      textColor: 'text-gray-400',
      backgroundColor: 'bg-gray-50',
      contrastRatio: 2.1,
      wcagLevel: 'Fail',
      severity: 'critical',
    },
    {
      component: 'Select',
      file: 'src/components/ui/select.tsx',
      line: 31,
      textColor: 'text-gray-500',
      backgroundColor: 'bg-white',
      contrastRatio: 3.8,
      wcagLevel: 'AA',
      severity: 'low',
    },
    {
      component: 'Textarea',
      file: 'src/components/ui/textarea.tsx',
      line: 12,
      textColor: 'text-gray-300',
      backgroundColor: 'bg-gray-100',
      contrastRatio: 1.9,
      wcagLevel: 'Fail',
      severity: 'critical',
    },
    {
      component: 'FormControl',
      file: 'src/components/forms/form-control.tsx',
      line: 45,
      textColor: 'text-white',
      backgroundColor: 'bg-indigo-600',
      contrastRatio: 4.8,
      wcagLevel: 'AAA',
      severity: 'low',
    },
    {
      component: 'ErrorMessage',
      file: 'src/components/forms/error-message.tsx',
      line: 6,
      textColor: 'text-red-300',
      backgroundColor: 'bg-red-50',
      contrastRatio: 2.6,
      wcagLevel: 'Fail',
      severity: 'high',
    },
    {
      component: 'Checkbox',
      file: 'src/components/ui/checkbox.tsx',
      line: 18,
      textColor: 'text-gray-400',
      backgroundColor: 'bg-white',
      contrastRatio: 3.1,
      wcagLevel: 'AA',
      severity: 'medium',
    },
  ];

  useEffect(() => {
    // Simulate loading audit results
    const timer = setTimeout(() => {
      setAuditResults(mockAuditData);
      
      const newStats = mockAuditData.reduce(
        (acc, issue) => {
          acc.total += 1;
          if (issue.wcagLevel === 'Pass' || issue.wcagLevel === 'AA' || issue.wcagLevel === 'AAA') {
            acc.passing += 1;
          } else {
            acc.failing += 1;
          }
          if (issue.severity === 'critical') {
            acc.critical += 1;
          }
          return acc;
        },
        { total: 0, passing: 0, failing: 0, critical: 0 }
      );
      
      setStats(newStats);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWcagBadgeColor = (wcagLevel: string) => {
    switch (wcagLevel) {
      case 'AAA':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'AA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pass':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Fail':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredResults = auditResults.filter((issue) => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'failing' && issue.wcagLevel === 'Fail') ||
      (filter === 'critical' && issue.severity === 'critical');
    
    const matchesSearch = 
      searchTerm === '' ||
      issue.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.file.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Scanning form components for contrast issues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Form Components Contrast Audit
            </h1>
          </div>
          <p className="text-gray-600">
            Comprehensive analysis of color contrast compliance across form components
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Components</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Passing</p>
                <p className="text-3xl font-bold text-green-600">{stats.passing}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failing</p>
                <p className="text-3xl font-bold text-red-600">{stats.failing}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                <p className="text-3xl font-bold text-orange-600">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Issues
              </button>
              <button
                onClick={() => setFilter('failing')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'failing'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Failing Only
              </button>
              <button
                onClick={() => setFilter('critical')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'critical'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Critical Only
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Component
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Location
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.map((issue, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getSeverityIcon(issue.severity)}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {issue.component}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{issue.file}</div>
                      <div className="text-sm text-gray-500">Line {issue.line}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Text:</span>
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {issue.textColor}
                          </code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">BG:</span>
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {issue.backgroundColor}
                          </code>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">
                        {issue.contrastRatio}:1
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getWcagBadgeColor(
                          issue.wcagLevel
                        )}`}
                      >
                        {issue.wcagLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getSeverityBadgeColor(
                          issue.severity
                        )}`}
                      >
                        {issue.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredResults.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No issues found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Accessibility Recommendations
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900">Critical Issues</h3>
                <p className="text-gray-600 text-sm">
                  Address contrast ratios below 3:1 immediately. These severely impact readability
                  for users with visual impairments.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900">WCAG AA Compliance</h3>
                <p className="text-gray-600 text-sm">
                  Aim for a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text
                  to meet WCAG AA standards.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900">Testing Tools</h3>
                <p className="text-gray-600 text-sm">
                  Use browser developer tools or dedicated contrast checkers to validate fixes
                  before deployment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContrastAuditReport;