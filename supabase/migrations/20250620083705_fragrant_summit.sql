/*
  # Seed Sample Data for DevSkill Pro

  This migration adds sample categories, questions, assessments, and coding challenges
  to populate the application with initial content for testing and demonstration.
*/

-- Insert sample categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('JavaScript', 'Core JavaScript concepts and ES6+ features', 'Code', '#F7DF1E'),
  ('React', 'React hooks, components, and state management', 'Atom', '#61DAFB'),
  ('TypeScript', 'Type safety and advanced TypeScript features', 'FileCode', '#3178C6'),
  ('Node.js', 'Backend development with Node.js', 'Server', '#339933'),
  ('Python', 'Python programming fundamentals and advanced topics', 'Snake', '#3776AB'),
  ('Data Structures', 'Arrays, objects, algorithms, and complexity', 'TreePine', '#FF6B6B'),
  ('System Design', 'Scalability, architecture, and design patterns', 'Network', '#4ECDC4'),
  ('SQL', 'Database queries and optimization', 'Database', '#336791')
ON CONFLICT (name) DO NOTHING;

-- Get category IDs for reference
DO $$
DECLARE
  js_id uuid;
  react_id uuid;
  ts_id uuid;
  node_id uuid;
  python_id uuid;
  ds_id uuid;
  sys_id uuid;
  sql_id uuid;
BEGIN
  SELECT id INTO js_id FROM categories WHERE name = 'JavaScript';
  SELECT id INTO react_id FROM categories WHERE name = 'React';
  SELECT id INTO ts_id FROM categories WHERE name = 'TypeScript';
  SELECT id INTO node_id FROM categories WHERE name = 'Node.js';
  SELECT id INTO python_id FROM categories WHERE name = 'Python';
  SELECT id INTO ds_id FROM categories WHERE name = 'Data Structures';
  SELECT id INTO sys_id FROM categories WHERE name = 'System Design';
  SELECT id INTO sql_id FROM categories WHERE name = 'SQL';

  -- Insert JavaScript questions
  INSERT INTO questions (category_id, question_text, options, correct_answer, explanation, difficulty_level, points) VALUES
    (js_id, 'What is the output of console.log(typeof null)?', '["null", "undefined", "object", "boolean"]', 'object', 'In JavaScript, typeof null returns "object" due to a historical bug that has been kept for compatibility.', 'easy', 10),
    (js_id, 'Which method is used to add an element to the end of an array?', '["push()", "pop()", "shift()", "unshift()"]', 'push()', 'The push() method adds one or more elements to the end of an array and returns the new length.', 'easy', 10),
    (js_id, 'What does the spread operator (...) do?', '["Combines arrays", "Spreads array elements", "Creates a copy", "All of the above"]', 'All of the above', 'The spread operator can be used to expand arrays, combine them, and create shallow copies.', 'medium', 15),
    (js_id, 'What is a closure in JavaScript?', '["A function with access to outer scope", "A way to close files", "A type of loop", "A conditional statement"]', 'A function with access to outer scope', 'A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function has finished executing.', 'hard', 20);

  -- Insert React questions
  INSERT INTO questions (category_id, question_text, options, correct_answer, explanation, difficulty_level, points) VALUES
    (react_id, 'What hook is used to manage state in functional components?', '["useState", "useEffect", "useContext", "useReducer"]', 'useState', 'useState is the primary hook for managing local state in functional components.', 'easy', 10),
    (react_id, 'When does useEffect run by default?', '["Before render", "After every render", "On mount only", "On unmount only"]', 'After every render', 'By default, useEffect runs after every completed render, both on mount and updates.', 'medium', 15),
    (react_id, 'What is the purpose of the key prop in React lists?', '["Styling", "Performance optimization", "Event handling", "State management"]', 'Performance optimization', 'Keys help React identify which items have changed, been added, or removed, optimizing re-renders.', 'medium', 15),
    (react_id, 'What is React.memo used for?', '["Memoizing components", "Managing memory", "Creating refs", "Handling errors"]', 'Memoizing components', 'React.memo is a higher order component that memoizes the result and skips re-rendering if props haven''t changed.', 'hard', 20);

  -- Insert TypeScript questions
  INSERT INTO questions (category_id, question_text, options, correct_answer, explanation, difficulty_level, points) VALUES
    (ts_id, 'What is the difference between interface and type in TypeScript?', '["No difference", "Interface is extensible", "Type is more flexible", "Both B and C"]', 'Both B and C', 'Interfaces can be extended and merged, while types are more flexible with unions and computed properties.', 'medium', 15),
    (ts_id, 'What does the ! operator do in TypeScript?', '["Logical NOT", "Non-null assertion", "Type guard", "Optional chaining"]', 'Non-null assertion', 'The ! operator tells TypeScript that a value is not null or undefined, overriding type checking.', 'medium', 15),
    (ts_id, 'What is a generic in TypeScript?', '["A type variable", "A function type", "A class type", "A primitive type"]', 'A type variable', 'Generics allow you to create reusable components that work with multiple types using type variables.', 'hard', 20);

  -- Insert Python questions
  INSERT INTO questions (category_id, question_text, options, correct_answer, explanation, difficulty_level, points) VALUES
    (python_id, 'What is the output of print(3 * "Hello")?', '["HelloHelloHello", "Error", "3Hello", "Hello3"]', 'HelloHelloHello', 'In Python, multiplying a string by an integer repeats the string that many times.', 'easy', 10),
    (python_id, 'What is a list comprehension?', '["A way to create lists", "A type of loop", "A function", "A class method"]', 'A way to create lists', 'List comprehensions provide a concise way to create lists based on existing lists or iterables.', 'medium', 15),
    (python_id, 'What does the yield keyword do?', '["Returns a value", "Creates a generator", "Stops execution", "Raises exception"]', 'Creates a generator', 'The yield keyword creates a generator function that can pause and resume execution.', 'hard', 20);

  -- Create sample assessments
  INSERT INTO assessments (category_id, title, description, duration_minutes, total_questions, difficulty_level) VALUES
    (js_id, 'JavaScript Fundamentals', 'Test your knowledge of core JavaScript concepts', 20, 4, 'beginner'),
    (react_id, 'React Hooks & Components', 'Assess your React development skills', 25, 4, 'intermediate'),
    (ts_id, 'TypeScript Advanced Features', 'Advanced TypeScript concepts and patterns', 30, 3, 'advanced'),
    (python_id, 'Python Programming Basics', 'Fundamental Python programming concepts', 20, 3, 'beginner');

  -- Link questions to assessments
  INSERT INTO assessment_questions (assessment_id, question_id, order_index)
  SELECT a.id, q.id, row_number() OVER (PARTITION BY a.id ORDER BY q.created_at) - 1
  FROM assessments a
  JOIN questions q ON a.category_id = q.category_id;

END $$;

-- Insert sample coding challenges
INSERT INTO coding_challenges (
  category_id, 
  title, 
  description, 
  difficulty_level, 
  starter_code, 
  solution_code,
  test_cases,
  constraints,
  time_limit_minutes,
  points,
  tags
) VALUES
(
  (SELECT id FROM categories WHERE name = 'JavaScript'),
  'Two Sum',
  'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].',
  'easy',
  'function twoSum(nums, target) {
  // Your code here
  
}',
  'function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}',
  '[
    {"input": {"nums": [2,7,11,15], "target": 9}, "output": [0,1]},
    {"input": {"nums": [3,2,4], "target": 6}, "output": [1,2]},
    {"input": {"nums": [3,3], "target": 6}, "output": [0,1]}
  ]',
  'Array length: 2 ≤ nums.length ≤ 10^4
Numbers: -10^9 ≤ nums[i] ≤ 10^9
Target: -10^9 ≤ target ≤ 10^9',
  30,
  50,
  ARRAY['array', 'hash-table', 'easy']
),
(
  (SELECT id FROM categories WHERE name = 'JavaScript'),
  'Palindrome Check',
  'Write a function to check if a given string is a palindrome. A palindrome is a word, phrase, number, or other sequence of characters that reads the same forward and backward.

Example:
Input: "racecar"
Output: true

Input: "hello"
Output: false',
  'easy',
  'function isPalindrome(s) {
  // Your code here
  
}',
  'function isPalindrome(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned === cleaned.split("").reverse().join("");
}',
  '[
    {"input": {"s": "racecar"}, "output": true},
    {"input": {"s": "hello"}, "output": false},
    {"input": {"s": "A man a plan a canal Panama"}, "output": true},
    {"input": {"s": "race a car"}, "output": false}
  ]',
  'String length: 1 ≤ s.length ≤ 1000
Characters: Alphanumeric characters and spaces only',
  20,
  30,
  ARRAY['string', 'two-pointers', 'easy']
),
(
  (SELECT id FROM categories WHERE name = 'Python'),
  'FizzBuzz',
  'Write a program that prints the numbers from 1 to n. But for multiples of three print "Fizz" instead of the number and for the multiples of five print "Buzz". For numbers which are multiples of both three and five print "FizzBuzz".

Example:
Input: n = 15
Output: ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]',
  'easy',
  'def fizzbuzz(n):
    # Your code here
    pass',
  'def fizzbuzz(n):
    result = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            result.append("FizzBuzz")
        elif i % 3 == 0:
            result.append("Fizz")
        elif i % 5 == 0:
            result.append("Buzz")
        else:
            result.append(str(i))
    return result',
  '[
    {"input": {"n": 3}, "output": ["1","2","Fizz"]},
    {"input": {"n": 5}, "output": ["1","2","Fizz","4","Buzz"]},
    {"input": {"n": 15}, "output": ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]}
  ]',
  'Range: 1 ≤ n ≤ 10^4',
  15,
  25,
  ARRAY['math', 'string', 'easy']
);