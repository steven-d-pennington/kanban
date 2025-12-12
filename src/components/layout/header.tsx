import React, { useState } from 'react';
import { Menu, X, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';

interface NavigationItem {
  label: string;
  href: string;
  isActive?: boolean;
  children?: NavigationItem[];
}

interface HeaderProps {
  variant?: 'light' | 'dark';
  logo?: React.ReactNode;
  navigation?: NavigationItem[];
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onMenuToggle?: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  variant = 'light',
  logo,
  navigation = [],
  user,
  onMenuToggle,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    onMenuToggle?.(newState);
  };

  const toggleDropdown = (label: string) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const baseClasses = cn(
    'sticky top-0 z-50 w-full border-b transition-colors duration-200',
    {
      'bg-white border-gray-200 text-gray-900': variant === 'light',
      'bg-gray-900 border-gray-800 text-white': variant === 'dark',
    }
  );

  const linkClasses = (isActive?: boolean, hasChildren?: boolean) => cn(
    'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    {
      // Light variant styles
      'text-gray-900 hover:bg-gray-100 focus:ring-blue-500 focus:ring-offset-white': variant === 'light' && !isActive,
      'bg-blue-50 text-blue-700 hover:bg-blue-100': variant === 'light' && isActive,
      
      // Dark variant styles
      'text-gray-300 hover:bg-gray-800 hover:text-white focus:ring-blue-400 focus:ring-offset-gray-900': variant === 'dark' && !isActive,
      'bg-gray-800 text-white hover:bg-gray-700': variant === 'dark' && isActive,
    },
    hasChildren && 'gap-1'
  );

  const mobileNavClasses = cn(
    'md:hidden border-t transition-colors duration-200',
    {
      'bg-white border-gray-200': variant === 'light',
      'bg-gray-900 border-gray-800': variant === 'dark',
    }
  );

  const dropdownClasses = cn(
    'absolute top-full left-0 mt-1 w-48 rounded-md shadow-lg border z-50 transition-colors duration-200',
    {
      'bg-white border-gray-200': variant === 'light',
      'bg-gray-800 border-gray-700': variant === 'dark',
    }
  );

  const dropdownItemClasses = cn(
    'block px-4 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset',
    {
      'text-gray-700 hover:bg-gray-100 focus:ring-blue-500': variant === 'light',
      'text-gray-300 hover:bg-gray-700 hover:text-white focus:ring-blue-400': variant === 'dark',
    }
  );

  const userMenuClasses = cn(
    'absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg border z-50 transition-colors duration-200',
    {
      'bg-white border-gray-200': variant === 'light',
      'bg-gray-800 border-gray-700': variant === 'dark',
    }
  );

  const renderNavigationItem = (item: NavigationItem, isMobile = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isDropdownOpen = activeDropdown === item.label;

    return (
      <div key={item.label} className="relative">
        {hasChildren ? (
          <button
            onClick={() => toggleDropdown(item.label)}
            className={linkClasses(item.isActive, hasChildren)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            {item.label}
            <ChevronDown 
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isDropdownOpen && 'rotate-180'
              )} 
            />
          </button>
        ) : (
          <a
            href={item.href}
            className={linkClasses(item.isActive)}
          >
            {item.label}
          </a>
        )}

        {hasChildren && isDropdownOpen && (
          <div className={dropdownClasses}>
            <div className="py-1">
              {item.children?.map((child) => (
                <a
                  key={child.label}
                  href={child.href}
                  className={dropdownItemClasses}
                >
                  {child.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className={baseClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logo || (
              <div className={cn(
                'text-xl font-bold',
                {
                  'text-gray-900': variant === 'light',
                  'text-white': variant === 'dark',
                }
              )}>
                Logo
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4">
            {navigation.map(renderNavigationItem)}
          </nav>

          {/* User Menu and Mobile Toggle */}
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className={cn(
                    'flex items-center space-x-3 p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
                    {
                      'hover:bg-gray-100 focus:ring-blue-500 focus:ring-offset-white': variant === 'light',
                      'hover:bg-gray-800 focus:ring-blue-400 focus:ring-offset-gray-900': variant === 'dark',
                    }
                  )}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  {user.avatar ? (
                    <img
                      className="w-8 h-8 rounded-full"
                      src={user.avatar}
                      alt={user.name}
                    />
                  ) : (
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      {
                        'bg-gray-200 text-gray-700': variant === 'light',
                        'bg-gray-700 text-gray-300': variant === 'dark',
                      }
                    )}>
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <span className={cn(
                    'hidden sm:block text-sm font-medium',
                    {
                      'text-gray-700': variant === 'light',
                      'text-gray-300': variant === 'dark',
                    }
                  )}>
                    {user.name}
                  </span>
                  <ChevronDown className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    isUserMenuOpen && 'rotate-180',
                    {
                      'text-gray-500': variant === 'light',
                      'text-gray-400': variant === 'dark',
                    }
                  )} />
                </button>

                {isUserMenuOpen && (
                  <div className={userMenuClasses}>
                    <div className="py-1">
                      <div className={cn(
                        'px-4 py-2 text-xs border-b',
                        {
                          'text-gray-500 border-gray-200': variant === 'light',
                          'text-gray-400 border-gray-700': variant === 'dark',
                        }
                      )}>
                        {user.email}
                      </div>
                      <a href="/profile" className={cn(dropdownItemClasses, 'flex items-center gap-2')}>
                        <User className="w-4 h-4" />
                        Profile
                      </a>
                      <a href="/settings" className={cn(dropdownItemClasses, 'flex items-center gap-2')}>
                        <Settings className="w-4 h-4" />
                        Settings
                      </a>
                      <button className={cn(dropdownItemClasses, 'w-full text-left flex items-center gap-2')}>
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className={cn(
                'md:hidden p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
                {
                  'hover:bg-gray-100 focus:ring-blue-500 focus:ring-offset-white text-gray-600': variant === 'light',
                  'hover:bg-gray-800 focus:ring-blue-400 focus:ring-offset-gray-900 text-gray-400': variant === 'dark',
                }
              )}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">
                {isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}
              </span>
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div id="mobile-menu" className={mobileNavClasses}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => renderNavigationItem(item, true))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;