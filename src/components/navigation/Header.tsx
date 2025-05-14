import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, Bell, Plus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';
import TransactionModal from '../transactions/TransactionModal';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('');

  // Determinar título da página baseado na rota atual
  useEffect(() => {
    const pathToTitle: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/transactions': 'Transações',
      '/categories': 'Categorias',
      '/profile': 'Perfil'
    };

    setPageTitle(pathToTitle[location.pathname] || 'Cashpilot');
  }, [location]);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 px-4 md:px-6 sticky top-0 z-30">
      <div className="flex justify-between items-center">
        {/* Título da página - visível apenas em desktop */}
        <div className="hidden md:block">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{pageTitle}</h1>
        </div>

        {/* Ações */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end space-x-2 md:space-x-4">
          {/* Título da página - visível apenas em mobile */}
          <h1 className="md:hidden text-xl font-semibold text-gray-800 dark:text-white">{pageTitle}</h1>

          <div className="flex items-center space-x-2">
            {/* Botão Nova Transação - visível apenas em telas maiores */}
            {(location.pathname === '/dashboard' || location.pathname === '/transactions') && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="cashpilot-button-primary flex items-center"
              >
                <Plus size={16} className="mr-1" />
                <span className="hidden md:inline">Nova Transação</span>
                <span className="md:hidden">Nova</span>
              </button>
            )}

            {/* Botão tema */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {theme === 'dark' ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}
            </button>

            {/* Botão notificações */}
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              aria-label="Notificações"
            >
              <Bell size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Nova Transação */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </header>
  );
};

export default Header;