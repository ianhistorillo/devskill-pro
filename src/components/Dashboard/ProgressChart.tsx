import React from 'react';
import { UserAssessment } from '../../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProgressChartProps {
  userAssessments: UserAssessment[];
}

export function ProgressChart({ userAssessments }: ProgressChartProps) {
  const completedAssessments = userAssessments
    .filter(ua => ua.status === 'completed')
    .sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime());

  const chartData = completedAssessments.map((ua, index) => ({
    assessment: `Assessment ${index + 1}`,
    score: ua.total_points > 0 ? Math.round((ua.score / ua.total_points) * 100) : 0,
    date: new Date(ua.completed_at!).toLocaleDateString(),
  }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>
        <div className="text-center py-12">
          <p className="text-gray-500">Complete your first assessment to see your progress chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="assessment" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value, name) => [`${value}%`, 'Score']}
              labelFormatter={(label) => `Assessment: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}