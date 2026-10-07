'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User } from '../utils/storage';
import { 
    getUserByIdAction, 
    updateLastSeenAction, 
    registerDeviceAction, 
    getDeviceStatusAction,
    banDeviceAction
} from '@/app/actions/dbActions';
import { getDeviceFingerprint, isAttackPatternDetected, recordMaliciousAttempt } from '@/utils/device';
import { toast } from 'sonner';
import { db } from '@/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  loading: boolean;
  isDeviceBanned: boolean;
  isDevicePending: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeviceBanned, setIsDeviceBanned] = useState(false);
  const [isDevicePending, setIsDevicePending] = useState(false);

  const logout = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('cached_user_profile');
    setUser(null);
    window.location.href = '/';
  };

  useEffect(() => {
    const initializeSecurity = async () => {
        const deviceId = getDeviceFingerprint();
        
        // 1. Check for local attack detection
        if (isAttackPatternDetected()) {
            await banDeviceAction(deviceId, "Heuristic Attack Pattern Detected");
            setIsDeviceBanned(true);
            return;
        }

        // 2. Register/Fetch device state
        const currentUserId = localStorage.getItem('currentUserId');
        const deviceState = await registerDeviceAction(deviceId, currentUserId || undefined);

        // Initial setup based on first fetch
        setIsDeviceBanned(!!deviceState.isBanned);
        setIsDevicePending(!deviceState.isVerified);

        // REAL-TIME DEVICE MONITORING
        // Solves the "white screen parin" issue by watching for Admin approval instantly
        const unsubscribeDevice = onSnapshot(doc(db, 'devices', deviceId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setIsDeviceBanned(!!data.isBanned);
                setIsDevicePending(!data.isVerified);
            }
        });

        // 3. Identity logic if device is verified or is admin bypassing
        if (currentUserId) {
            if (currentUserId === 'admin') {
                const admin = {
                  id: 'admin',
                  name: 'System Administrator',
                  email: 'admin@school.edu',
                  password: 'ADMIN@2026',
                  role: 'admin' as const,
                  department: 'college' as const
                };
                setUser(admin);
                setIsDevicePending(false);
            } else {
                try {
                    const currentUser = await getUserByIdAction(currentUserId);
                    if (currentUser) {
                        if (currentUser.isBanned) {
                            toast.error("SECURITY PROTOCOL: Your account has been permanently terminated.");
                            logout();
                            return;
                        }
                        setUser(currentUser);
                        localStorage.setItem('cached_user_profile', JSON.stringify(currentUser));
                    } else {
                        const cached = localStorage.getItem('cached_user_profile');
                        if (cached) setUser(JSON.parse(cached));
                        else logout();
                    }
                } catch (e: any) {
                    const cached = localStorage.getItem('cached_user_profile');
                    if (cached) setUser(JSON.parse(cached));
                }
            }
        }
        setLoading(false);
        return () => unsubscribeDevice();
    };
    initializeSecurity();
  }, []);

  // Neural Sync Heartbeat
  useEffect(() => {
    if (!user || user.id === 'admin') return;

    const interval = setInterval(async () => {
      try {
          await updateLastSeenAction(user.id);
      } catch (e: any) {
          console.warn("Heartbeat delayed.");
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const login = (userToLogin: User) => {
    if (userToLogin.isBanned) {
        toast.error("ACCESS DENIED: Account is blacklisted.");
        return;
    }
    const deviceId = getDeviceFingerprint();
    registerDeviceAction(deviceId, userToLogin.id);
    
    localStorage.setItem('currentUserId', userToLogin.id);
    localStorage.setItem('cached_user_profile', JSON.stringify(userToLogin));
    setUser(userToLogin);
    
    if (userToLogin.role === 'admin') {
        setIsDevicePending(false);
    }
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (user) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('cached_user_profile', JSON.stringify(updatedUser));
    }
  };

  const contextValue = useMemo(() => ({
    user, login, logout, updateCurrentUser, loading, isDeviceBanned, isDevicePending
  }), [user, loading, isDeviceBanned, isDevicePending]);

  // White screen for Banned Devices
  if (isDeviceBanned) {
      return <div className="min-h-screen bg-white" />;
  }

  // White screen for Unverified Devices (Students/Teachers only)
  if (isDevicePending && user && user.role !== 'admin') {
      return <div className="min-h-screen bg-white" />;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {loading && !user ? (
        <div className="min-h-screen bg-white" />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
