import React from 'react';
import { UserAssessment, CodingChallenge } from '../../lib/supabase';
import { Trophy, Target, Code, TrendingUp } from 'lucide-react';

interface StatsOverviewProps {
  userAssessments: UserAssessment[];
  challenges: CodingChallenge[];
}

export function StatsOverview({ userAssessments, challenges }: StatsOverviewProps) {
  const completedAssessments = userAssessments.filter(ua => ua.status === 'completed');
  const totalScore = completedAssessments.reduce((sum, ua) => sum + ua.score, 0);
  const totalPossibleScore = completedAssessments.reduce((sum, ua) => sum + ua.total_points, 0);
  const averageScore = totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0;

  const stats = [
    {
      label: 'Assessments Completed',
      value: completedAssessments.length,
      icon: Trophy,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Average Score',
      value: `${averageScore}%`,
      icon: Target,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Challenges Available',
      value: challenges.length,
      icon: Code,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Total Points Earned',
      value: totalScore,
      icon: TrendingUp,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
            <div className={`${stat.bgColor} rounded-lg p-3`}>
              <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}