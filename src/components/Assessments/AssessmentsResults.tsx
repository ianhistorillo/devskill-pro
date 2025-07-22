import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase, Assessment, Question, UserAssessment, UserAnswer } from '../../lib/supabase';
import { CheckCircle, XCircle, Clock, Trophy, ArrowLeft, RotateCcw, Target, Award } from 'lucide-react';
import toast from 'react-hot-toast';

interface AssessmentResultsData {
  assessment: Assessment;
  userAssessment: UserAssessment;
  questions: Question[];
  userAnswers: UserAnswer[];
}

export function AssessmentResults() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [data, setData] = useState<AssessmentResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get userAssessmentId from navigation state or find the latest completed one
  const userAssessmentId = location.state?.userAssessmentId;
  const fromSubmission = location.state?.fromSubmission;

  useEffect(() => {
    if (id && user) {
      fetchResults();
    }
  }, [id, user]);

  useEffect(() => {
    if (fromSubmission) {
      toast.success('Assessment completed! Here are your detailed results.', { duration: 5000 });
    }
  }, [fromSubmission]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assessment details
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', id)
        .single();

      if (assessmentError || !assessmentData) {
        throw new Error('Assessment not found');
      }

      // Find the user assessment to show results for
      let targetUserAssessmentId = userAssessmentId;
      
      if (!targetUserAssessmentId) {
        // Find the most recent completed assessment for this user and assessment
        const { data: recentAssessment, error: recentError } = await supabase
          .from('user_assessments')
          .select('id')
          .eq('user_id', user!.id)
          .eq('assessment_id', id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentError && recentError.code !== 'PGRST116') {
          throw recentError;
        }

        if (!recentAssessment) {
          throw new Error('No completed assessment found. Please take the assessment first.');
        }

        targetUserAssessmentId = recentAssessment.id;
      }

      // Fetch user assessment details
      const { data: userAssessmentData, error: userAssessmentError } = await supabase
        .from('user_assessments')
        .select('*')
        .eq('id', targetUserAssessmentId)
        .eq('user_id', user!.id)
        .single();

      if (userAssessmentError || !userAssessmentData) {
        throw new Error('Assessment results not found');
      }

      if (userAssessmentData.status !== 'completed') {
        throw new Error('Assessment is not completed yet');
      }

      // Fetch questions for this assessment
      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select(`
          order_index,
          question:questions(*)
        `)
        .eq('assessment_id', id)
        .order('order_index');

      if (questionsError) throw questionsError;

      const questions = questionsData?.map(aq => aq.question).filter(Boolean) || [];

      // Fetch user answers
      const { data: userAnswersData, error: userAnswersError } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_assessment_id', targetUserAssessmentId);

      if (userAnswersError) throw userAnswersError;

      setData({
        assessment: assessmentData,
        userAssessment: userAssessmentData,
        questions,
        userAnswers: userAnswersData || []
      });

    } catch (error: any) {
      console.error('Error fetching results:', error);
      setError(error.message || 'Failed to load assessment results');
      toast.error(error.message || 'Failed to load assessment results');
    } finally {
      setLoading(false);
    }
  };

  const retakeAssessment = () => {
    navigate(`/assessments/${id}`);
  };

  const goBackToAssessments = () => {
    navigate('/assessments');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Results Not Available</h2>
          <p className="text-gray-600 mb-4">{error || 'Assessment results could not be loaded.'}</p>
          <button
            onClick={goBackToAssessments}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  const { assessment, userAssessment, questions, userAnswers } = data;
  const percentage = userAssessment.total_points > 0 ? Math.round((userAssessment.score / userAssessment.total_points) * 100) : 0;
  const correctAnswers = userAnswers.filter(ua => ua.is_correct).length;
  const totalQuestions = questions.length;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return 'Outstanding! You have excellent knowledge in this area.';
    if (percentage >= 80) return 'Great job! You have strong understanding of the concepts.';
    if (percentage >= 70) return 'Good work! You have solid knowledge with room for improvement.';
    if (percentage >= 60) return 'Fair performance. Consider reviewing the concepts you missed.';
    return 'Keep practicing! Review the explanations and try again.';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={goBackToAssessments}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Assessments
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{assessment.title} - Results</h1>
              <p className="text-gray-600">{assessment.category?.name}</p>
            </div>
            <button
              onClick={retakeAssessment}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Assessment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Overview */}
        <div className={`rounded-xl border-2 p-8 mb-8 ${getScoreBgColor(percentage)}`}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white rounded-full p-4 shadow-lg">
                <Trophy className={`h-12 w-12 ${getScoreColor(percentage)}`} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Your Score: <span className={getScoreColor(percentage)}>{percentage}%</span>
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              {correctAnswers} out of {totalQuestions} questions correct
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {getPerformanceMessage(percentage)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{correctAnswers}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{totalQuestions - correctAnswers}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{userAssessment.time_taken_minutes || 0}</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Detailed Results</h3>
          
          <div className="space-y-6">
            {questions.map((question, index) => {
              const userAnswer = userAnswers.find(ua => ua.question_id === question.id);
              const isCorrect = userAnswer?.is_correct === true;
              const userResponse = userAnswer?.user_answer || '';
              const pointsEarned = userAnswer?.points_earned || 0;

              return (
                <div key={question.id} className={`border-2 rounded-lg p-6 ${
                  isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium">
                          Question {index + 1}
                        </span>
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          isCorrect ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isCorrect ? 'Correct' : (userResponse.trim() ? 'Incorrect' : 'Not Answered')}
                        </span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        {question.question_text}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Points</div>
                      <div className="font-bold text-gray-900">
                        {pointsEarned}/{question.points}
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  {question.options && (
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optionIndex) => {
                        const isUserAnswer = userResponse.trim() === option.trim();
                        const isCorrectAnswer = question.correct_answer === option;
                        
                        let optionClass = 'p-3 border rounded-lg ';
                        if (isCorrectAnswer) {
                          optionClass += 'border-green-300 bg-green-100 text-green-800';
                        } else if (isUserAnswer && !isCorrectAnswer) {
                          optionClass += 'border-red-300 bg-red-100 text-red-800';
                        } else {
                          optionClass += 'border-gray-200 bg-gray-50 text-gray-700';
                        }

                        return (
                          <div key={optionIndex} className={optionClass}>
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              <div className="flex items-center space-x-2">
                                {isUserAnswer && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Your Answer
                                  </span>
                                )}
                                {isCorrectAnswer && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    Correct Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-2">Explanation:</h5>
                      <p className="text-blue-800 text-sm">{question.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4 mt-8">
          <button
            onClick={goBackToAssessments}
            className="flex items-center border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </button>
          <button
            onClick={retakeAssessment}
            className="flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake Assessment
          </button>
        </div>
      </div>
    </div>
  );
}