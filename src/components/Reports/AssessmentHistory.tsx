import React from 'react';
import { Link } from 'react-router-dom';
import { UserAssessment } from '../../lib/supabase';
import { CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

interface AssessmentHistoryProps {
  userAssessments: UserAssessment[];
}

export function AssessmentHistory({ userAssessments }: AssessmentHistoryProps) {
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

  const getScoreColor = (score: number, totalPoints: number) => {
    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Assessment History</h3>
        <Link
          to="/assessments"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
        >
          Take Assessment
          <ExternalLink className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {userAssessments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No assessments taken yet</p>
          <Link
            to="/assessments"
            className="inline-block text-blue-600 hover:text-blue-700 font-medium"
          >
            Take your first assessment
          </Link>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {userAssessments.slice(0, 10).map((ua) => (
            <div key={ua.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                {getStatusIcon(ua.status)}
                <div>
                  <h4 className="font-medium text-gray-900">
                    {ua.assessment?.title || 'Assessment'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {ua.assessment?.category?.name} • {new Date(ua.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {ua.status === 'completed' && (
                  <>
                    <p className={`text-sm font-medium ${getScoreColor(ua.score, ua.total_points)}`}>
                      {ua.total_points > 0 ? Math.round((ua.score / ua.total_points) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {ua.score}/{ua.total_points} points
                    </p>
                  </>
                )}
                {ua.status === 'in_progress' && (
                  <Link
                    to={`/assessments/${ua.assessment_id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Continue
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}