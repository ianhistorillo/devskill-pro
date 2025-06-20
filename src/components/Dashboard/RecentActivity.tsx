import React from 'react';
import { Link } from 'react-router-dom';
import { UserAssessment } from '../../lib/supabase';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface RecentActivityProps {
  userAssessments: UserAssessment[];
}

export function RecentActivity({ userAssessments }: RecentActivityProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'abandoned':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'abandoned':
        return 'Abandoned';
      default:
        return 'Unknown';
    }
  };

  const getScoreColor = (score: number, totalPoints: number) => {
    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Link
          to="/reports"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </Link>
      </div>

      {userAssessments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No assessments taken yet</p>
          <Link
            to="/assessments"
            className="inline-block mt-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Take your first assessment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {userAssessments.slice(0, 5).map((ua) => (
            <div key={ua.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(ua.status)}
                <div>
                  <h4 className="font-medium text-gray-900">
                    {ua.assessment?.title || 'Assessment'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {ua.assessment?.category?.name} • {getStatusText(ua.status)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {ua.status === 'completed' && (
                  <p className={`text-sm font-medium ${getScoreColor(ua.score, ua.total_points)}`}>
                    {ua.total_points > 0 ? Math.round((ua.score / ua.total_points) * 100) : 0}%
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {new Date(ua.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}