import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase, UserAssessment, UserChallengeSubmission } from '../../lib/supabase';
import { PerformanceOverview } from './PerformanceOverview';
import { AssessmentHistory } from './AssessmentHistory';
import { ChallengeHistory } from './ChallengeHistory';
import { SkillAnalysis } from './SkillAnalysis';
import { ProgressTrends } from './ProgressTrends';

export function Reports() {
  const { user } = useAuthContext();
  const [userAssessments, setUserAssessments] = useState<UserAssessment[]>([]);
  const [challengeSubmissions, setChallengeSubmissions] = useState<UserChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReportsData();
    }
  }, [user]);

  const fetchReportsData = async () => {
    try {
      const [assessmentsResponse, submissionsResponse] = await Promise.all([
        supabase
          .from('user_assessments')
          .select(`
            *,
            assessment:assessments(
              *,
              category:categories(*)
            )
          `)
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_challenge_submissions')
          .select(`
            *,
            challenge:coding_challenges(
              *,
              category:categories(*)
            )
          `)
          .eq('user_id', user!.id)
          .order('submitted_at', { ascending: false })
      ]);

      setUserAssessments(assessmentsResponse.data || []);
      setChallengeSubmissions(submissionsResponse.data || []);
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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