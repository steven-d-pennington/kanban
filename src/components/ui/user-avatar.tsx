import React from 'react';
import { cn } from '../../lib/utils';

interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
};

/**
 * Generates a consistent background color based on a string hash
 */
const getBackgroundColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Extracts initials from a user's name
 */
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * UserAvatar component displays a user's avatar image or initials fallback
 * with a consistent color scheme based on the user's name hash.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  
  const initials = getInitials(user.name);
  const backgroundColor = getBackgroundColor(user.name);
  const hasAvatar = user.avatar && !imageError;
  
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };
  
  React.useEffect(() => {
    if (user.avatar) {
      setImageError(false);
      setImageLoaded(false);
    }
  }, [user.avatar]);
  
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full font-medium text-white overflow-hidden',
        sizeClasses[size],
        !hasAvatar && backgroundColor,
        className
      )}
      title={`${user.name} (${user.email})`}
    >
      {hasAvatar ? (
        <>
          <img
            src={user.avatar}
            alt={`${user.name}'s avatar`}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-200',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
          {!imageLoaded && (
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center',
                backgroundColor
              )}
            >
              {initials}
            </div>
          )}
        </>
      ) : (
        <span className="select-none">{initials}</span>
      )}
    </div>
  );
};

export default UserAvatar;