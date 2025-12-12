import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
  isActive?: boolean;
}

interface SidebarProps {
  navigationItems: NavigationItem[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  variant?: 'light' | 'dark';
  className?: string;
}

interface NavigationItemProps {
  item: NavigationItem;
  level: number;
  variant: 'light' | 'dark';
  isCollapsed: boolean;
  onItemClick?: (item: NavigationItem) => void;
}

const NavigationItemComponent: React.FC<NavigationItemProps> = ({
  item,
  level,
  variant,
  isCollapsed,
  onItemClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const baseClasses = 'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const lightVariantClasses = {
    default: 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:ring-blue-500',
    active: 'text-blue-700 bg-blue-50 hover:bg-blue-100',
  };

  const darkVariantClasses = {
    default: 'text-gray-300 hover:text-white hover:bg-gray-700 focus:ring-blue-400',
    active: 'text-blue-300 bg-gray-800 hover:bg-gray-700',
  };

  const getItemClasses = (isActive: boolean) => {
    const variantClasses = variant === 'light' ? lightVariantClasses : darkVariantClasses;
    return `${baseClasses} ${isActive ? variantClasses.active : variantClasses.default}`;
  };

  const handleItemClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onItemClick?.(item);
  };

  const paddingLeft = isCollapsed ? 'pl-3' : `pl-${3 + level * 3}`;

  return (
    <li>
      <button
        type="button"
        className={`${getItemClasses(item.isActive || false)} ${paddingLeft}`}
        onClick={handleItemClick}
        title={isCollapsed ? item.label : undefined}
      >
        {item.icon && (
          <item.icon 
            className={`flex-shrink-0 w-5 h-5 ${isCollapsed ? '' : 'mr-3'} ${
              variant === 'light' 
                ? item.isActive ? 'text-blue-600' : 'text-gray-500'
                : item.isActive ? 'text-blue-400' : 'text-gray-400'
            }`}
          />
        )}
        
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {hasChildren && (
              <span className="flex-shrink-0 ml-2">
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </span>
            )}
          </>
        )}
      </button>

      {hasChildren && isExpanded && !isCollapsed && (
        <ul className="mt-1 space-y-1">
          {item.children?.map((child) => (
            <NavigationItemComponent
              key={child.id}
              item={child}
              level={level + 1}
              variant={variant}
              isCollapsed={isCollapsed}
              onItemClick={onItemClick}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  navigationItems,
  isCollapsed = false,
  onToggleCollapse,
  variant = 'light',
  className = '',
}) => {
  const handleItemClick = (item: NavigationItem) => {
    if (item.href && !item.children) {
      // Handle navigation
      console.log(`Navigating to: ${item.href}`);
    }
  };

  const sidebarClasses = `
    flex flex-col h-full transition-all duration-300 ease-in-out
    ${isCollapsed ? 'w-16' : 'w-64'}
    ${variant === 'light' 
      ? 'bg-white border-r border-gray-200 shadow-sm' 
      : 'bg-gray-900 border-r border-gray-700'
    }
    ${className}
  `;

  const headerClasses = `
    flex items-center justify-between px-4 py-4 border-b
    ${variant === 'light' 
      ? 'border-gray-200' 
      : 'border-gray-700'
    }
  `;

  const logoClasses = `
    font-bold text-lg truncate
    ${variant === 'light' ? 'text-gray-900' : 'text-white'}
  `;

  const toggleButtonClasses = `
    p-1 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    ${variant === 'light'
      ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:ring-blue-500'
      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800 focus:ring-blue-400'
    }
  `;

  return (
    <aside className={sidebarClasses} role="navigation" aria-label="Main navigation">
      <div className={headerClasses}>
        {!isCollapsed && (
          <h2 className={logoClasses}>
            Navigation
          </h2>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            className={toggleButtonClasses}
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronRightIcon 
              className={`w-5 h-5 transition-transform duration-200 ${
                isCollapsed ? 'rotate-0' : 'rotate-180'
              }`} 
            />
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <NavigationItemComponent
              key={item.id}
              item={item}
              level={0}
              variant={variant}
              isCollapsed={isCollapsed}
              onItemClick={handleItemClick}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;