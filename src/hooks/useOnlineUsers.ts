import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'marketflow_online_users';
const HEARTBEAT_INTERVAL = 10_000; // 10 seconds
const OFFLINE_THRESHOLD = 30_000; // 30 seconds

interface OnlineUser {
  name: string;
  lastSeen: number;
}

type OnlineUsersMap = Record<string, OnlineUser>;

function getOnlineUsers(): OnlineUsersMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function cleanOfflineUsers(users: OnlineUsersMap): OnlineUsersMap {
  const now = Date.now();
  const cleaned: OnlineUsersMap = {};
  for (const [id, user] of Object.entries(users)) {
    if (now - user.lastSeen < OFFLINE_THRESHOLD) {
      cleaned[id] = user;
    }
  }
  return cleaned;
}

export function useOnlineUsers() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUsersMap>({});

  const refresh = useCallback(() => {
    const users = cleanOfflineUsers(getOnlineUsers());
    setOnlineUsers(users);
  }, []);

  // Heartbeat: register current user and clean stale entries
  useEffect(() => {
    if (!user) return;

    const heartbeat = () => {
      const users = getOnlineUsers();
      users[user.id] = { name: user.name, lastSeen: Date.now() };
      const cleaned = cleanOfflineUsers(users);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      setOnlineUsers(cleaned);
    };

    // Immediate heartbeat
    heartbeat();

    const interval = setInterval(heartbeat, HEARTBEAT_INTERVAL);

    // Listen for storage events from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        refresh();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);

      // Remove current user on unmount
      try {
        const users = getOnlineUsers();
        delete users[user.id];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      } catch {
        // ignore cleanup errors
      }
    };
  }, [user, refresh]);

  const onlineCount = Object.keys(onlineUsers).length;

  return { onlineUsers, onlineCount };
}
