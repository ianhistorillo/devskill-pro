import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  points: number;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_questions: number;
}

export default function AssessmentTaking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchAssessmentData();
    }
  }, [id, user]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && assessment) {
      handleSubmit();
    }
  }, [timeLeft, assessment]);

  const fetchAssessmentData = async () => {
    try {
      // Fetch assessment details
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .single();

      if (assessmentError) throw assessmentError;

      setAssessment(assessmentData);
      setTimeLeft(assessmentData.duration_minutes * 60);

      // Fetch questions for this assessment
      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select(`
          questions (
            id,
            question_text,
            question_type,
            options,
            correct_answer,
            points
          )
        `)
        .eq('assessment_id', id)
        .order('order_index');

      if (questionsError) throw questionsError;

      const formattedQuestions = questionsData.map((item: any) => item.questions);
      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast.error('Failed to load assessment');
      navigate('/assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestionIndex].id]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !assessment || submitting) return;

    setSubmitting(true);
    try {
      // Calculate score and prepare answers
      let totalScore = 0;
      let totalPoints = 0;
      const userAnswers = [];

      for (const question of questions) {
        const userAnswer = answers[question.id] || '';
        const isCorrect = userAnswer.trim() === question.correct_answer.trim();
        const pointsEarned = isCorrect ? question.points : 0;
        
        totalScore += pointsEarned;
        totalPoints += question.points;

        userAnswers.push({
          question_id: question.id,
          user_answer: userAnswer,
          is_correct: isCorrect,
          points_earned: pointsEarned
        });
      }

      // Create user assessment record
      const { data: userAssessment, error: assessmentError } = await supabase
        .from('user_assessments')
        .insert({
          user_id: user.id,
          assessment_id: assessment.id,
          status: 'completed',
          score: totalScore,
          total_points: totalPoints,
          time_taken_minutes: Math.ceil((assessment.duration_minutes * 60 - timeLeft) / 60),
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Save individual answers
      const answersWithAssessmentId = userAnswers.map(answer => ({
        ...answer,
        user_assessment_id: userAssessment.id
      }));

      const { error: answersError } = await supabase
        .from('user_answers')
        .insert(answersWithAssessmentId);

      if (answersError) throw answersError;

      toast.success('Assessment completed successfully!');
      navigate(`/assessments/${assessment.id}/results`, {
        state: { userAssessmentId: userAssessment.id, justSubmitted: true }
      });
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Assessment Not Found</h2>
          <p className="text-gray-600 mb-4">The assessment you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/assessments')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
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
                <span className={timeLeft < 300 ? 'text-red-600 font-semibold' : ''}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Answered: {answeredCount}/{questions.length}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                Question {currentQuestionIndex + 1}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                {currentQuestion.points} points
              </span>
            </div>
            <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  answers[currentQuestion.id] === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-3">
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Assessment
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Question Navigation</h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 text-xs rounded-full border-2 transition-colors ${
                  index === currentQuestionIndex
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : answers[questions[index].id]
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}