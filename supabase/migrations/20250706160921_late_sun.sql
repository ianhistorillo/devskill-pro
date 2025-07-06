/*
  # Add More Test Assessments

  This migration adds comprehensive assessments for JavaScript, React, Next.js, and TypeScript
  with detailed questions covering various skill levels and topics.
*/

-- Add more JavaScript questions
INSERT INTO questions (category_id, question_text, options, correct_answer, explanation, difficulty_level, points) 
SELECT 
  (SELECT id FROM categories WHERE name = 'JavaScript'),
  question_text,
  options::jsonb,
  correct_answer,
  explanation,
  difficulty_level,
  points
FROM (VALUES
  ('What is the difference between let, const, and var?', '["No difference", "Scope and hoisting", "Only syntax", "Performance only"]', 'Scope and hoisting', 'let and const have block scope and temporal dead zone, while var has function scope and is hoisted.', 'medium', 15),
  ('What does Array.prototype.map() return?', '["Modified original array", "New array", "Boolean", "Undefined"]', 'New array', 'map() creates a new array with the results of calling a function for every array element.', 'easy', 10),
  ('What is event bubbling?', '["Event going up DOM tree", "Event going down DOM tree", "Event stopping", "Event creation"]', 'Event going up DOM tree', 'Event bubbling is when an event propagates from the target element up through its ancestors.', 'medium', 15),
  ('What is the purpose of Promise.all()?', '["Run promises sequentially", "Run promises in parallel", "Cancel promises", "Create promises"]', 'Run promises in parallel', 'Promise.all() runs multiple promises concurrently and resolves when all are fulfilled.', 'hard', 20),
  ('What is destructuring assignment?', '["Deleting variables", "Extracting values from arrays/objects", "Creating variables", "Copying variables"]', 'Extracting values from arrays/objects', 'Destructuring allows unpacking values from arrays or properties from objects into distinct variables.', 'medium', 15),
  ('What is the difference between == and ===?', '["No difference", "Type coercion vs strict equality", "Performance", "Syntax only"]', 'Type coercion vs strict equality', '== performs type coercion while === checks both value and type without conversion.', 'easy', 10),
  ('What is a callback function?', '["Function that calls back", "Function passed as argument", "Function that returns", "Function that loops"]', 'Function passed as argument', 'A callback is a function passed as an argument to another function to be executed later.', 'easy', 10),
  ('What is async/await?', '["Synchronous programming", "Syntactic sugar for Promises", "Error handling", "Loop control"]', 'Syntactic sugar for Promises', 'async/await provides a cleaner syntax for working with Promises and asynchronous code.', 'hard', 20)
) AS t(question_text, options, correct_answer, explanation, difficulty_level, points);

-- Add React questions
INSERT INTO questions (category_id, question_text, options, correct_answer, explanation, difficulty_level, points)
SELECT 
  (SELECT id FROM categories WHERE name = 'React'),
  question_text,
  options::jsonb,
  correct_answer,
  explanation,
  difficulty_level,
  points
FROM (VALUES
  ('What is JSX?', '["JavaScript XML", "Java Syntax Extension", "JSON Extension", "JavaScript Extension"]', 'JavaScript XML', 'JSX is a syntax extension for JavaScript that allows writing HTML-like code in React.', 'easy', 10),
  ('What is the Virtual DOM?', '["Real DOM copy", "JavaScript representation of DOM", "HTML template", "CSS framework"]', 'JavaScript representation of DOM', 'Virtual DOM is a JavaScript representation of the real DOM kept in memory and synced with real DOM.', 'medium', 15),
  ('What is the purpose of useCallback?', '["Memoize functions", "Handle callbacks", "Create callbacks", "Delete callbacks"]', 'Memoize functions', 'useCallback memoizes functions to prevent unnecessary re-renders of child components.', 'hard', 20),
  ('What is prop drilling?', '["Passing props through multiple levels", "Creating props", "Deleting props", "Modifying props"]', 'Passing props through multiple levels', 'Prop drilling is passing data through multiple component levels even when intermediate components don''t need it.', 'medium', 15),
  ('What is the difference between controlled and uncontrolled components?', '["State management", "Performance", "Syntax", "Styling"]', 'State management', 'Controlled components have their state managed by React, uncontrolled components manage their own state.', 'medium', 15),
  ('What is useReducer used for?', '["Complex state logic", "API calls", "Styling", "Routing"]', 'Complex state logic', 'useReducer is used for managing complex state logic that involves multiple sub-values or complex updates.', 'hard', 20),
  ('What is React.Fragment?', '["Wrapper without extra DOM node", "Component type", "Hook", "Method"]', 'Wrapper without extra DOM node', 'React.Fragment allows grouping multiple elements without adding extra nodes to the DOM.', 'easy', 10),
  ('What is the purpose of useRef?', '["Access DOM elements", "Manage state", "Handle effects", "Create components"]', 'Access DOM elements', 'useRef provides a way to access DOM elements directly and persist values across renders.', 'medium', 15)
) AS t(question_text, options, correct_answer, explanation, difficulty_level, points);

-- Add TypeScript questions
INSERT INTO questions (category_id, question_text, options, correct_answer, explanation, difficulty_level, points)
SELECT 
  (SELECT id FROM categories WHERE name = 'TypeScript'),
  question_text,
  options::jsonb,
  correct_answer,
  explanation,
  difficulty_level,
  points
FROM (VALUES
  ('What is TypeScript?', '["JavaScript superset", "New language", "Framework", "Library"]', 'JavaScript superset', 'TypeScript is a superset of JavaScript that adds static type definitions.', 'easy', 10),
  ('What is a union type?', '["Type that can be one of several types", "Combined types", "Array type", "Object type"]', 'Type that can be one of several types', 'Union types allow a value to be one of several types, written as Type1 | Type2.', 'medium', 15),
  ('What is the any type?', '["Disables type checking", "Any value type", "Array type", "Object type"]', 'Disables type checking', 'The any type disables TypeScript type checking and should be avoided when possible.', 'easy', 10),
  ('What is a mapped type?', '["Type based on another type", "Array mapping", "Object mapping", "Function mapping"]', 'Type based on another type', 'Mapped types create new types by transforming properties of existing types.', 'hard', 20),
  ('What is the never type?', '["Type that never occurs", "Empty type", "Null type", "Undefined type"]', 'Type that never occurs', 'The never type represents values that never occur, like functions that always throw errors.', 'hard', 20),
  ('What is type assertion?', '["Tell compiler about type", "Create new type", "Check type", "Convert type"]', 'Tell compiler about type', 'Type assertion tells the TypeScript compiler to treat a value as a specific type.', 'medium', 15),
  ('What is an enum?', '["Named constants", "Array type", "Object type", "Function type"]', 'Named constants', 'Enums allow defining a set of named constants, making code more readable and maintainable.', 'easy', 10),
  ('What is conditional typing?', '["Types based on conditions", "If-else for types", "Type checking", "Type conversion"]', 'Types based on conditions', 'Conditional types select types based on conditions, written as T extends U ? X : Y.', 'hard', 20)
) AS t(question_text, options, correct_answer, explanation, difficulty_level, points);

-- Add Next.js category and questions
INSERT INTO categories (name, description, icon, color) VALUES
  ('Next.js', 'React framework for production applications', 'Layers', '#000000')
ON CONFLICT (name) DO NOTHING;

INSERT INTO questions (category_id, question_text, options, correct_answer, explanation, difficulty_level, points)
SELECT 
  (SELECT id FROM categories WHERE name = 'Next.js'),
  question_text,
  options::jsonb,
  correct_answer,
  explanation,
  difficulty_level,
  points
FROM (VALUES
  ('What is Next.js?', '["React framework", "JavaScript library", "CSS framework", "Database"]', 'React framework', 'Next.js is a React framework that provides features like server-side rendering and static generation.', 'easy', 10),
  ('What is Server-Side Rendering (SSR)?', '["Rendering on server", "Rendering on client", "Static rendering", "Dynamic rendering"]', 'Rendering on server', 'SSR renders pages on the server at request time, providing better SEO and initial load performance.', 'medium', 15),
  ('What is Static Site Generation (SSG)?', '["Pre-rendering at build time", "Rendering at runtime", "Client-side rendering", "Server-side rendering"]', 'Pre-rendering at build time', 'SSG generates static HTML at build time, providing excellent performance and SEO.', 'medium', 15),
  ('What is the pages directory?', '["File-based routing", "Component storage", "Style storage", "API storage"]', 'File-based routing', 'The pages directory enables file-based routing where each file becomes a route automatically.', 'easy', 10),
  ('What is getStaticProps?', '["Fetch data at build time", "Fetch data at runtime", "Client-side fetching", "Server-side fetching"]', 'Fetch data at build time', 'getStaticProps fetches data at build time for static generation of pages.', 'medium', 15),
  ('What is getServerSideProps?', '["Fetch data on each request", "Fetch data at build time", "Client-side fetching", "Static fetching"]', 'Fetch data on each request', 'getServerSideProps fetches data on each request for server-side rendering.', 'medium', 15),
  ('What is the App Router?', '["New routing system", "Old routing system", "Component router", "API router"]', 'New routing system', 'App Router is the new routing system in Next.js 13+ that uses the app directory.', 'hard', 20),
  ('What are API routes?', '["Backend API in Next.js", "Frontend routes", "Static routes", "Dynamic routes"]', 'Backend API in Next.js', 'API routes allow creating backend API endpoints within a Next.js application.', 'medium', 15)
) AS t(question_text, options, correct_answer, explanation, difficulty_level, points);

-- Create comprehensive assessments
INSERT INTO assessments (category_id, title, description, duration_minutes, total_questions, difficulty_level) VALUES
  ((SELECT id FROM categories WHERE name = 'JavaScript'), 'JavaScript Advanced Concepts', 'Deep dive into advanced JavaScript features and patterns', 35, 8, 'advanced'),
  ((SELECT id FROM categories WHERE name = 'JavaScript'), 'JavaScript ES6+ Features', 'Modern JavaScript features and syntax', 25, 6, 'intermediate'),
  ((SELECT id FROM categories WHERE name = 'React'), 'React Hooks Mastery', 'Comprehensive test of React Hooks knowledge', 30, 8, 'intermediate'),
  ((SELECT id FROM categories WHERE name = 'React'), 'React Performance Optimization', 'Advanced React performance concepts', 40, 6, 'advanced'),
  ((SELECT id FROM categories WHERE name = 'TypeScript'), 'TypeScript Fundamentals', 'Core TypeScript concepts and syntax', 25, 8, 'beginner'),
  ((SELECT id FROM categories WHERE name = 'TypeScript'), 'Advanced TypeScript Patterns', 'Complex TypeScript features and patterns', 35, 6, 'advanced'),
  ((SELECT id FROM categories WHERE name = 'Next.js'), 'Next.js Full-Stack Development', 'Complete Next.js application development', 45, 8, 'intermediate'),
  ((SELECT id FROM categories WHERE name = 'Next.js'), 'Next.js Performance & SEO', 'Optimization techniques in Next.js', 30, 6, 'advanced');

-- Link questions to new assessments
DO $$
DECLARE
  assessment_record RECORD;
  question_record RECORD;
  question_count INTEGER;
BEGIN
  -- For each new assessment, link appropriate questions
  FOR assessment_record IN 
    SELECT id, category_id, total_questions, difficulty_level 
    FROM assessments 
    WHERE title IN (
      'JavaScript Advanced Concepts', 'JavaScript ES6+ Features',
      'React Hooks Mastery', 'React Performance Optimization',
      'TypeScript Fundamentals', 'Advanced TypeScript Patterns',
      'Next.js Full-Stack Development', 'Next.js Performance & SEO'
    )
  LOOP
    question_count := 0;
    
    -- Get questions for this category and difficulty
    FOR question_record IN
      SELECT id FROM questions 
      WHERE category_id = assessment_record.category_id
      AND (
        (assessment_record.difficulty_level = 'beginner' AND difficulty_level IN ('easy', 'medium')) OR
        (assessment_record.difficulty_level = 'intermediate' AND difficulty_level IN ('easy', 'medium', 'hard')) OR
        (assessment_record.difficulty_level = 'advanced' AND difficulty_level IN ('medium', 'hard'))
      )
      ORDER BY RANDOM()
      LIMIT assessment_record.total_questions
    LOOP
      INSERT INTO assessment_questions (assessment_id, question_id, order_index)
      VALUES (assessment_record.id, question_record.id, question_count);
      
      question_count := question_count + 1;
    END LOOP;
  END LOOP;
END $$;