import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockSeed';
import { supabase } from '../lib/supabase';
import { generateStudentUsername } from '../lib/serbianUtils';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isSupabaseConnected: boolean;
  dbErrorMessage?: string;
  onlineUsersCount: number;
  onlineRolesBreakdown: { label: string; count: number }[];
  login: (username: string, password?: string) => Promise<{ success: boolean; requirePasswordChange?: boolean; error?: string }>;
  completePasswordChange: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  registerStudent: (name: string, surname: string, phone?: string, gradeClass?: string) => Promise<{ user: User; tempPass: string }>;
  registerStudentsBulk: (studentsData: Array<{ name: string; surname: string; phone?: string; grade_class?: string }>) => Promise<Array<{ user: User; tempPass: string }>>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  deleteUser: (userId: string) => Promise<boolean>;
  resetUserPassword: (userId: string) => Promise<{ success: boolean; tempPassword?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('parlament_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('parlament_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [dbErrorMessage, setDbErrorMessage] = useState<string | undefined>(undefined);

  // Fetch users from Supabase and auto-seed if empty
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) {
        setDbErrorMessage(error.message);
        setIsSupabaseConnected(false);
        return;
      }

      setIsSupabaseConnected(true);
      setDbErrorMessage(undefined);

      if (data && data.length > 0) {
        setUsers(data as User[]);
        localStorage.setItem('parlament_users', JSON.stringify(data));
      } else {
        // Table exists but is empty -> auto seed initial users
        const { error: seedError } = await supabase.from('users').insert(INITIAL_USERS);
        if (!seedError) {
          setUsers(INITIAL_USERS);
          localStorage.setItem('parlament_users', JSON.stringify(INITIAL_USERS));
        }
      }
    } catch (err: unknown) {
      console.warn('Supabase fetch users failed, using cache:', err);
      setIsSupabaseConnected(false);
      setDbErrorMessage(err instanceof Error ? err.message : 'Greška pri povezivanju');
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    // Supabase Realtime channel for users updates
    const channel = supabase
      .channel('public:users_presence')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers]);

  // Sync currentUser with users state and localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('parlament_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('parlament_current_user');
    }
  }, [currentUser]);

  // Online statistics
  const onlineUsers = users.filter((u) => u.is_online);
  const onlineUsersCount = onlineUsers.length;

  const onlineRolesBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    onlineUsers.forEach((u) => {
      let label = 'Učenik';
      if (u.role === 'president') label = 'Predsednik';
      else if (u.role === 'vice_president_even') label = 'Zamenik (parna)';
      else if (u.role === 'vice_president_odd') label = 'Zamenik (neparna)';
      else if (u.role === 'secretary') label = 'Zapisničar';
      else if (u.role === 'teacher_advisor') label = 'Nastavnik-saradnik';
      else if (u.role === 'support') label = 'Podrška';

      map.set(label, (map.get(label) || 0) + 1);
    });

    return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
  }, [onlineUsers]);

  const login = async (username: string, password?: string) => {
    const cleanUser = username.trim().toLowerCase();
    let user = users.find((u) => u.username.toLowerCase() === cleanUser);

    // Try live fetch from Supabase if not in local array
    if (!user && isSupabaseConnected) {
      const { data } = await supabase.from('users').select('*').ilike('username', cleanUser).single();
      if (data) user = data as User;
    }

    if (!user) {
      return { success: false, error: 'Korisničko ime nije pronađeno u bazi parlamenta.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, error: 'Pogrešna lozinka. Pokušajte ponovo.' };
    }

    // Mark online in Supabase and locally
    const updatedUser: User = { ...user, is_online: true };
    setUsers((prev) => prev.map((u) => (u.id === user!.id ? updatedUser : u)));
    setCurrentUser(updatedUser);

    try {
      await supabase.from('users').update({ is_online: true }).eq('id', user.id);
    } catch (e) {
      console.warn('Supabase mark online failed', e);
    }

    if (user.status === 'must_change_password') {
      return { success: true, requirePasswordChange: true };
    }

    return { success: true, requirePasswordChange: false };
  };

  const completePasswordChange = async (newPassword: string) => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      password: newPassword,
      status: 'active',
      temporary_password: undefined,
    };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

    try {
      await supabase
        .from('users')
        .update({
          password: newPassword,
          status: 'active',
          temporary_password: null,
        })
        .eq('id', currentUser.id);
    } catch (e) {
      console.warn('Supabase update password failed', e);
    }
  };

  const logout = async () => {
    if (currentUser) {
      const targetId = currentUser.id;
      setUsers((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, is_online: false } : u))
      );
      try {
        await supabase.from('users').update({ is_online: false }).eq('id', targetId);
      } catch (e) {
        console.warn('Supabase mark offline failed', e);
      }
    }
    setCurrentUser(null);
  };

  const switchUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      const updated: User = { ...target, is_online: true };
      setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
      setCurrentUser(updated);

      try {
        await supabase.from('users').update({ is_online: true }).eq('id', target.id);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const registerStudent = async (name: string, surname: string, phone?: string, gradeClass?: string) => {
    const baseUsername = generateStudentUsername(name, surname);
    let finalUsername = baseUsername;
    let counter = 1;
    while (users.some((u) => u.username === finalUsername)) {
      finalUsername = `${baseUsername}${counter}`;
      counter++;
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let tempPass = 'Sesta2026!';
    for (let i = 0; i < 4; i++) {
      tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newUser: User = {
      id: `usr-stud-${Date.now()}`,
      username: finalUsername,
      password: tempPass,
      temporary_password: tempPass,
      name,
      surname,
      phone: phone || '',
      grade_class: gradeClass || 'Odeljenje nespecificirano',
      role: 'student',
      status: 'must_change_password',
      is_online: false,
    };

    setUsers((prev) => [newUser, ...prev]);

    try {
      await supabase.from('users').insert([newUser]);
    } catch (e) {
      console.warn('Supabase insert user failed', e);
    }

    return { user: newUser, tempPass };
  };

  const registerStudentsBulk = async (
    studentsData: Array<{ name: string; surname: string; phone?: string; grade_class?: string }>
  ): Promise<Array<{ user: User; tempPass: string }>> => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    const existingUsernames = new Set(users.map((u) => u.username));
    const results: Array<{ user: User; tempPass: string }> = [];
    const newUsers: User[] = [];

    for (let index = 0; index < studentsData.length; index++) {
      const student = studentsData[index];
      const baseUsername = generateStudentUsername(student.name, student.surname);
      let finalUsername = baseUsername;
      let counter = 1;
      while (existingUsernames.has(finalUsername)) {
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }
      existingUsernames.add(finalUsername);

      let tempPass = 'Sesta2026!';
      for (let i = 0; i < 4; i++) {
        tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const newUser: User = {
        id: `usr-stud-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        username: finalUsername,
        password: tempPass,
        temporary_password: tempPass,
        name: student.name,
        surname: student.surname,
        phone: student.phone || '',
        grade_class: student.grade_class || 'Odeljenje nespecificirano',
        role: 'student',
        status: 'must_change_password',
        is_online: false,
      };

      newUsers.push(newUser);
      results.push({ user: newUser, tempPass });
    }

    if (newUsers.length > 0) {
      setUsers((prev) => [...newUsers, ...prev]);
      try {
        await supabase.from('users').insert(newUsers);
      } catch (e) {
        console.warn('Supabase bulk insert users failed', e);
      }
    }

    return results;
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(null);
    }
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) {
        console.warn('Supabase delete user failed:', error);
      }
      return true;
    } catch (e) {
      console.warn('Delete user error:', e);
      return false;
    }
  };

  const resetUserPassword = async (userId: string): Promise<{ success: boolean; tempPassword?: string; error?: string }> => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let newTempPass = 'Sesta2026!';
    for (let i = 0; i < 4; i++) {
      newTempPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              password: newTempPass,
              temporary_password: newTempPass,
              status: 'must_change_password',
              is_online: false,
            }
          : u
      )
    );

    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              password: newTempPass,
              temporary_password: newTempPass,
              status: 'must_change_password',
            }
          : null
      );
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          password: newTempPass,
          temporary_password: newTempPass,
          status: 'must_change_password',
          is_online: false,
        })
        .eq('id', userId);

      if (error) {
        console.warn('Supabase reset password failed:', error);
        return { success: false, error: error.message };
      }
      return { success: true, tempPassword: newTempPass };
    } catch (e: unknown) {
      console.warn('Reset password error:', e);
      return { success: false, error: e instanceof Error ? e.message : 'Greška' };
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }

    try {
      await supabase.from('users').update({ role: newRole }).eq('id', userId);
    } catch (e) {
      console.warn('Supabase update user role failed', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isSupabaseConnected,
        dbErrorMessage,
        onlineUsersCount,
        onlineRolesBreakdown,
        login,
        completePasswordChange,
        logout,
        switchUser,
        registerStudent,
        registerStudentsBulk,
        updateUserRole,
        deleteUser,
        resetUserPassword,
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
