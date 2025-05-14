import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const EmailConfirmation = () => {
    const [message, setMessage] = useState('Verificando seu email...');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleEmailConfirmation = async () => {
            // Primeiramente, verificar se há hash na URL
            if (location.hash && location.hash.includes('access_token')) {
                // Se houver token de acesso, vamos verificar a sessão
                const { data } = await supabase.auth.getSession();

                if (data.session) {
                    setMessage('Email confirmado! Redirecionando para o dashboard...');
                    toast.success('Email confirmado com sucesso!');
                    setTimeout(() => navigate('/dashboard'), 1000);
                    return;
                }
            }

            // Verificar se há um hash com parâmetros de erro na URL
            const hashParams = new URLSearchParams(location.hash.substring(1));
            const error = hashParams.get('error');
            const errorCode = hashParams.get('error_code');

            if (error && errorCode === 'otp_expired') {
                setMessage('O link de confirmação expirou. Enviando para a página de login...');
                toast.error('Link de confirmação expirado. Por favor, faça login para solicitar um novo link.');

                // Redirecionar para login após um curto delay
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            // Se chegamos aqui, tentar autenticar o usuário
            try {
                // Extrair o token do hash se possível
                const token = hashParams.get('access_token');

                if (token) {
                    // Se temos um token, tentar autenticar com ele
                    setMessage('Autenticando...');
                    const { data, error } = await supabase.auth.getSession();

                    if (error) {
                        console.error('Erro ao autenticar:', error);
                        setMessage('Erro ao autenticar. Redirecionando para login...');
                        setTimeout(() => navigate('/login'), 2000);
                        return;
                    }

                    if (data.session) {
                        setMessage('Autenticado! Redirecionando para o dashboard...');
                        toast.success('Email confirmado com sucesso!');
                        setTimeout(() => navigate('/dashboard'), 1000);
                        return;
                    }
                }

                // Se não conseguimos autenticar, redirecionar para login
                setMessage('Por favor, faça login para continuar...');
                setTimeout(() => navigate('/login'), 2000);
            } catch (error) {
                console.error('Erro durante confirmação:', error);
                setMessage('Ocorreu um erro. Redirecionando para login...');
                setTimeout(() => navigate('/login'), 2000);
            }
        };

        handleEmailConfirmation();
    }, [navigate, location.hash]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">Confirmação de Email</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>
                </div>
            </div>
        </div>
    );
};

export default EmailConfirmation; 