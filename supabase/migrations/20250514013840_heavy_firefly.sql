/*
  # Add user registration policies

  1. Security Changes
    - Add INSERT policy for usuarios table to allow new user registration
    - Add DELETE policy for usuarios table to allow rollback during failed registration
    
  2. Changes
    - Adds two new RLS policies to the usuarios table
    - Ensures users can only insert their own data during registration
    - Allows deletion of user data during registration rollback
*/

-- Policy to allow users to insert their own data during registration
CREATE POLICY "Usuários podem inserir seus próprios dados durante registro"
ON public.usuarios
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Policy to allow deletion of user data during registration rollback
CREATE POLICY "Permitir exclusão durante rollback de registro"
ON public.usuarios
FOR DELETE
TO authenticated
USING (auth.uid() = id);