import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        console.log('✅ Session retrieved:', !!session?.user);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Fetching profile for user:', session.user.id);
          await fetchProfile(session.user.id);
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

    // Initialize auth
    initializeAuth();

    // Listen for auth changes - only for actual sign in/out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state changed:', event, !!session?.user);
        
        // Only handle actual auth events, not token refresh
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null);
        
          if (session?.user) {
            console.log('👤 User authenticated (event:', event, '), fetching profile...');
            await fetchProfile(session.user.id);
          } else {
            console.log('🚫 User signed out or session expired');
            setProfile(null);
          }
        
          // Always mark loading as false once session is handled
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth...');
      mounted = false;
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
        return;
      }

      console.log('✅ Profile fetched:', !!data);
      setProfile(data);
    } catch (error) {
      console.error('💥 Profile fetch failed:', error);
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