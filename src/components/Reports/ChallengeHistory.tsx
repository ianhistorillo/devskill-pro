import React from 'react';
import { Link } from 'react-router-dom';
import { UserChallengeSubmission } from '../../lib/supabase';
import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

interface ChallengeHistoryProps {
  challengeSubmissions: UserChallengeSubmission[];
}

export function ChallengeHistory({ challengeSubmissions }: ChallengeHistoryProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Challenge History</h3>
        <Link
          to="/challenges"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
        >
          Solve Challenge
          <ExternalLink className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {challengeSubmissions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No challenges attempted yet</p>
          <Link
            to="/challenges"
            className="inline-block text-blue-600 hover:text-blue-700 font-medium"
          >
            Try your first challenge
          </Link>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {challengeSubmissions.slice(0, 10).map((cs) => (
            <div key={cs.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                {getStatusIcon(cs.status)}
                <div>
                  <h4 className="font-medium text-gray-900">
                    {cs.challenge?.title || 'Challenge'}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-gray-600">
                      {cs.challenge?.category?.name}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getDifficultyColor(cs.challenge?.difficulty_level || '')
                    }`}>
                      {cs.challenge?.difficulty_level}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {cs.score} points
                </p>
                <p className="text-xs text-gray-500">
                  {cs.execution_time_ms}ms • {cs.language}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(cs.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}