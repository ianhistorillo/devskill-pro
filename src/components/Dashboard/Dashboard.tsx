import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase, Assessment, UserAssessment, CodingChallenge } from '../../lib/supabase';
import { StatsOverview } from './StatsOverview';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { ProgressChart } from './ProgressChart';
import { AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export function Dashboard() {
  const { user, profile, loading: authLoading } = useAuthContext();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [userAssessments, setUserAssessments] = useState<UserAssessment[]>([]);
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    // Only fetch data if user is authenticated, auth is not loading, and we haven't loaded data yet
    if (!authLoading && user && !dataLoaded && !fetchingRef.current) {
      fetchDashboardData();
    }
  }, [authLoading, user, dataLoaded]);

  const fetchDashboardData = async () => {
    if (!user || fetchingRef.current) {
      return;
    }

    // Prevent multiple simultaneous fetches
    fetchingRef.current = true;

    try {
      console.log('📊 Fetching dashboard data...');
      setLoading(true);
      setError(null);

      // Create AbortController for request cancellation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        // Fetch available assessments
        const assessmentsPromise = supabase
          .from('assessments')
          .select(`
            *,
            category:categories(*)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6)
          .abortSignal(controller.signal);

        // Fetch user assessments
        const userAssessmentsPromise = supabase
          .from('user_assessments')
          .select(`
            *,
            assessment:assessments(
              *,
              category:categories(*)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
          .abortSignal(controller.signal);

        // Fetch coding challenges
        const challengesPromise = supabase
          .from('coding_challenges')
          .select(`
            *,
            category:categories(*)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6)
          .abortSignal(controller.signal);

        // Execute all queries in parallel
        const [assessmentsResponse, userAssessmentsResponse, challengesResponse] = await Promise.all([
          assessmentsPromise,
          userAssessmentsPromise,
          challengesPromise
        ]);

        clearTimeout(timeoutId);

        // Handle responses
        if (assessmentsResponse.error) {
          console.error('❌ Failed to load assessments:', assessmentsResponse.error);
          setAssessments([]);
        } else {
          setAssessments(assessmentsResponse.data || []);
          console.log('✅ Assessments loaded:', assessmentsResponse.data?.length || 0);
        }

        if (userAssessmentsResponse.error) {
          console.error('❌ Failed to load user assessments:', userAssessmentsResponse.error);
          setUserAssessments([]);
        } else {
          setUserAssessments(userAssessmentsResponse.data || []);
          console.log('✅ User assessments loaded:', userAssessmentsResponse.data?.length || 0);
        }

        if (challengesResponse.error) {
          console.error('❌ Failed to load challenges:', challengesResponse.error);
          setChallenges([]);
        } else {
          setChallenges(challengesResponse.data || []);
          console.log('✅ Challenges loaded:', challengesResponse.data?.length || 0);
        }

        setDataLoaded(true);
        console.log('✅ Dashboard data loaded successfully');

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('💥 Dashboard data fetch timed out');
          setError('Request timed out. Please check your connection.');
        } else {
          throw fetchError;
        }
      }

    } catch (error: any) {
      console.error('💥 Dashboard data fetch failed:', error);
      setError(error.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const handleRetry = () => {
    console.log('🔄 Retrying dashboard data fetch...');
    setDataLoaded(false);
    fetchDashboardData();
  };

  // Show loading only if auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show dashboard content (even if data is still loading)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.full_name || 'Developer'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Track your progress and continue your learning journey
        </p>
      </div>

      {loading && !dataLoaded ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <StatsOverview 
              userAssessments={userAssessments}
              challenges={challenges}
            />
            <ProgressChart userAssessments={userAssessments} />
            <RecentActivity userAssessments={userAssessments} />
          </div>

          <div className="space-y-8">
            <QuickActions 
              assessments={assessments}
              challenges={challenges}
            />
          </div>
        </div>
      )}
    </div>
  );
}