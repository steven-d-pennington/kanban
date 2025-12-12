import { useState, useEffect } from 'react';
import { useKanbanStore } from '../store/kanbanStore';
import { X, Settings, Trash2, Archive, RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from './Toast';

export function ProjectSettingsModal() {
  const {
    isProjectSettingsOpen,
    setProjectSettingsOpen,
    projects,
    currentProjectId,
    updateProject,
    deleteProject,
  } = useKanbanStore();

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (currentProject) {
      setName(currentProject.name);
      setDescription(currentProject.description);
    }
  }, [currentProject]);

  if (!isProjectSettingsOpen || !currentProject) return null;

  const handleClose = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
    setProjectSettingsOpen(false);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    updateProject(currentProject.id, {
      name: name.trim(),
      description: description.trim(),
    });

    toast.success('Project settings updated');
    handleClose();
  };

  const handleArchive = () => {
    const newStatus = currentProject.status === 'archived' ? 'active' : 'archived';
    updateProject(currentProject.id, { status: newStatus });
    toast.success(newStatus === 'archived' ? 'Project archived' : 'Project restored');
    handleClose();
  };

  const handleDelete = () => {
    if (deleteConfirmText !== currentProject.name) {
      toast.error('Please type the project name to confirm deletion');
      return;
    }

    deleteProject(currentProject.id);
    toast.success('Project deleted');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Project Settings</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* General Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              General
            </h3>
            <div>
              <label htmlFor="settings-name" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label htmlFor="settings-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="settings-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow resize-none"
              />
            </div>
          </div>

          {/* Archive Section */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Archive
            </h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  {currentProject.status === 'archived' ? 'Restore Project' : 'Archive Project'}
                </p>
                <p className="text-sm text-gray-500">
                  {currentProject.status === 'archived'
                    ? 'Restore this project to make it active again'
                    : 'Archive this project to hide it from the active list'}
                </p>
              </div>
              <button
                onClick={handleArchive}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                  currentProject.status === 'archived'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                {currentProject.status === 'archived' ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Restore
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    Archive
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider">
              Danger Zone
            </h3>
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-red-900">Delete Project</p>
                  <p className="text-sm text-red-600">
                    Permanently delete this project and all its work items
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            ) : (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Are you absolutely sure?</p>
                    <p className="text-sm text-red-600 mt-1">
                      This action cannot be undone. This will permanently delete the project
                      <strong className="font-semibold"> {currentProject.name}</strong> and all associated work items.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    Type <strong>{currentProject.name}</strong> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type project name here"
                    className="w-full px-4 py-2 border border-red-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirmText !== currentProject.name}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    I understand, delete this project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
