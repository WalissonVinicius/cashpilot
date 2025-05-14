import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PlaneLanding, AlertCircle } from 'lucide-react';

const LoadingScreen = () => {
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    // Definir um timeout para mostrar mensagem de erro se o carregamento demorar demais
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 10000); // 10 segundos

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-gray-100 dark:from-gray-900 dark:to-primary-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-600 mb-5">
          <PlaneLanding size={36} className="text-white" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-primary-800 dark:text-primary-300 mb-3">
          Cashpilot
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {loadingTimeout ? (
            <span className="flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertCircle size={18} className="mr-2" />
              O carregamento está demorando mais que o esperado
            </span>
          ) : (
            "Carregando suas finanças..."
          )}
        </p>

        <div className="relative w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-primary-600"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>

        {loadingTimeout && (
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Recarregar a página
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default LoadingScreen;