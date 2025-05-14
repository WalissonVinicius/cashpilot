import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Essas variáveis serão configuradas após a conexão do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Opções para otimizar a conexão - configuração simplificada para persistência máxima
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    localStorage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Erro ao recuperar token:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Erro ao armazenar token:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Erro ao remover token:', error);
        }
      }
    }
  },
  realtime: {
    timeout: 20000,
  },
  global: {
    fetch: (url, options) => {
      return fetch(url, { ...options, cache: 'no-store' });
    },
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Função para verificar se a sessão está ativa
export const checkSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Erro ao verificar sessão:', error);
    return null;
  }
  return data.session;
};

export async function formatarMoeda(valor: number): Promise<string> {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export async function formatarData(data: string | Date): Promise<string> {
  if (!data) return '';
  
  const dataObj = data instanceof Date ? data : new Date(data);
  return new Intl.DateTimeFormat('pt-BR').format(dataObj);
}