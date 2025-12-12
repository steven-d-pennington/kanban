import { Bot, User, ArrowRight, FileText, ListChecks, Code, CheckCircle } from 'lucide-react';

export function AgentWorkflowDiagram() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Agent Workflow Pipeline</h3>

      <div className="flex items-start justify-between gap-4">
        {/* Step 1: Human Input */}
        <div className="flex-1 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-3">
            <User className="w-8 h-8 text-white" />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">Human</h4>
          <p className="text-sm text-gray-500">Creates feature specs, project ideas, and bug reports</p>
          <div className="mt-3 space-y-1">
            <span className="inline-block text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">Project Spec</span>
            <span className="inline-block text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded ml-1">Feature</span>
            <span className="inline-block text-xs px-2 py-1 bg-red-100 text-red-700 rounded ml-1">Bug</span>
          </div>
        </div>

        <ArrowRight className="w-6 h-6 text-gray-500 mt-6 flex-shrink-0" />

        {/* Step 2: PM Agent */}
        <div className="flex-1 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">PM Agent</h4>
          <p className="text-sm text-gray-500">Analyzes specs and generates detailed PRDs</p>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
              <FileText className="w-3 h-3" /> PRD
            </span>
          </div>
        </div>

        <ArrowRight className="w-6 h-6 text-gray-500 mt-6 flex-shrink-0" />

        {/* Step 3: Scrum Master Agent */}
        <div className="flex-1 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mb-3">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">SM Agent</h4>
          <p className="text-sm text-gray-500">Breaks down PRDs into actionable user stories</p>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
              <ListChecks className="w-3 h-3" /> Stories
            </span>
          </div>
        </div>

        <ArrowRight className="w-6 h-6 text-gray-500 mt-6 flex-shrink-0" />

        {/* Step 4: Developer Agent */}
        <div className="flex-1 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mb-3">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">Dev Agent</h4>
          <p className="text-sm text-gray-500">Implements stories and creates pull requests</p>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
              <Code className="w-3 h-3" /> Code
            </span>
          </div>
        </div>

        <ArrowRight className="w-6 h-6 text-gray-500 mt-6 flex-shrink-0" />

        {/* Step 5: Complete */}
        <div className="flex-1 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-3">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">Done</h4>
          <p className="text-sm text-gray-500">Feature shipped, bug fixed, or task completed</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full" />
            <span className="text-gray-600">Human Input</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full" />
            <span className="text-gray-600">Agent Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-600">Currently Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
