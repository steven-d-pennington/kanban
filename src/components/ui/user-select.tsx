import React, { Fragment, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface UserSelectProps {
  users: User[];
  value: User | null;
  onChange: (user: User | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * UserSelect component with search functionality, avatar display, and keyboard navigation
 * Built with Headless UI for accessibility
 */
export const UserSelect: React.FC<UserSelectProps> = ({
  users,
  value,
  onChange,
  placeholder = 'Select a user...',
  className = '',
  disabled = false,
}) => {
  const [query, setQuery] = useState('');

  const filteredUsers =
    query === ''
      ? users
      : users.filter((user) =>
          user.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.toLowerCase().replace(/\s+/g, ''))
        );

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`w-full ${className}`}>
      <Combobox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 disabled:bg-gray-100 disabled:text-gray-500"
              displayValue={(user: User | null) => user?.name || ''}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
              {filteredUsers.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                  No users found.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Combobox.Option
                    key={user.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-teal-600 text-white' : 'text-gray-900'
                      }`
                    }
                    value={user}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            {user.avatar ? (
                              <img
                                className="h-6 w-6 rounded-full"
                                src={user.avatar}
                                alt={user.name}
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-700">
                                  {getInitials(user.name)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <span
                              className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              {user.name}
                            </span>
                            {user.email && (
                              <span
                                className={`block text-sm truncate ${
                                  active ? 'text-teal-200' : 'text-gray-500'
                                }`}
                              >
                                {user.email}
                              </span>
                            )}
                          </div>
                        </div>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-teal-600'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
};