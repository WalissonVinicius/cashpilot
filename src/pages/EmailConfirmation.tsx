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

            // Se não houver erro, verificar se há uma sessão
            const { data } = await supabase.auth.getSession();

            if (data.session) {
                setMessage('Email confirmado! Redirecionando para o dashboard...');
                toast.success('Email confirmado com sucesso!');
                setTimeout(() => navigate('/dashboard'), 1000);
            } else {
                // Se não houver sessão, mas também não houver erro, é um caso onde o token foi validado
                // mas o usuário precisa fazer login
                setMessage('Email confirmado! Por favor, faça login para continuar.');
                toast.success('Email confirmado! Por favor, faça login para continuar.');
                setTimeout(() => navigate('/login'), 2000);
            }
        };

        handleEmailConfirmation();
    }, [navigate, location.hash]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-md">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Confirmação de Email</h2>
                    <p className="mt-2 text-sm text-gray-600">{message}</p>
                </div>
            </div>
        </div>
    );
};

export default EmailConfirmation; 