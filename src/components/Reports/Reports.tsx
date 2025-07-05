import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase, UserAssessment, UserChallengeSubmission } from '../../lib/supabase';
import { PerformanceOverview } from './PerformanceOverview';
import { AssessmentHistory } from './AssessmentHistory';
import { ChallengeHistory } from './ChallengeHistory';
import { SkillAnalysis } from './SkillAnalysis';
import { ProgressTrends } from './ProgressTrends';
import { AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export function Reports() {
  const { user } = useAuthContext();
  const [userAssessments, setUserAssessments] = useState<UserAssessment[]>([]);
  const [challengeSubmissions, setChallengeSubmissions] = useState<UserChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchReportsData();
    }
  }, [user]);

  const fetchReportsData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('📊 Fetching reports data...');
      setLoading(true);
      setError(null);

      // Fetch user assessments - no timeout, simple query
      const assessmentsPromise = supabase
        .from('user_assessments')
        .select(`
          *,
          assessment:assessments(
            *,
            category:categories(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch challenge submissions - no timeout, simple query
      const submissionsPromise = supabase
        .from('user_challenge_submissions')
        .select(`
          *,
          challenge:coding_challenges(
            *,
            category:categories(*)
          )
        `)
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      // Execute queries in parallel
      const [assessmentsResponse, submissionsResponse] = await Promise.all([
        assessmentsPromise,
        submissionsPromise
      ]);

      // Handle responses
      if (assessmentsResponse.error) {
        console.error('❌ Failed to load user assessments:', assessmentsResponse.error);
        setUserAssessments([]);
      } else {
        setUserAssessments(assessmentsResponse.data || []);
        console.log('✅ User assessments loaded:', assessmentsResponse.data?.length || 0);
      }

      if (submissionsResponse.error) {
        console.error('❌ Failed to load challenge submissions:', submissionsResponse.error);
        setChallengeSubmissions([]);
      } else {
        setChallengeSubmissions(submissionsResponse.data || []);
        console.log('✅ Challenge submissions loaded:', submissionsResponse.data?.length || 0);
      }

      console.log('✅ Reports data loaded successfully');

    } catch (error: any) {
      console.error('💥 Reports data fetch failed:', error);
      setError(error.message || 'Failed to load reports data');
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    console.log('🔄 Retrying reports data fetch...');
    fetchReportsData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Reports</h2>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Reports</h1>
        <p className="text-gray-600">Analyze your progress and identify areas for improvement</p>
      </div>

      <div className="space-y-8">
        <PerformanceOverview 
          userAssessments={userAssessments}
          challengeSubmissions={challengeSubmissions}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProgressTrends userAssessments={userAssessments} />
          <SkillAnalysis 
            userAssessments={userAssessments}
            challengeSubmissions={challengeSubmissions}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AssessmentHistory userAssessments={userAssessments} />
          <ChallengeHistory challengeSubmissions={challengeSubmissions} />
        </div>
      </div>
    </div>
  );
}