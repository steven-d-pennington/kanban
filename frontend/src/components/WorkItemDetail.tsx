import { useKanbanStore } from '../store/kanbanStore';
import { ITEM_TYPE_CONFIG, PRIORITY_CONFIG, AGENT_CONFIG, COLUMNS } from '../types';
import type { Status } from '../types';
import { X, Bot, User, Calendar, Clock, MessageSquare, Activity, GitBranch, ExternalLink } from 'lucide-react';

export function WorkItemDetail() {
  const { selectedWorkItem, setSelectedWorkItem, moveWorkItem } = useKanbanStore();

  if (!selectedWorkItem) return null;

  const typeConfig = ITEM_TYPE_CONFIG[selectedWorkItem.type];
  const priorityConfig = PRIORITY_CONFIG[selectedWorkItem.priority];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const mockComments = [
    {
      id: '1',
      author: 'PM Agent',
      isAgent: true,
      content: 'Claimed this item for PRD generation. Analyzing requirements...',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      author: 'John Doe',
      isAgent: false,
      content: 'Please prioritize the OAuth integration with Google as the primary provider.',
      timestamp: '1 hour ago',
    },
    {
      id: '3',
      author: 'PM Agent',
      isAgent: true,
      content: 'PRD generation complete. Created comprehensive requirements document with acceptance criteria.',
      timestamp: '30 min ago',
    },
  ];

  const mockActivityLog = [
    { action: 'Created', actor: 'John Doe', timestamp: '3 days ago' },
    { action: 'Moved to Ready', actor: 'John Doe', timestamp: '2 days ago' },
    { action: 'Claimed by PM Agent', actor: 'pm-agent-001', timestamp: '2 hours ago' },
    { action: 'Processing started', actor: 'pm-agent-001', timestamp: '2 hours ago' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
      <div className="bg-white h-full w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2 py-1 rounded ${typeConfig.bgColor} ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
              <span className={`text-sm font-bold ${priorityConfig.color}`}>{priorityConfig.label}</span>
              {selectedWorkItem.storyPoints && (
                <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded">
                  {selectedWorkItem.storyPoints} pts
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{selectedWorkItem.title}</h2>
          </div>
          <button
            onClick={() => setSelectedWorkItem(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Status and Assignment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Status</label>
                <select
                  value={selectedWorkItem.status}
                  onChange={(e) => moveWorkItem(selectedWorkItem.id, e.target.value as Status)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COLUMNS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Assigned To</label>
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  {selectedWorkItem.assignedAgent ? (
                    <>
                      <Bot className={`w-4 h-4 ${AGENT_CONFIG[selectedWorkItem.assignedAgent].color}`} />
                      <span className="font-medium">{AGENT_CONFIG[selectedWorkItem.assignedAgent].label}</span>
                    </>
                  ) : selectedWorkItem.assignedTo ? (
                    <>
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Human User</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
              <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="whitespace-pre-wrap">{selectedWorkItem.description}</p>
              </div>
            </div>

            {/* Labels */}
            {selectedWorkItem.labels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Labels</label>
                <div className="flex flex-wrap gap-2">
                  {selectedWorkItem.labels.map((label) => (
                    <span key={label} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Created: {formatDate(selectedWorkItem.createdAt)}</span>
              </div>
              {selectedWorkItem.startedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Started: {formatDate(selectedWorkItem.startedAt)}</span>
                </div>
              )}
              {typeof selectedWorkItem.metadata?.prNumber === 'number' && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <GitBranch className="w-4 h-4" />
                  <a href="#" className="hover:underline flex items-center gap-1">
                    PR #{selectedWorkItem.metadata.prNumber}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Agent Processing Status */}
            {selectedWorkItem.assignedAgent && selectedWorkItem.status === 'in_progress' && (
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <h4 className="font-medium text-violet-900">Agent Processing</h4>
                </div>
                <p className="text-sm text-violet-700">
                  {AGENT_CONFIG[selectedWorkItem.assignedAgent].label} is currently processing this item.
                  {selectedWorkItem.type === 'feature' && ' Generating PRD based on feature specifications...'}
                  {selectedWorkItem.type === 'prd' && ' Breaking down PRD into user stories...'}
                  {selectedWorkItem.type === 'story' && ' Implementing code changes...'}
                </p>
                <div className="mt-3 h-2 bg-violet-200 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full animate-progress" style={{ width: '65%' }} />
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <h3 className="font-medium text-gray-900">Comments</h3>
                <span className="text-sm text-gray-500">({mockComments.length})</span>
              </div>

              <div className="space-y-4">
                {mockComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        comment.isAgent
                          ? 'bg-gradient-to-br from-violet-500 to-indigo-500'
                          : 'bg-gradient-to-br from-green-400 to-emerald-500'
                      }`}
                    >
                      {comment.isAgent ? (
                        <Bot className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{comment.author}</span>
                        {comment.isAgent && (
                          <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded">Agent</span>
                        )}
                        <span className="text-sm text-gray-400">{comment.timestamp}</span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="mt-4 flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <textarea
                    placeholder="Add a comment..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="mt-2 flex justify-end">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-gray-400" />
                <h3 className="font-medium text-gray-900">Activity Log</h3>
              </div>

              <div className="space-y-3">
                {mockActivityLog.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                    <span className="text-gray-900">{activity.action}</span>
                    <span className="text-gray-500">by {activity.actor}</span>
                    <span className="text-gray-400">{activity.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
