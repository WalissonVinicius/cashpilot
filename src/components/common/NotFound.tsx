import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlaneLanding, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <PlaneLanding size={40} className="text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Página não encontrada</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Desculpe, a página que você está procurando não existe ou foi movida.
        </p>
        
        <Link 
          to="/"
          className="cashpilot-button-primary inline-flex items-center"
        >
          <Home size={18} className="mr-2" />
          Voltar para o início
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;