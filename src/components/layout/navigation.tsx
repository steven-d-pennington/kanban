import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

interface NavigationProps {
  items: NavItem[];
  variant?: 'light' | 'dark';
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({
  items,
  variant = 'light',
  className = '',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href;

  const baseClasses = variant === 'light' 
    ? 'bg-white text-gray-900 shadow-sm border-gray-200' 
    : 'bg-gray-900 text-white shadow-lg border-gray-700';

  const linkClasses = variant === 'light'
    ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:text-gray-900 focus:bg-gray-100'
    : 'text-gray-300 hover:text-white hover:bg-gray-800 focus:text-white focus:bg-gray-800';

  const activeLinkClasses = variant === 'light'
    ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
    : 'text-blue-400 bg-gray-800 border-b-2 border-blue-400';

  const dropdownClasses = variant === 'light'
    ? 'bg-white shadow-lg border border-gray-200 text-gray-900'
    : 'bg-gray-800 shadow-lg border border-gray-700 text-white';

  const dropdownItemClasses = variant === 'light'
    ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:text-gray-900 focus:bg-gray-100'
    : 'text-gray-300 hover:text-white hover:bg-gray-700 focus:text-white focus:bg-gray-700';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setOpenDropdown(null);
  };

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const renderNavItem = (item: NavItem, isMobile = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.href);

    if (hasChildren) {
      return (
        <div key={item.label} className="relative">
          <button
            onClick={() => handleDropdownToggle(item.label)}
            className={`
              flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              ${isItemActive ? activeLinkClasses : linkClasses}
              ${isMobile ? 'w-full justify-between' : ''}
            `}
            aria-expanded={openDropdown === item.label}
            aria-haspopup="true"
          >
            <span>{item.label}</span>
            <ChevronDown 
              className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                openDropdown === item.label ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openDropdown === item.label && (
            <div 
              className={`
                ${isMobile 
                  ? 'mt-2 ml-4 space-y-1' 
                  : 'absolute left-0 z-50 mt-2 w-48 rounded-md'
                }
                ${!isMobile ? dropdownClasses : ''}
              `}
            >
              {!isMobile && <div className="py-1" role="menu">}
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    to={child.href}
                    className={`
                      ${isMobile 
                        ? `block px-4 py-2 text-sm rounded-md transition-colors duration-200 ${
                            isActive(child.href) ? activeLinkClasses : linkClasses
                          }`
                        : `block px-4 py-2 text-sm transition-colors duration-200 ${
                            isActive(child.href) 
                              ? variant === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-gray-700 text-blue-400'
                              : dropdownItemClasses
                          }`
                      }
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    `}
                    role="menuitem"
                    onClick={() => isMobile && setIsMobileMenuOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              {!isMobile && </div>}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        className={`
          block px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${isItemActive ? activeLinkClasses : linkClasses}
        `}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav 
      className={`${baseClasses} border-b ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:space-x-8">
            {items.map((item) => renderNavItem(item))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className={`
                inline-flex items-center justify-center p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${linkClasses}
              `}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden py-4 space-y-2 border-t border-gray-200"
            role="menu"
          >
            {items.map((item) => renderNavItem(item, true))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;