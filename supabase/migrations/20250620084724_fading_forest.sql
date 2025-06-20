/*
  # Fix Profile Creation with Auth Trigger

  1. Changes
    - Create a trigger function that automatically creates a profile when a new user signs up
    - Create a trigger that calls this function on auth.users insert
    - Remove the manual profile creation from the application code

  2. Security
    - The trigger runs with elevated privileges, bypassing RLS
    - Users can still only access their own profiles via existing RLS policies
*/

-- Create a function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();