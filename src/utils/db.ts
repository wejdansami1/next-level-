import { StoredUserData } from './types';

let users: Record<string, StoredUserData> = {};

try {
  // In Next.js, we can't directly use fs, so we'll use a memory store
  // In production, you'd want to use a real database
  const data = localStorage.getItem('users');
  if (data) {
    users = JSON.parse(data);
  }
} catch (error) {
  console.error('Error loading users:', error);
}

export const db = {
  saveUser(userData: StoredUserData) {
    users[userData.userId] = userData;
    localStorage.setItem('users', JSON.stringify(users));
  },

  getUser(userId: string) {
    return users[userId] || null;
  },

  getAllUsers() {
    return users;
  },

  clearUser(userId: string) {
    delete users[userId];
    localStorage.setItem('users', JSON.stringify(users));
  }
};
