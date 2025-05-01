
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

// Define types
type User = {
  id: string;
  email: string;
  name: string;
  level?: number;
  xp?: number;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

// Creating the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Mock API calls - In a real app, these would connect to your backend
const mockLogin = async (email: string, password: string): Promise<User | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // For demo purposes, allow login with any credentials that match pattern
  if (email && password && password.length >= 6) {
    return {
      id: '1',
      email,
      name: email.split('@')[0],
      level: 1,
      xp: 0
    };
  }
  
  return null;
};

const mockSignup = async (name: string, email: string, password: string): Promise<User | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo purposes, allow signup with any valid looking credentials
  if (name && email && password && password.length >= 6) {
    return {
      id: '1',
      email,
      name,
      level: 1,
      xp: 0
    };
  }
  
  return null;
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const user = await mockLogin(email, password);
      
      if (user) {
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return true;
      } else {
        toast.error('Invalid email or password');
        return false;
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const user = await mockSignup(name, email, password);
      
      if (user) {
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return true;
      } else {
        toast.error('Signup failed. Please check your information.');
        return false;
      }
    } catch (error) {
      toast.error('Signup failed. Please try again.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
