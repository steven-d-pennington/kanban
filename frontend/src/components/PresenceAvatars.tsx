import { usePresence, type PresenceUser } from '../hooks/usePresence';
import { useKanbanStore } from '../store/kanbanStore';
import { Users } from 'lucide-react';

function getInitials(name: string | undefined, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string): string {
  const colors = [
    'from-violet-400 to-purple-500',
    'from-blue-400 to-indigo-500',
    'from-green-400 to-emerald-500',
    'from-yellow-400 to-orange-500',
    'from-pink-400 to-rose-500',
    'from-cyan-400 to-teal-500',
  ];
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

interface AvatarProps {
  user: PresenceUser;
  size?: 'sm' | 'md';
}

function Avatar({ user, size = 'md' }: AvatarProps) {
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
  const gradientColor = getAvatarColor(user.odoo_id);

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-br ${gradientColor} flex items-center justify-center text-white font-medium ring-2 ring-white`}
      title={`${user.name || user.email} - Online`}
    >
      {getInitials(user.name, user.email)}
    </div>
  );
}

export function PresenceAvatars() {
  const { currentProjectId } = useKanbanStore();
  const users = usePresence(currentProjectId);

  if (users.length === 0) {
    return null;
  }

  const displayUsers = users.slice(0, 4);
  const remainingCount = users.length - 4;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center text-gray-500">
        <Users className="w-4 h-4 mr-1" />
        <span className="text-xs font-medium">{users.length} online</span>
      </div>
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <Avatar key={user.odoo_id} user={user} />
        ))}
        {remainingCount > 0 && (
          <div
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 ring-2 ring-white"
            title={`${remainingCount} more users online`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}
