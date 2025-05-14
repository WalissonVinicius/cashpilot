/*
  # Add user registration policies

  1. Changes
    - Add policies to allow user registration
    - Enable RLS on usuarios table
    - Add policy for user registration
    - Add policy for registration rollback
  
  2. Security
    - Enable RLS on usuarios table
    - Add policy to allow users to insert their own data during registration
    - Add policy to allow deletion during registration rollback
*/

-- Enable RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Policy for user registration
CREATE POLICY "Usuários podem inserir seus próprios dados durante registro"
ON usuarios
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Policy for registration rollback
CREATE POLICY "Permitir exclusão durante rollback de registro"
ON usuarios
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Policy for reading own data
CREATE POLICY "Usuários podem visualizar apenas seus próprios dados"
ON usuarios
FOR SELECT
TO public
USING (auth.uid() = id);

-- Policy for updating own data
CREATE POLICY "Usuários podem atualizar apenas seus próprios dados"
ON usuarios
FOR UPDATE
TO public
USING (auth.uid() = id);