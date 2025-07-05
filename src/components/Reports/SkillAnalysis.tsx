import React from 'react';
import { UserAssessment, UserChallengeSubmission } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
      
      // Only process valid scores (not NaN)
      if (!isNaN(score) && isFinite(score)) {
        if (!categoryScores[categoryName]) {
          categoryScores[categoryName] = { total: 0, count: 0, name: categoryName };
        }
        
        categoryScores[categoryName].total += score;
        categoryScores[categoryName].count += 1;
      }
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
    .map(category => {
      // Ensure avgScore is always a valid number, never NaN
      const avgScore = category.count > 0 ? category.total / category.count : 0;
      return {
        category: category.name,
        score: Math.round(avgScore),
        assessments: category.count,
      };
    })
    .filter(item => !isNaN(item.score) && isFinite(item.score) && item.score >= 0) // Filter out invalid scores
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
    if (isNaN(score) || !isFinite(score)) return '#6B7280'; // Gray for invalid scores
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
              formatter={(value, name) => {
                const score = Number(value);
                if (isNaN(score) || !isFinite(score)) return ['N/A', 'Average Score'];
                return [`${score}%`, 'Average Score'];
              }}
              labelFormatter={(label) => `Category: ${label}`}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
              ))}
            </Bar>
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
                isNaN(item.score) || !isFinite(item.score) ? 'text-gray-600' :
                item.score >= 80 ? 'text-green-600' : 
                item.score >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {isNaN(item.score) || !isFinite(item.score) ? 'N/A' : `${item.score}%`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}