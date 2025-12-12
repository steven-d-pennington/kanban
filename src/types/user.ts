export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
}

import { create } from 'zustand';

interface UserStore {
  users: User[];
  currentUser: User | null;
  fetchUsers: () => Promise<void>;
  getActiveUsers: () => User[];
  getCurrentUser: () => User | null;
  setCurrentUser: (user: User) => void;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isActive: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    isActive: true,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isActive: false,
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    isActive: true,
  },
  {
    id: '5',
    name: 'David Brown',
    email: 'david.brown@example.com',
    isActive: true,
  },
  {
    id: '6',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    isActive: false,
  },
  {
    id: '7',
    name: 'Alex Thompson',
    email: 'alex.thompson@example.com',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    isActive: true,
  },
  {
    id: '8',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    isActive: true,
  },
];

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  currentUser: null,

  fetchUsers: async () => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    set({ users: mockUsers });
    
    // Set first active user as current user if none is set
    const state = get();
    if (!state.currentUser) {
      const firstActiveUser = mockUsers.find(user => user.isActive);
      if (firstActiveUser) {
        set({ currentUser: firstActiveUser });
      }
    }
  },

  getActiveUsers: () => {
    const { users } = get();
    return users.filter(user => user.isActive);
  },

  getCurrentUser: () => {
    const { currentUser } = get();
    return currentUser;
  },

  setCurrentUser: (user: User) => {
    set({ currentUser: user });
  },
}));