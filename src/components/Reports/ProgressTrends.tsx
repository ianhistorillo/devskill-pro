import React from 'react';
import { UserAssessment } from '../../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ProgressTrendsProps {
  userAssessments: UserAssessment[];
}

export function ProgressTrends({ userAssessments }: ProgressTrendsProps) {
  const completedAssessments = userAssessments
    .filter(ua => ua.status === 'completed')
    .sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime());

  const chartData = completedAssessments.map((ua, index) => {
    const score = ua.total_points > 0 ? Math.round((ua.score / ua.total_points) * 100) : 0;
    return {
      assessment: index + 1,
      score,
      date: new Date(ua.completed_at!).toLocaleDateString(),
      category: ua.assessment?.category?.name || 'Unknown',
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Trends</h3>
        <div className="text-center py-12">
          <p className="text-gray-500">Complete assessments to see your progress trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Trends</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="assessment" 
              label={{ value: 'Assessment Number', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              domain={[0, 100]} 
              label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value, name) => [`${value}%`, 'Score']}
              labelFormatter={(label) => `Assessment ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#3B82F6" 
              strokeWidth={3}
              fill="url(#scoreGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}