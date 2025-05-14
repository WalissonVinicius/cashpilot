import { useNavigate } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';

interface EmailSentProps {
    email?: string;
}

const EmailSent = ({ email }: EmailSentProps) => {
    const navigate = useNavigate();
    const userEmail = email || localStorage.getItem('registrationEmail') || '';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <FiMail className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    Confirme seu email
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Enviamos um link de confirmação para
                </p>
                <p className="text-center text-md font-medium text-blue-600 dark:text-blue-400">
                    {userEmail}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Próximos passos:
                            </h3>
                            <ul className="mt-2 list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                <li>Verifique sua caixa de entrada e spam</li>
                                <li>Clique no link de confirmação no email</li>
                                <li>Após confirmar, você será redirecionado para fazer login</li>
                            </ul>
                        </div>

                        <div className="flex items-center justify-center">
                            <button
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-400 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <FiArrowLeft className="mr-2" />
                                Voltar para login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailSent; 