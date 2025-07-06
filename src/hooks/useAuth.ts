import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const fetchingProfileRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // Don't re-initialize if already done
      if (initialized) {
        return;
      }

      try {
        console.log('🔄 Initializing auth...');
        
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        console.log('✅ Session retrieved:', !!session?.user);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Fetching profile for user:', session.user.id);
          currentUserIdRef.current = session.user.id;
          await fetchProfile(session.user.id);
        } else {
          console.log('🚫 No user session found');
          setProfile(null);
          currentUserIdRef.current = null;
        }
        
        setInitialized(true);
        
      } catch (error) {
        console.error('💥 Auth initialization failed:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setInitialized(true);
          currentUserIdRef.current = null;
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
        
        // Only handle specific auth events that require action
        if (event === 'SIGNED_IN') {
          const newUserId = session?.user?.id;
          setUser(session?.user ?? null);
          
          if (newUserId && newUserId !== currentUserIdRef.current) {
            console.log('👤 New user signed in, fetching profile...');
            currentUserIdRef.current = newUserId;
            await fetchProfile(newUserId);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🚫 User signed out');
          setUser(null);
          setProfile(null);
          currentUserIdRef.current = null;
          fetchingProfileRef.current = false;
        }
        // Ignore TOKEN_REFRESHED and other events to prevent unnecessary re-renders
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth...');
      mounted = false;
      fetchingProfileRef.current = false;
      subscription.unsubscribe();
    };
  }, [initialized]); // Only depend on initialized to prevent re-runs

  const fetchProfile = async (userId: string) => {
    // Prevent duplicate profile fetches for the same user
    if (fetchingProfileRef.current || !userId || userId !== currentUserIdRef.current) {
      console.log('🚫 Skipping profile fetch - already fetching or user changed');
      return;
    }

    fetchingProfileRef.current = true;

    try {
      console.log('📋 Fetching profile for:', userId);
      
      // Create AbortController for request cancellation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Profile fetch timeout');
        controller.abort();
      }, 5000); // 5 second timeout

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .maybeSingle();

      clearTimeout(timeoutId);

      // Check if user changed during fetch
      if (userId !== currentUserIdRef.current) {
        console.log('🚫 User changed during profile fetch, ignoring result');
        return;
      }

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Profile fetch error:', error);
        return;
      }

      console.log('✅ Profile fetched:', !!data);
      setProfile(data);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🚫 Profile fetch aborted');
      } else {
        console.error('💥 Profile fetch failed:', error);
      }
    } finally {
      fetchingProfileRef.current = false;
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
      currentUserIdRef.current = null;
      fetchingProfileRef.current = false;
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