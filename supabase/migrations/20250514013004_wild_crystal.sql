/*
  # Esquema inicial do Cashpilot

  1. Novas Tabelas
    - `usuarios`
      - `id` (uuid, primary key)
      - `nome` (text, not null)
      - `email` (text, not null)
      - `created_at` (timestamptz, default now())
    
    - `categorias`
      - `id` (uuid, primary key)
      - `usuario_id` (uuid, foreign key referencing usuarios.id)
      - `nome` (text, not null)
      - `created_at` (timestamptz, default now())
    
    - `transacoes`
      - `id` (uuid, primary key)
      - `usuario_id` (uuid, foreign key referencing usuarios.id)
      - `valor` (numeric, not null)
      - `tipo` (text, not null, check in ('entrada', 'saida'))
      - `data` (date, not null)
      - `descricao` (text, not null)
      - `categoria_id` (uuid, foreign key referencing categorias.id)
      - `created_at` (timestamptz, default now())
  
  2. Security
    - Habilitar RLS em todas as tabelas
    - Políticas para que usuários só possam acessar seus próprios dados
*/

-- Tabela de usuários (perfis)
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  valor numeric NOT NULL CHECK (valor > 0),
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  data date NOT NULL,
  descricao text NOT NULL,
  categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Usuários podem visualizar apenas seus próprios dados"
  ON usuarios
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar apenas seus próprios dados"
  ON usuarios
  FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para categorias
CREATE POLICY "Usuários podem visualizar apenas suas próprias categorias"
  ON categorias
  FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir apenas suas próprias categorias"
  ON categorias
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar apenas suas próprias categorias"
  ON categorias
  FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem excluir apenas suas próprias categorias"
  ON categorias
  FOR DELETE
  USING (auth.uid() = usuario_id);

-- Políticas para transações
CREATE POLICY "Usuários podem visualizar apenas suas próprias transações"
  ON transacoes
  FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir apenas suas próprias transações"
  ON transacoes
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar apenas suas próprias transações"
  ON transacoes
  FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem excluir apenas suas próprias transações"
  ON transacoes
  FOR DELETE
  USING (auth.uid() = usuario_id);

-- Inserir categorias padrão para novos usuários
CREATE OR REPLACE FUNCTION public.criar_categorias_padrao()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categorias (usuario_id, nome)
  VALUES
    (NEW.id, 'Alimentação'),
    (NEW.id, 'Moradia'),
    (NEW.id, 'Transporte'),
    (NEW.id, 'Educação'),
    (NEW.id, 'Lazer'),
    (NEW.id, 'Saúde'),
    (NEW.id, 'Salário'),
    (NEW.id, 'Investimentos');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created
  AFTER INSERT ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.criar_categorias_padrao();