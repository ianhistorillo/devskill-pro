import React from 'react';
import { UserAssessment, UserChallengeSubmission } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SkillAnalysisProps {
  userAssessments: UserAssessment[];
  challengeSubmissions: UserChallengeSubmission[];
}

export function SkillAnalysis({ userAssessments, challengeSubmissions }: SkillAnalysisProps) {
  // Group assessments by category and calculate average scores
  const categoryScores: Record<string, { total: number; count: number; name: string }> = {};
  
  userAssessments
    .filter(ua => ua.status === 'completed' && ua.assessment?.category)
    .forEach(ua => {
      const categoryName = ua.assessment!.category!.name;
      const score = ua.total_points > 0 ? (ua.score / ua.total_points) * 100 : 0;
      
      if (!categoryScores[categoryName]) {
        categoryScores[categoryName] = { total: 0, count: 0, name: categoryName };
      }
      
      categoryScores[categoryName].total += score;
      categoryScores[categoryName].count += 1;
    });

  // Add challenge data
  challengeSubmissions
    .filter(cs => cs.status === 'passed' && cs.challenge?.category)
    .forEach(cs => {
      const categoryName = cs.challenge!.category!.name;
      const score = 85; // Assume 85% for passed challenges
      
      if (!categoryScores[categoryName]) {
        categoryScores[categoryName] = { total: 0, count: 0, name: categoryName };
      }
      
      categoryScores[categoryName].total += score;
      categoryScores[categoryName].count += 1;
    });

  const chartData = Object.values(categoryScores)
    .map(category => ({
      category: category.name,
      score: Math.round(category.total / category.count),
      assessments: category.count,
    }))
    .sort((a, b) => b.score - a.score);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Analysis</h3>
        <div className="text-center py-12">
          <p className="text-gray-500">Complete assessments to see your skill analysis</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Analysis by Category</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="category" type="category" width={100} />
            <Tooltip 
              formatter={(value, name) => [`${value}%`, 'Average Score']}
              labelFormatter={(label) => `Category: ${label}`}
            />
            <Bar 
              dataKey="score" 
              fill={(entry) => getScoreColor(entry.score)}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {chartData.slice(0, 4).map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{item.category}</p>
              <p className="text-sm text-gray-600">{item.assessments} assessments</p>
            </div>
            <div className="text-right">
              <p className={`font-bold ${
                item.score >= 80 ? 'text-green-600' : 
                item.score >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {item.score}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}