import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
}

interface UserStore {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  getActiveUsers: () => User[];
  getCurrentUser: () => User | null;
  setCurrentUser: (userId: string) => void;
  clearCurrentUser: () => void;
}

// Mock data
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
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b8f9?w=150&h=150&fit=crop&crop=face',
    isActive: true,
  },
  {
    id: '3',
    name: 'Michael Johnson',
    email: 'michael.johnson@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isActive: false,
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    isActive: true,
  },
  {
    id: '5',
    name: 'David Wilson',
    email: 'david.wilson@example.com',
    isActive: true,
  },
  {
    id: '6',
    name: 'Sarah Brown',
    email: 'sarah.brown@example.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    isActive: false,
  },
  {
    id: '7',
    name: 'Chris Anderson',
    email: 'chris.anderson@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    isActive: true,
  },
  {
    id: '8',
    name: 'Lisa Garcia',
    email: 'lisa.garcia@example.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    isActive: true,
  },
];

export const useUserStore = create<UserStore>()(
  devtools(
    (set, get) => ({
      users: [],
      currentUser: null,
      isLoading: false,
      error: null,

      fetchUsers: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set({ 
            users: mockUsers,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch users',
            isLoading: false,
          });
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

      setCurrentUser: (userId: string) => {
        const { users } = get();
        const user = users.find(u => u.id === userId);
        
        if (user) {
          set({ currentUser: user });
        } else {
          set({ error: 'User not found' });
        }
      },

      clearCurrentUser: () => {
        set({ currentUser: null });
      },
    }),
    {
      name: 'user-store',
    }
  )
);