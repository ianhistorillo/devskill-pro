import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase, Assessment, Question, UserAssessment, UserAnswer } from '../../lib/supabase';
import { Clock, CheckCircle, AlertCircle, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

export function AssessmentTaking() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAssessment, setUserAssessment] = useState<UserAssessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && user) {
      initializeAssessment();
    }
  }, [id, user]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && userAssessment && !submitting && questions.length > 0) {
      // Only auto-submit if user has actually started the assessment
      const hasAnswers = Object.keys(answers).length > 0;
      if (hasAnswers) {
        toast.error('Time limit reached! Submitting your assessment...');
        handleSubmitAssessment();
      }
    }
  }, [timeRemaining, userAssessment, submitting, questions.length, answers]);

  const initializeAssessment = async () => {
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

      setAssessment(assessmentData);

      // Check for existing in-progress assessment
      const { data: inProgressAssessment, error: inProgressError } = await supabase
        .from('user_assessments')
        .select('*')
        .eq('user_id', user!.id)
        .eq('assessment_id', id)
        .eq('status', 'in_progress')
        .maybeSingle();

      if (inProgressError && inProgressError.code !== 'PGRST116') {
        throw inProgressError;
      }

      let currentUserAssessment = inProgressAssessment;

      // Create new assessment if no in-progress one exists OR if user wants to retake
      if (!inProgressAssessment) {
        // Check if this is a retake (user has completed assessments before)
        const { data: completedAssessments, error: completedError } = await supabase
          .from('user_assessments')
          .select('*')
          .eq('user_id', user!.id)
          .eq('assessment_id', id)
          .eq('status', 'completed');

        if (completedError && completedError.code !== 'PGRST116') {
          throw completedError;
        }

        const isRetake = completedAssessments && completedAssessments.length > 0;

        const { data: newAssessment, error: createError } = await supabase
          .from('user_assessments')
          .insert({
            user_id: user!.id,
            assessment_id: id,
            status: 'in_progress',
            score: 0,
            total_points: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        currentUserAssessment = newAssessment;
        
        if (isRetake) {
          toast.success('Starting a fresh attempt for this assessment. Good luck!');
        } else {
          toast.success('Assessment started! Good luck!');
        }
      } else {
        toast.success('Continuing your previous assessment...');
      }

      setUserAssessment(currentUserAssessment);

      // Fetch questions for this assessment
      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select(`
          question:questions(*)
        `)
        .eq('assessment_id', id)
        .order('order_index');

      if (questionsError) throw questionsError;

      const assessmentQuestions = questionsData?.map(aq => aq.question).filter(Boolean) || [];
      
      if (assessmentQuestions.length === 0) {
        throw new Error('No questions found for this assessment');
      }

      setQuestions(assessmentQuestions);

      // Calculate time remaining - for fresh assessments, use full duration
      if (inProgressAssessment) {
        // Continuing existing assessment - calculate remaining time
        const startTime = new Date(currentUserAssessment.started_at).getTime();
        const currentTime = new Date().getTime();
        const elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60));
        const remainingMinutes = Math.max(0, assessmentData.duration_minutes - elapsedMinutes);
        setTimeRemaining(remainingMinutes * 60);
      } else {
        // Fresh assessment - use full duration
        setTimeRemaining(assessmentData.duration_minutes * 60);
      }

      // Load existing answers if resuming
      if (inProgressAssessment) {
        const { data: existingAnswers, error: answersError } = await supabase
          .from('user_answers')
          .select('*')
          .eq('user_assessment_id', currentUserAssessment.id);

        if (answersError) {
          console.error('Error loading existing answers:', answersError);
        } else {
          const answersMap: Record<string, string> = {};
          existingAnswers?.forEach(answer => {
            answersMap[answer.question_id] = answer.user_answer || '';
          });
          setAnswers(answersMap);
        }
      } else {
        // Fresh assessment - clear any existing answers
        setAnswers({});
      }

    } catch (error: any) {
      console.error('Error initializing assessment:', error);
      setError(error.message || 'Failed to load assessment');
      toast.error(error.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = async (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));

    // Save answer to database immediately
    try {
      const { error } = await supabase
        .from('user_answers')
        .upsert({
          user_assessment_id: userAssessment!.id,
          question_id: questionId,
          user_answer: answer,
        });

      if (error) {
        console.error('Error saving answer:', error);
        toast.error('Failed to save answer. Please try again.');
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleSubmitAssessment = async () => {
    if (submitting || !userAssessment) return;
    
    // Check if user has answered any questions
    const answeredQuestions = Object.keys(answers).filter(questionId => answers[questionId]?.trim());
    
    if (answeredQuestions.length === 0) {
      toast.error('Please answer at least one question before submitting.');
      return;
    }
    
    // Confirm submission
    const confirmSubmit = window.confirm(
      `Are you sure you want to submit your assessment? You have answered ${answeredQuestions.length} out of ${questions.length} questions. This action cannot be undone.`
    );
    
    if (!confirmSubmit) return;

    setSubmitting(true);

    try {
      // Calculate score
      let totalScore = 0;
      let totalPoints = 0;

      for (const question of questions) {
        totalPoints += question.points;
        const userAnswer = answers[question.id];
        const isCorrect = userAnswer === question.correct_answer;
        
        if (isCorrect) {
          totalScore += question.points;
        }

        // Update user answer with correctness and points
        await supabase
          .from('user_answers')
          .upsert({
            user_assessment_id: userAssessment.id,
            question_id: question.id,
            user_answer: userAnswer || '',
            is_correct: isCorrect,
            points_earned: isCorrect ? question.points : 0,
          });
      }

      // Update user assessment to completed
      const timeTaken = Math.ceil((assessment!.duration_minutes * 60 - timeRemaining) / 60);
      
      const { error: updateError } = await supabase
        .from('user_assessments')
        .update({
          status: 'completed',
          score: totalScore,
          total_points: totalPoints,
          time_taken_minutes: timeTaken,
          completed_at: new Date().toISOString(),
        })
        .eq('id', userAssessment.id);

      if (updateError) throw updateError;

      toast.success('Assessment completed successfully!');
      
      // Navigate to results page with the user assessment data
      navigate(`/assessments/${assessment.id}/results`, { 
        state: { 
          userAssessmentId: userAssessment.id,
          fromSubmission: true
        }
      });
    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Assessment Not Available</h2>
          <p className="text-gray-600 mb-4">{error || 'This assessment could not be loaded.'}</p>
          <button
            onClick={() => navigate('/assessments')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{assessment.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                <span className={timeRemaining < 300 ? 'text-red-600 font-medium' : ''}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <button
                onClick={handleSubmitAssessment}
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {currentQuestion.question_text}
            </h2>
            
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.question_type === 'true_false' && (
              <div className="space-y-3">
                {['True', 'False'].map((option) => (
                  <label key={option} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded-full text-sm font-medium ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[questions[index].id]
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}