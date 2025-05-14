import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nome: string) => Promise<void>;
  signOut: () => Promise<void>;
  userProfile: { id: string; nome: string; email: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ id: string; nome: string; email: string } | null>(null);

  // Inicializar autenticação e verificar sessão existente
  useEffect(() => {
    console.log('Inicializando autenticação...');

    // Verificar se há uma sessão válida
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      console.log('Sessão obtida:', activeSession ? 'Tem sessão' : 'Sem sessão');

      if (activeSession) {
        setSession(activeSession);
        setUser(activeSession.user);

        // Buscar perfil do usuário
        if (activeSession.user) {
          fetchUserProfile(activeSession.user.id);
        }
      }

      setIsLoading(false);
    });

    // Monitorar alterações na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Evento de autenticação:', event);

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);

        if (currentSession.user) {
          fetchUserProfile(currentSession.user.id);
        }
      } else {
        setSession(null);
        setUser(null);
        setUserProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função simplificada para buscar o perfil do usuário
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);

        // Verificar se o usuário existe
        const { count } = await supabase
          .from('usuarios')
          .select('id', { count: 'exact', head: true })
          .eq('id', userId);

        // Se não existir, criar perfil
        if (count === 0) {
          const { data: userData } = await supabase.auth.getUser();

          if (userData?.user) {
            await supabase
              .from('usuarios')
              .insert([{
                id: userId,
                nome: userData.user.user_metadata?.nome || 'Usuário',
                email: userData.user.email || ''
              }]);

            // Buscar novamente
            const { data: newData } = await supabase
              .from('usuarios')
              .select('id, nome, email')
              .eq('id', userId)
              .single();

            if (newData) {
              setUserProfile(newData);
            }
          }
        }
        return;
      }

      if (data) {
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
    }
  };

  // Login simplificado
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro de login:', error);

      // Mensagens amigáveis
      const errorMessage = error.message?.includes('Invalid login')
        ? 'Email ou senha incorretos'
        : 'Erro ao fazer login. Tente novamente.';

      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Registro simplificado
  const signUp = async (email: string, password: string, nome: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome },
          emailRedirectTo: import.meta.env.VITE_SITE_URL || window.location.origin,
        }
      });

      if (error) throw error;

      // Criar perfil na tabela usuarios
      if (data.user) {
        await supabase
          .from('usuarios')
          .insert([{
            id: data.user.id,
            nome,
            email
          }]);
      }

      toast.success('Conta criada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);

      let errorMessage = 'Erro ao criar conta';
      if (error.message?.includes('email already in use')) {
        errorMessage = 'Este email já está cadastrado';
      }

      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout simplificado
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
      userProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};