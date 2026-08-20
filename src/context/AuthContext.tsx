import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { db } from '../lib/storage';
import { DEFAULT_USER } from '../lib/seedData';
import { cloud, KeepAliveInfo } from '../lib/cloudService';

interface AuthContextType {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  isAuthenticated: boolean;
  keepAliveInfo: KeepAliveInfo;
  login: (loginIdentifier: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, fullName: string, password?: string, username?: string, phone?: string) => Promise<{ success: boolean; message?: string }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
  switchUser: (userId: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  logout: () => void;
  resetDemoData: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isLocked: boolean;
  unlockScreen: (password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes auto-lock

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [keepAliveInfo, setKeepAliveInfo] = useState<KeepAliveInfo>({
    is_active: true,
    is_db_connected: false,
    database_type: 'Neon.tech PostgreSQL',
    last_ping_time: null,
    last_latency_ms: null,
    total_pings: 0,
    ping_interval_seconds: 120,
    anti_sleep_strategy: 'Neon DB SQL Pulse + Render Server Self-Ping (Every 2 Minutes)'
  });

  useEffect(() => {
    db.init();
    const session = db.getAuthSession();
    const users = db.getUsers();
    setAllUsers(users);

    const user = db.getUserById(session.userId) || users[0] || DEFAULT_USER;
    if (user.avatar_url) {
      delete user.avatar_url;
      db.saveUser(user);
    }
    setCurrentUser(user);
    setIsAuthenticated(session.isAuthenticated);

    // Subscribe to background anti-sleep heartbeat updates
    const unsubscribe = cloud.subscribe((info) => {
      setKeepAliveInfo(info);
    });

    // 20-minute Inactivity Detection
    let inactivityTimer: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Trigger auto-lock if user is authenticated and not already locked
        const currSession = db.getAuthSession();
        if (currSession.isAuthenticated) {
          setIsLocked(true);
        }
      }, INACTIVITY_TIMEOUT_MS);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();

    return () => {
      unsubscribe();
      clearTimeout(inactivityTimer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, []);

  const unlockScreen = (password: string): boolean => {
    const expectedPass = currentUser.password || 'admin123';
    if (password === expectedPass) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const login = async (loginIdentifier: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanId = loginIdentifier.trim().toLowerCase();

    // 1. Try Cloud Login first (For cross-computer & Neon.tech access)
    try {
      const cloudRes = await cloud.login(cleanId, password);
      if (cloudRes.success && cloudRes.user) {
        const cloudUser = cloudRes.user;
        db.saveUser(cloudUser);
        db.setCurrentUserId(cloudUser.id);
        db.setAuthSession({ isAuthenticated: true, userId: cloudUser.id });

        // Pull cloud data for this user to ensure instant cross-device sync
        const pulled = await cloud.pullAllData(cloudUser.id);
        if (pulled) {
          if (pulled.categories?.length) db.saveCategories(pulled.categories);
          if (pulled.incomes?.length) db.saveIncomes(pulled.incomes);
          if (pulled.expenses?.length) db.saveExpenses(pulled.expenses);
          if (pulled.debts?.length) db.saveDebts(pulled.debts);
          if (pulled.debtPayments?.length) db.saveDebtPayments(pulled.debtPayments);
          if (pulled.budgets?.length) db.saveBudgets(pulled.budgets);
          if (pulled.settings) db.saveSettings(pulled.settings);
        }

        setCurrentUser(cloudUser);
        setAllUsers(db.getUsers());
        setIsAuthenticated(true);
        setIsLoginModalOpen(false);

        db.logAudit(
          cloudUser.id,
          'SETTINGS',
          'auth_login',
          'UPDATE',
          'Bulut orqali tizimga kirildi',
          `${cloudUser.full_name} (${cloudUser.role || 'Admin'}) har qanday qurilmadan tizimga kirdi.`
        );

        return { success: true };
      }
    } catch {
      // If cloud network check fails, fallback to local store below
    }

    // 2. Fallback to Local users database
    const users = db.getUsers();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        (u.username && u.username.toLowerCase() === cleanId)
    );

    if (!found) {
      return {
        success: false,
        message: "Kiritilgan login yoki email bo'yicha foydalanuvchi topilmadi."
      };
    }

    // Password validation (default user password is 'admin123' if not set)
    const expectedPass = found.password || 'admin123';
    if (password && password !== expectedPass) {
      return {
        success: false,
        message: "Noto'g'ri parol kiritildi! Iltimos qaytadan tekshirib ko'ring."
      };
    }

    // Update last login
    const updatedUser: UserProfile = {
      ...found,
      last_login: new Date().toISOString()
    };
    db.saveUser(updatedUser);
    db.setCurrentUserId(updatedUser.id);
    db.setAuthSession({ isAuthenticated: true, userId: updatedUser.id });

    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    setIsLoginModalOpen(false);

    db.logAudit(
      updatedUser.id,
      'SETTINGS',
      'auth_login',
      'UPDATE',
      'Tizimga kirildi',
      `${updatedUser.full_name} (${updatedUser.role || 'Admin'}) tizimga muvaffaqiyatli kirdi.`
    );

    return { success: true };
  };

  const changePassword = async (currentPass: string, newPass: string): Promise<{ success: boolean; message?: string }> => {
    const userPass = currentUser.password || 'admin123';
    if (currentPass !== userPass) {
      return { success: false, message: "Hozirgi parol noto'g'ri kiritildi." };
    }
    if (!newPass || newPass.length < 4) {
      return { success: false, message: "Yangi parol kamida 4 ta belgidan iborat bo'lishi kerak." };
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      password: newPass,
      updated_at: new Date().toISOString()
    };
    db.saveUser(updatedUser);
    setCurrentUser(updatedUser);
    setAllUsers(db.getUsers());

    db.logAudit(
      currentUser.id,
      'SETTINGS',
      'auth_password_change',
      'UPDATE',
      'Parol yangilandi',
      'Admin akkauntining xavfsizlik paroli muvaffaqiyatli almashtirildi.'
    );

    return { success: true };
  };

  const register = async (
    email: string,
    fullName: string,
    password?: string,
    username?: string,
    phone?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || email.split('@')[0]).trim().toLowerCase();

    // 1. Strict duplicate validation against local database
    const users = db.getUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: "Ushbu email manzili bilan allaqachon ro'yxatdan o'tilgan." };
    }
    if (users.some((u) => (u.username || '').toLowerCase() === cleanUsername)) {
      return { success: false, message: "Ushbu login (username) allaqachon band. Iltimos boshqa login tanlang." };
    }

    // 2. Register on Cloud Neon PostgreSQL server
    try {
      const cloudRes = await cloud.register({
        email: cleanEmail,
        username: cleanUsername,
        fullName: fullName.trim(),
        password: password || 'admin123',
        phone: phone?.trim(),
        role: 'bosh_admin',
        currency: 'UZS',
        language: 'uz'
      });

      if (!cloudRes.success && cloudRes.message) {
        return { success: false, message: cloudRes.message };
      }
    } catch {
      // Local fallback continues
    }

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      email: cleanEmail,
      username: cleanUsername,
      full_name: fullName.trim() || 'Foydalanuvchi',
      phone: phone?.trim() || '',
      password: password || 'admin123',
      role: 'bosh_admin',
      currency: 'UZS',
      language: 'uz',
      timezone: 'Asia/Tashkent',
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.saveUser(newUser);
    db.setCurrentUserId(newUser.id);
    db.setAuthSession({ isAuthenticated: true, userId: newUser.id });
    
    setAllUsers(db.getUsers());
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setIsLoginModalOpen(false);

    return { success: true };
  };

  const switchUser = (userId: string) => {
    const user = db.getUserById(userId);
    if (user) {
      db.setCurrentUserId(userId);
      db.setAuthSession({ isAuthenticated: true, userId });
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...currentUser,
      ...updates,
      updated_at: new Date().toISOString()
    };
    db.saveUser(updated);
    setCurrentUser(updated);
    setAllUsers(db.getUsers());

    db.logAudit(
      currentUser.id,
      'SETTINGS',
      'profile_update',
      'UPDATE',
      'Admin profili yangilandi',
      `${updated.full_name} ma'lumotlari tahrirlandi.`
    );
  };

  const logout = () => {
    db.setAuthSession({ isAuthenticated: false, userId: currentUser.id });
    setIsAuthenticated(false);
    setIsLoginModalOpen(true);
  };

  const resetDemoData = () => {
    db.resetToSeedData();
    setCurrentUser(DEFAULT_USER);
    setAllUsers(db.getUsers());
    setIsAuthenticated(true);
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isAuthenticated,
        keepAliveInfo,
        login,
        register,
        changePassword,
        switchUser,
        updateProfile,
        logout,
        resetDemoData,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


