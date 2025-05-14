import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ListOrdered,
  Tag,
  UserCircle,
  LogOut,
  Menu,
  X,
  PlaneLanding,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../common/ConfirmModal';

const Sidebar = () => {
  const { signOut, userProfile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    await signOut();
  };

  const navItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/transactions', icon: <ListOrdered size={20} />, label: 'Transações' },
    { path: '/despesas-fixas', icon: <Calendar size={20} />, label: 'Despesas Fixas' },
    { path: '/categories', icon: <Tag size={20} />, label: 'Categorias' },
    { path: '/profile', icon: <UserCircle size={20} />, label: 'Perfil' },
  ];

  const sidebarVariants = {
    hidden: { x: '-100%' },
    visible: { x: 0 },
  };

  return (
    <>
      {/* Botão do menu mobile */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-full bg-primary-600 text-white md:hidden"
        onClick={toggleMobileMenu}
        aria-label="Toggle Menu"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay para fechar menu em dispositivos móveis */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar para desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 md:bg-white md:dark:bg-gray-800 md:shadow-lg md:z-10">
        <SidebarContent
          navItems={navItems}
          signOut={handleLogout}
          userProfile={userProfile}
        />
      </div>

      {/* Sidebar para mobile com animação */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-40 md:hidden"
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'tween', duration: 0.3 }}
          >
            <SidebarContent
              navItems={navItems}
              signOut={handleLogout}
              userProfile={userProfile}
              toggleMobileMenu={toggleMobileMenu}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmação de logout */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Sair da conta"
        message="Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente para acessar o sistema."
        confirmText="Sair"
        cancelText="Cancelar"
        type="warning"
      />
    </>
  );
};

// Componente separado para o conteúdo da sidebar
const SidebarContent = ({
  navItems,
  signOut,
  userProfile,
  toggleMobileMenu
}: {
  navItems: { path: string; icon: JSX.Element; label: string }[];
  signOut: () => void;
  userProfile: { nome: string } | null;
  toggleMobileMenu?: () => void;
}) => {
  return (
    <>
      {/* Logo e nome */}
      <div className="p-4 flex items-center">
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
          <PlaneLanding size={22} />
        </div>
        <div className="ml-3">
          <h1 className="text-xl font-bold text-primary-800 dark:text-primary-400">Cashpilot</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Controle financeiro</p>
        </div>
      </div>

      {/* Perfil do usuário */}
      <div className="px-4 py-2 mt-2 mb-6 border-b border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Olá,</p>
        <p className="text-base font-semibold text-gray-800 dark:text-white truncate">
          {userProfile?.nome || 'Usuário'}
        </p>
      </div>

      {/* Links de navegação */}
      <nav className="px-4 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200
                  ${isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                  transition-all duration-200
                `}
                onClick={toggleMobileMenu}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Botão de logout */}
      <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={signOut}
          className="flex items-center w-full px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
        >
          <LogOut size={20} className="mr-3" />
          <span>Sair</span>
        </button>
      </div>
    </>
  );
};

export default Sidebar;