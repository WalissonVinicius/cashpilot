import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import DespesasFixas from './pages/DespesasFixas';
import EmailConfirmation from './pages/EmailConfirmation';

// Layout
import ProtectedLayout from './components/layouts/ProtectedLayout';
import LoadingScreen from './components/common/LoadingScreen';

function App() {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Verificar parâmetros de autenticação na URL
  useEffect(() => {
    const checkHashParams = async () => {
      // Verificar se há hash na URL (usado pelo Supabase para autenticação)
      if (location.hash && location.hash.includes('access_token')) {
        try {
          // Verificar se foi estabelecida uma sessão
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            console.log('Usuário autenticado com sucesso');
            toast.success('Email confirmado com sucesso!');

            // Redirecionar para o dashboard se estiver na raiz
            if (location.pathname === '/') {
              setTimeout(() => navigate('/dashboard'), 500);
            }
          }
        } catch (error) {
          console.error('Erro ao processar tokens de autenticação:', error);
        }
      }
    };

    checkHashParams();
  }, [location.hash, location.pathname, navigate]);

  // Controle de carregamento de página
  useEffect(() => {
    // Controle do primeiro carregamento
    if (initialLoad && !isLoading) {
      setInitialLoad(false);
    }

    // Indicador de carregamento durante mudanças de rota
    setIsPageLoading(true);
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 300); // Pequeno delay para evitar flickering

    return () => clearTimeout(timer);
  }, [location.pathname, isLoading, initialLoad]);

  useEffect(() => {
    // Aplicar tema ao body
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Mostrar tela de loading apenas no carregamento inicial
  if (initialLoad && isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/auth/confirm" element={<EmailConfirmation />} />

        {/* Rotas protegidas */}
        <Route element={<ProtectedLayout isPageLoading={isPageLoading} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/despesas-fixas" element={<DespesasFixas />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Redirecionamentos */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;