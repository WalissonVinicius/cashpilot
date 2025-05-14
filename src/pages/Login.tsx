import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, PlaneLanding, AlertCircle, ChevronRight, Sparkles, Shield, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Digite seu email');
      return;
    }

    if (!password) {
      setError('Digite sua senha');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email, password);
      setIsSuccess(true);

      // Pequeno delay para mostrar a animação de sucesso antes de navegar
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      if (errorMessage.includes('Invalid login')) {
        setError('Email ou senha incorretos');
      } else {
        setError('Ocorreu um erro ao fazer login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Lista de características para o carousel
  const features = [
    {
      icon: <BarChart3 size={20} className="text-primary-300" />,
      title: "Análise financeira",
      description: "Acompanhe seus gastos com gráficos detalhados"
    },
    {
      icon: <Sparkles size={20} className="text-primary-300" />,
      title: "Planejamento inteligente",
      description: "Defina metas e receba recomendações personalizadas"
    },
    {
      icon: <Shield size={20} className="text-primary-300" />,
      title: "100% Seguro",
      description: "Seus dados financeiros protegidos com criptografia"
    }
  ];

  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  // Alternar características a cada 4 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [features.length]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Lado esquerdo - ilustração/branding */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-white p-6 lg:p-10 flex-col justify-between relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary-600 rounded-full opacity-30 blur-2xl"></div>
        <div className="absolute top-10 -right-10 w-32 h-32 bg-primary-500 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-40 left-10 w-20 h-20 bg-primary-400 rounded-full opacity-20 blur-lg"></div>

        {/* Padrão de pontos */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 h-full w-full">
            {Array.from({ length: 120 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-white m-4"></div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-2">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <PlaneLanding size={24} className="text-primary-200" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Cashpilot</h1>
          </div>
          <p className="mt-2 text-primary-200 font-light">Assuma o controle das suas finanças</p>
        </div>

        <div className="max-w-md relative z-10 mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center sm:text-left leading-tight">
            Sua <span className="text-primary-300">jornada financeira</span> começa aqui
          </h2>

          <div className="h-36 mb-8 perspective-1000">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFeatureIndex}
                initial={{ opacity: 0, y: 20, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -20, rotateX: 15 }}
                transition={{ duration: 0.5 }}
                className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/10"
              >
                <div className="flex items-start">
                  <div className="mr-4 p-2 rounded-lg bg-primary-800/50">
                    {features[currentFeatureIndex].icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-2">{features[currentFeatureIndex].title}</h3>
                    <p className="text-sm text-primary-100">{features[currentFeatureIndex].description}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center space-x-2 mb-8">
            {features.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentFeatureIndex ? 'bg-white w-6' : 'bg-white/30'
                  }`}
                onClick={() => setCurrentFeatureIndex(index)}
                aria-label={`Ver característica ${index + 1}`}
              />
            ))}
          </div>

          <div className="text-sm text-primary-200 bg-primary-800/30 p-4 rounded-lg backdrop-blur-sm">
            <h3 className="font-medium text-base mb-2 flex items-center">
              <Sparkles size={16} className="mr-2" /> Em breve no Cashpilot
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-300 mt-1.5 mr-2"></div>
                <span>Sincronização com contas bancárias via Open Finance</span>
              </li>
              <li className="flex items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-300 mt-1.5 mr-2"></div>
                <span>Aplicativo móvel para iOS e Android</span>
              </li>
              <li className="flex items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-300 mt-1.5 mr-2"></div>
                <span>Recomendações personalizadas de investimento</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-sm text-primary-300 relative z-10 text-center mt-8">
          <p>&copy; {new Date().getFullYear()} Cashpilot. Todos os direitos reservados.</p>
          <div className="mt-2 inline-flex items-center px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
            <span className="mr-1.5 text-primary-200">Desenvolvido por</span>
            <a href="https://github.com/WalissonVinicius" target="_blank" rel="noopener noreferrer" className="font-medium relative">
              <span className="relative z-10 bg-gradient-to-r from-primary-300 to-blue-300 text-transparent bg-clip-text">Walisson</span>
              <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-300 to-blue-300 rounded-full"></span>
            </a>
          </div>
        </div>
      </div>

      {/* Lado direito - formulário */}
      <div className="w-full md:w-1/2 px-6 py-8 sm:px-10 lg:px-16 flex items-center justify-center bg-white dark:bg-gray-900">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Logo mobile */}
          <div className="md:hidden flex flex-col items-center mb-10">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary-600 rounded-2xl blur-lg opacity-30"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center relative shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary-400/10 to-white/20"></div>
                <PlaneLanding size={32} className="text-white relative z-10" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cashpilot</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-3">Assuma o controle das suas finanças</p>
            <div className="inline-flex items-center px-3 py-1 bg-primary-50 dark:bg-primary-900/30 rounded-full drop-shadow-sm">

              <span className="font-medium text-primary-600 dark:text-primary-400 text-xs">
                Desenvolvido por <a href="https://github.com/WalissonVinicius" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-primary-600 to-blue-500 text-transparent bg-clip-text font-bold">Walisson</a>
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="text-primary-600 dark:text-primary-400" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Login bem-sucedido!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Redirecionando para o dashboard...</p>
                <div className="w-full max-w-xs mx-auto h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-600 dark:bg-primary-500"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 text-center">
                  Bem-vindo de volta!
                </h2>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 rounded-lg flex items-start"
                  >
                    <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div
                    whileTap={{ scale: 0.995 }}
                    className={`relative ${focusedField === 'email' ? 'scale-[1.02]' : ''} transition-all duration-200`}
                  >
                    <label
                      htmlFor="email"
                      className={`block text-sm font-medium mb-2 text-center sm:text-left transition-colors duration-200 ${focusedField === 'email'
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      Email
                    </label>
                    <div className={`relative rounded-lg overflow-hidden transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-primary-300 dark:ring-primary-700' : ''
                      }`}>
                      <input
                        type="email"
                        id="email"
                        className="cashpilot-input border-transparent dark:border-transparent"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <div className={`absolute bottom-0 left-0 h-0.5 bg-primary-600 dark:bg-primary-500 transition-all duration-300 ${focusedField === 'email' ? 'w-full' : 'w-0'
                        }`}></div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileTap={{ scale: 0.995 }}
                    className={`relative ${focusedField === 'password' ? 'scale-[1.02]' : ''} transition-all duration-200`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <label
                        htmlFor="password"
                        className={`block text-sm font-medium transition-colors duration-200 ${focusedField === 'password'
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        Senha
                      </label>
                      <button
                        type="button"
                        className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className={`relative rounded-lg overflow-hidden transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-primary-300 dark:ring-primary-700' : ''
                      }`}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        className="cashpilot-input pr-10 border-transparent dark:border-transparent"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <div className={`absolute bottom-0 left-0 h-0.5 bg-primary-600 dark:bg-primary-500 transition-all duration-300 ${focusedField === 'password' ? 'w-full' : 'w-0'
                        }`}></div>
                    </div>
                  </motion.div>

                  <motion.button
                    type="submit"
                    className="w-full mt-8 relative overflow-hidden group"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 group-hover:from-primary-500 group-hover:via-primary-400 group-hover:to-primary-500 transition-all duration-300"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[radial-gradient(circle_at_50%_10%,_rgba(255,255,255,0.3),_transparent_70%)]"></div>
                    <div className="relative px-6 py-3 text-white font-medium rounded-lg">
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Entrando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          Entrar
                          <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                        </span>
                      )}
                    </div>
                  </motion.button>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 bg-white dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400">ou</span>
                    </div>
                  </div>

                  <p className="text-center text-gray-600 dark:text-gray-400">
                    Não possui uma conta?{' '}
                    <Link to="/register" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors inline-flex items-center">
                      Criar conta
                      <motion.span
                        animate={{ x: [0, 3, 0] }}
                        transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.6 }}
                      >
                        <ChevronRight size={16} className="ml-1" />
                      </motion.span>
                    </Link>
                  </p>
                </form>

                <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-10">
                  <p>Ao entrar, você concorda com nossos <span className="underline cursor-pointer">Termos de Serviço</span> e <span className="underline cursor-pointer">Política de Privacidade</span></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;