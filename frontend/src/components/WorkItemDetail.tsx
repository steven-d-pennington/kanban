import { useState, useEffect } from 'react';
import { useKanbanStore } from '../store/kanbanStore';
import { ITEM_TYPE_CONFIG, PRIORITY_CONFIG, AGENT_CONFIG, COLUMNS } from '../types';
import type { Status } from '../types';
import {
  X,
  Bot,
  User,
  Calendar,
  Clock,
  MessageSquare,
  Activity,
  GitBranch,
  ExternalLink,
  Edit2,
  Trash2,
} from 'lucide-react';
import { WorkItemForm, type WorkItemFormData } from './forms/WorkItemForm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { toast } from './Toast';
import { ActivityFeed } from './ActivityFeed';

export function WorkItemDetail() {
  const {
    selectedWorkItem,
    setSelectedWorkItem,
    moveWorkItem,
    updateWorkItem,
    deleteWorkItem,
    comments,
    fetchComments,
    addComment
  } = useKanbanStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (selectedWorkItem) {
      fetchComments(selectedWorkItem.id);
    }
  }, [selectedWorkItem, fetchComments]);

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

  const handleEdit = async (data: WorkItemFormData) => {
    setIsSubmitting(true);
    try {
      updateWorkItem(selectedWorkItem.id, {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        storyPoints: data.storyPoints,
        dueDate: data.dueDate,
        labels: data.labels,
      });
      setIsEditing(false);
      toast.success('Work item updated successfully');
    } catch {
      toast.error('Failed to update work item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      deleteWorkItem(selectedWorkItem.id);
      setIsDeleteDialogOpen(false);
      toast.success('Work item deleted successfully');
    } catch {
      toast.error('Failed to delete work item');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment(selectedWorkItem.id, commentText);
      setCommentText('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  // Edit Mode View
  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
        <div className="bg-white h-full w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Edit2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Edit Work Item</h2>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            <WorkItemForm
              initialData={selectedWorkItem}
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
              isEdit={true}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    );
  }

  // View Mode
  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
        <div className="bg-white h-full w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-in">
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${typeConfig.bgColor} ${typeConfig.color}`}
                >
                  {typeConfig.label}
                </span>
                <span className={`text-sm font-bold ${priorityConfig.color}`}>
                  {priorityConfig.label}
                </span>
                {selectedWorkItem.storyPoints && (
                  <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded">
                    {selectedWorkItem.storyPoints} pts
                  </span>
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{selectedWorkItem.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit work item"
              >
                <Edit2 className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete work item"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
              <button
                onClick={() => setSelectedWorkItem(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Status and Assignment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedWorkItem.status}
                    onChange={(e) => {
                      moveWorkItem(selectedWorkItem.id, e.target.value as Status);
                      toast.info(`Moved to ${e.target.value.replace('_', ' ')}`);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To
                  </label>
                  <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                    {selectedWorkItem.assignedAgent ? (
                      <>
                        <Bot
                          className={`w-4 h-4 ${AGENT_CONFIG[selectedWorkItem.assignedAgent].color}`}
                        />
                        <span className="font-medium">
                          {AGENT_CONFIG[selectedWorkItem.assignedAgent].label}
                        </span>
                      </>
                    ) : selectedWorkItem.assignedTo ? (
                      <>
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Human User</span>
                      </>
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-900">
                  <p className="whitespace-pre-wrap">
                    {selectedWorkItem.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Labels */}
              {selectedWorkItem.labels.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkItem.labels.map((label) => (
                      <span
                        key={label}
                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Date */}
              {selectedWorkItem.dueDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{formatDate(selectedWorkItem.dueDate)}</span>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>Created: {formatDate(selectedWorkItem.createdAt)}</span>
                </div>
                {selectedWorkItem.startedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-500" />
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
                    {AGENT_CONFIG[selectedWorkItem.assignedAgent].label} is currently processing
                    this item.
                    {selectedWorkItem.type === 'feature' &&
                      ' Generating PRD based on feature specifications...'}
                    {selectedWorkItem.type === 'prd' && ' Breaking down PRD into user stories...'}
                    {selectedWorkItem.type === 'story' && ' Implementing code changes...'}
                  </p>
                  <div className="mt-3 h-2 bg-violet-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full animate-progress"
                      style={{ width: '65%' }}
                    />
                  </div>
                </div>
              )}
              {/* Artifacts Section */}
              {!!selectedWorkItem.metadata?.implementation_plan && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Implementation Plan</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 font-mono text-sm overflow-x-auto whitespace-pre-wrap text-gray-900">
                    {JSON.stringify(selectedWorkItem.metadata.implementation_plan, null, 2)}
                  </div>
                </div>
              )}

              {!!selectedWorkItem.metadata?.prd && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">PRD / Requirements</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 font-mono text-sm overflow-x-auto whitespace-pre-wrap text-gray-900">
                    {JSON.stringify(selectedWorkItem.metadata.prd, null, 2)}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">Comments</h3>
                  <span className="text-sm text-gray-600">({comments.length})</span>
                </div>

                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${comment.authorAgent
                          ? 'bg-gradient-to-br from-violet-500 to-indigo-500'
                          : 'bg-gradient-to-br from-green-400 to-emerald-500'
                          }`}
                      >
                        {comment.authorAgent ? (
                          <Bot className="w-4 h-4 text-white" />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {comment.authorAgent ? AGENT_CONFIG[comment.authorAgent].label : 'User'}
                          </span>
                          {comment.authorAgent && (
                            <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded">
                              Agent
                            </span>
                          )}
                          <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
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
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleAddComment}
                        disabled={!commentText.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm rounded-lg transition-colors">
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">Activity Log</h3>
                </div>

                <div className="space-y-3">
                  <ActivityFeed workItemId={selectedWorkItem.id} compact />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Work Item"
        message="Are you sure you want to delete this work item? All associated data will be permanently removed."
        itemName={selectedWorkItem.title}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        isDeleting={isDeleting}
      />
    </>
  );
}
