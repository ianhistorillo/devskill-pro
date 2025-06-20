import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase, Assessment, UserAssessment, CodingChallenge } from '../../lib/supabase';
import { StatsOverview } from './StatsOverview';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { ProgressChart } from './ProgressChart';

export function Dashboard() {
  const { user, profile } = useAuthContext();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [userAssessments, setUserAssessments] = useState<UserAssessment[]>([]);
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch available assessments
      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      // Fetch user assessments
      const { data: userAssessmentsData } = await supabase
        .from('user_assessments')
        .select(`
          *,
          assessment:assessments(
            *,
            category:categories(*)
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch coding challenges
      const { data: challengesData } = await supabase
        .from('coding_challenges')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      setAssessments(assessmentsData || []);
      setUserAssessments(userAssessmentsData || []);
      setChallenges(challengesData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.full_name || 'Developer'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Track your progress and continue your learning journey
        </p>
      </div>

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
    </div>
  );
}