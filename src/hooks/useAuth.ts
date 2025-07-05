import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let inactivityTimer: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Simple session check - no timeout
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        console.log('✅ Session retrieved:', !!session?.user);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Fetching profile for user:', session.user.id);
          await fetchProfile(session.user.id);
          startInactivityTimer();
        } else {
          console.log('🚫 No user session found');
          setProfile(null);
        }
        
      } catch (error) {
        console.error('💥 Auth initialization failed:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          console.log('✅ Auth initialization complete');
          setLoading(false);
        }
      }
    };

    const startInactivityTimer = () => {
      // Clear any existing timer
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      // Set 30-minute inactivity timer
      inactivityTimer = setTimeout(async () => {
        console.log('⏰ 30 minutes of inactivity - signing out');
        await signOut();
      }, 30 * 60 * 1000); // 30 minutes
    };

    const resetInactivityTimer = () => {
      if (user) {
        startInactivityTimer();
      }
    };

    // Reset timer on user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Initialize auth
    initializeAuth();

    // Listen for auth changes - simplified
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state changed:', event, !!session?.user);
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User authenticated, fetching profile...');
          await fetchProfile(session.user.id);
          startInactivityTimer();
        } else {
          console.log('🚫 User signed out');
          setProfile(null);
          if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            inactivityTimer = null;
          }
        }
        
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth...');
      mounted = false;
      
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      // Remove activity listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
      
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('📋 Fetching profile for:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Profile fetch error:', error);
        // Don't fail - just continue without profile
        return;
      }

      console.log('✅ Profile fetched:', !!data);
      setProfile(data);
    } catch (error) {
      console.error('💥 Profile fetch failed:', error);
      // Don't fail - just continue without profile
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('📝 Signing up user...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      console.log('✅ User signed up successfully');
      return data;
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔑 Signing in user...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      console.log('✅ User signed in successfully');
      return data;
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('👋 Signing out user...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('📝 Updating profile...');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };
}