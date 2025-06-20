import React from 'react';
import { UserAssessment, UserChallengeSubmission } from '../../lib/supabase';
import { Trophy, Target, Code, TrendingUp, Clock, Award } from 'lucide-react';

interface PerformanceOverviewProps {
  userAssessments: UserAssessment[];
  challengeSubmissions: UserChallengeSubmission[];
}

export function PerformanceOverview({ userAssessments, challengeSubmissions }: PerformanceOverviewProps) {
  const completedAssessments = userAssessments.filter(ua => ua.status === 'completed');
  const passedChallenges = challengeSubmissions.filter(cs => cs.status === 'passed');
  
  const totalAssessmentScore = completedAssessments.reduce((sum, ua) => sum + ua.score, 0);
  const totalPossibleScore = completedAssessments.reduce((sum, ua) => sum + ua.total_points, 0);
  const averageScore = totalPossibleScore > 0 ? Math.round((totalAssessmentScore / totalPossibleScore) * 100) : 0;
  
  const totalChallengePoints = passedChallenges.reduce((sum, cs) => sum + cs.score, 0);
  const averageExecutionTime = challengeSubmissions.length > 0 
    ? Math.round(challengeSubmissions.reduce((sum, cs) => sum + (cs.execution_time_ms || 0), 0) / challengeSubmissions.length)
    : 0;

  const stats = [
    {
      label: 'Assessments Completed',
      value: completedAssessments.length,
      icon: Trophy,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      label: 'Average Score',
      value: `${averageScore}%`,
      icon: Target,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      change: '+5%',
      changeType: 'positive' as const,
    },
    {
      label: 'Challenges Solved',
      value: passedChallenges.length,
      icon: Code,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      label: 'Total Points Earned',
      value: totalAssessmentScore + totalChallengePoints,
      icon: Award,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      change: '+15%',
      changeType: 'positive' as const,
    },
    {
      label: 'Study Streak',
      value: '7 days',
      icon: TrendingUp,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      change: '+2 days',
      changeType: 'positive' as const,
    },
    {
      label: 'Avg. Execution Time',
      value: `${averageExecutionTime}ms`,
      icon: Clock,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      change: '-50ms',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className={`${stat.bgColor} rounded-lg p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}