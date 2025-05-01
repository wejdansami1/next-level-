import { Event, StudyTask, PriorityTask } from '@/contexts/EventContext';

export interface StoredUserData {
  userId: string;
  email: string;
  username: string;
  password: string;
  events: Event[];
  studyTasks: StudyTask[];
  priorityTasks: PriorityTask[];
}

export interface UserData extends Omit<StoredUserData, 'password'> {
  password?: string;
}

export class LocalStorageManager {
  private static readonly USERS_KEY = 'nextlevel_users';
  private static readonly CURRENT_USER_KEY = 'nextlevel_current_user';

  static saveUser(userData: StoredUserData): void {
    try {
      const users = this.getAllUsers();
      users[userData.userId] = userData;
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    } catch (err) {
      console.error('Error saving user:', err);
    }
  }

  static getCurrentUser(): UserData | null {
    try {
      const userId = localStorage.getItem(this.CURRENT_USER_KEY);
      if (!userId) return null;
      const user = this.getUser(userId);
      if (!user) return null;
      // Remove password before returning
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (err) {
      console.error('Error getting current user:', err);
      return null;
    }
  }

  static getCurrentUserWithPassword(): StoredUserData | null {
    try {
      const userId = localStorage.getItem(this.CURRENT_USER_KEY);
      if (!userId) return null;
      const user = this.getUser(userId);
      return user || null;
    } catch (err) {
      console.error('Error getting current user with password:', err);
      return null;
    }
  }

  static setCurrentUser(userId: string): void {
    localStorage.setItem(this.CURRENT_USER_KEY, userId);
  }

  static getUser(userId: string): StoredUserData | null {
    const users = this.getAllUsers();
    return users[userId] || null;
  }

  static getAllUsers(): Record<string, StoredUserData> {
    try {
      const usersJson = localStorage.getItem(this.USERS_KEY);
      console.log('Raw users data:', usersJson); // Debug log
      if (!usersJson) return {};
      const users = JSON.parse(usersJson);
      console.log('Parsed users:', users); // Debug log
      return users;
    } catch (err) {
      console.error('Error getting users:', err);
      return {};
    }
  }

  static clearCurrentUser(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  static clearAllData(): void {
    localStorage.removeItem(this.USERS_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }
}
