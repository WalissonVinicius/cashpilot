/*
  # Fix user policies

  1. Security
    - Enable RLS on users table
    - Add policies for user registration and data management
    - Check for existing policies before creating new ones
*/

-- Enable RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Policy for user registration
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usuarios' 
    AND policyname = 'Usuários podem inserir seus próprios dados durante registro'
  ) THEN
    CREATE POLICY "Usuários podem inserir seus próprios dados durante registro"
    ON usuarios
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() = id);
  END IF;

  -- Policy for registration rollback
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usuarios' 
    AND policyname = 'Permitir exclusão durante rollback de registro'
  ) THEN
    CREATE POLICY "Permitir exclusão durante rollback de registro"
    ON usuarios
    FOR DELETE
    TO authenticated
    USING (auth.uid() = id);
  END IF;

  -- Policy for reading own data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usuarios' 
    AND policyname = 'Usuários podem visualizar apenas seus próprios dados'
  ) THEN
    CREATE POLICY "Usuários podem visualizar apenas seus próprios dados"
    ON usuarios
    FOR SELECT
    TO public
    USING (auth.uid() = id);
  END IF;

  -- Policy for updating own data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usuarios' 
    AND policyname = 'Usuários podem atualizar apenas seus próprios dados'
  ) THEN
    CREATE POLICY "Usuários podem atualizar apenas seus próprios dados"
    ON usuarios
    FOR UPDATE
    TO public
    USING (auth.uid() = id);
  END IF;
END $$;

-- Criar tabela para despesas recorrentes (despesas fixas mensais)
CREATE TABLE IF NOT EXISTS despesas_recorrentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  valor numeric NOT NULL CHECK (valor > 0),
  descricao text NOT NULL,
  dia_vencimento integer NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL,
  ativa boolean DEFAULT true,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de configurações de orçamento do usuário
CREATE TABLE IF NOT EXISTS configuracoes_orcamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  valor_mensal numeric NOT NULL CHECK (valor_mensal >= 0),
  valor_reserva_emergencia numeric DEFAULT 0,
  percentual_lazer numeric DEFAULT 10 CHECK (percentual_lazer BETWEEN 0 AND 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_configuracoes_usuario UNIQUE (usuario_id)
);

-- Habilitar RLS para as novas tabelas
ALTER TABLE despesas_recorrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_orcamento ENABLE ROW LEVEL SECURITY;

-- Políticas para despesas recorrentes
CREATE POLICY "Usuários podem visualizar suas despesas recorrentes"
  ON despesas_recorrentes
  FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir suas despesas recorrentes"
  ON despesas_recorrentes
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar suas despesas recorrentes"
  ON despesas_recorrentes
  FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem excluir suas despesas recorrentes"
  ON despesas_recorrentes
  FOR DELETE
  USING (auth.uid() = usuario_id);

-- Políticas para configurações de orçamento
CREATE POLICY "Usuários podem visualizar suas configurações de orçamento"
  ON configuracoes_orcamento
  FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir suas configurações de orçamento"
  ON configuracoes_orcamento
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar suas configurações de orçamento"
  ON configuracoes_orcamento
  FOR UPDATE
  USING (auth.uid() = usuario_id);

-- Trigger para inserir configurações padrão de orçamento
CREATE OR REPLACE FUNCTION public.criar_configuracoes_padrao()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.configuracoes_orcamento (usuario_id, valor_mensal, valor_reserva_emergencia, percentual_lazer)
  VALUES
    (NEW.id, 0, 0, 10);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_config
  AFTER INSERT ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.criar_configuracoes_padrao();