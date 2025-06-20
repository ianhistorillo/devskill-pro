import React from 'react';
import { Link } from 'react-router-dom';
import { Assessment, CodingChallenge } from '../../lib/supabase';
import { PlayCircle, Code, BookOpen, BarChart3 } from 'lucide-react';

interface QuickActionsProps {
  assessments: Assessment[];
  challenges: CodingChallenge[];
}

export function QuickActions({ assessments, challenges }: QuickActionsProps) {
  const quickActions = [
    {
      title: 'Take Assessment',
      description: 'Test your knowledge with interactive quizzes',
      icon: PlayCircle,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      link: '/assessments',
    },
    {
      title: 'Solve Challenge',
      description: 'Practice coding with real-world problems',
      icon: Code,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      link: '/challenges',
    },
    {
      title: 'Study Materials',
      description: 'Review concepts and best practices',
      icon: BookOpen,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      link: '/materials',
    },
    {
      title: 'View Reports',
      description: 'Analyze your performance and progress',
      icon: BarChart3,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      link: '/reports',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className={`${action.bgColor} rounded-lg p-2 group-hover:scale-105 transition-transform`}>
                <action.icon className={`h-5 w-5 ${action.color.replace('bg-', 'text-')}`} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Assessments</h3>
        <div className="space-y-3">
          {assessments.slice(0, 3).map((assessment) => (
            <Link
              key={assessment.id}
              to={`/assessments/${assessment.id}`}
              className="block p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                    {assessment.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {assessment.category?.name} • {assessment.total_questions} questions
                  </p>
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {assessment.difficulty_level}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Challenges</h3>
        <div className="space-y-3">
          {challenges.slice(0, 3).map((challenge) => (
            <Link
              key={challenge.id}
              to={`/challenges/${challenge.id}`}
              className="block p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 group-hover:text-purple-600">
                    {challenge.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {challenge.category?.name} • {challenge.points} points
                  </p>
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {challenge.difficulty_level}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}