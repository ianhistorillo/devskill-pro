import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase, CodingChallenge, Category } from '../../lib/supabase';
import { Code, Clock, Trophy, Filter, Search, Tag, CheckCircle, Star, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export function ChallengesList() {
  const location = useLocation();
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Check if we have completion data from navigation state
  const completedChallenge = location.state?.completedChallenge;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Show completion message if we have completion data
    if (completedChallenge) {
      const message = completedChallenge.status === 'passed' 
        ? `🎉 Challenge completed successfully! Earned ${completedChallenge.score} points`
        : `Challenge submitted! Keep practicing to improve your score.`;
      
      toast.success(message, { duration: 5000 });
      
      // Clear the state to prevent showing the message again
      window.history.replaceState({}, document.title);
    }
  }, [completedChallenge]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simple parallel queries without timeouts
      const [challengesResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('coding_challenges')
          .select(`
            *,
            category:categories(*)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .order('name')
      ]);

      if (challengesResponse.error) {
        console.error('❌ Failed to load challenges:', challengesResponse.error);
        setChallenges([]);
      } else {
        setChallenges(challengesResponse.data || []);
        console.log('✅ Challenges loaded:', challengesResponse.data?.length || 0);
      }

      if (categoriesResponse.error) {
        console.error('❌ Failed to load categories:', categoriesResponse.error);
        setCategories([]);
      } else {
        setCategories(categoriesResponse.data || []);
        console.log('✅ Categories loaded:', categoriesResponse.data?.length || 0);
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError('Failed to load challenges');
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || challenge.category_id === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || challenge.difficulty_level === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <Zap className="h-3 w-3" />;
      case 'medium': return <Star className="h-3 w-3" />;
      case 'hard': return <Trophy className="h-3 w-3" />;
      default: return <Code className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading challenges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Challenges</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Coding Challenges</h1>
        <p className="text-gray-600">Practice your programming skills with real-world coding problems and improve your problem-solving abilities</p>
        
        {/* Show completion message */}
        {completedChallenge && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-2 mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Challenge Completed!</h3>
                <p className="text-green-800 mt-1">
                  <strong>{completedChallenge.title}</strong> - Status: <span className="capitalize">{completedChallenge.status}</span>
                  {completedChallenge.score > 0 && ` • Earned ${completedChallenge.score} points`}
                  {completedChallenge.language && ` • Language: ${completedChallenge.language}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search challenges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter className="h-4 w-4 mr-2" />
            {filteredChallenges.length} challenges found
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChallenges.map(challenge => (
          <div key={challenge.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 overflow-hidden group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {challenge.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3 leading-relaxed">
                    {challenge.description.split('\n')[0]}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getDifficultyColor(challenge.difficulty_level)}`}>
                  {getDifficultyIcon(challenge.difficulty_level)}
                  <span className="capitalize">{challenge.difficulty_level}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {challenge.time_limit_minutes} min
                  </div>
                  <div className="flex items-center">
                    <Trophy className="h-4 w-4 mr-1" />
                    {challenge.points} pts
                  </div>
                </div>
              </div>

              {challenge.tags && challenge.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {challenge.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                  {challenge.tags.length > 3 && (
                    <span className="text-xs text-gray-500 px-2 py-1">+{challenge.tags.length - 3} more</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{challenge.category?.name}</span>
                </div>
                <Link
                  to={`/challenges/${challenge.id}`}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  Solve Challenge
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredChallenges.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Code className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters to find more challenges</p>
        </div>
      )}
    </div>
  );
}