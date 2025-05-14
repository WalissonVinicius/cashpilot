import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Edit,
  Save,
  X,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ConfirmModal from '../components/common/ConfirmModal';

const Profile = () => {
  const { user, userProfile, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nome, setNome] = useState('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [profileStats, setProfileStats] = useState({
    transactionCount: 0,
    categoryCount: 0,
    memberSince: '',
    lastLogin: ''
  });

  // Carregar dados do perfil
  useEffect(() => {
    if (user && userProfile) {
      setNome(userProfile.nome || '');
      fetchProfileStats();
    }
  }, [user, userProfile]);

  // Buscar estatísticas do perfil
  const fetchProfileStats = async () => {
    try {
      setIsLoading(true);

      if (!user?.id) return;

      // Contar transações
      const { count: transactionCount, error: transactionError } = await supabase
        .from('transacoes')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', user.id);

      if (transactionError) throw transactionError;

      // Contar categorias
      const { count: categoryCount, error: categoryError } = await supabase
        .from('categorias')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', user.id);

      if (categoryError) throw categoryError;

      // Buscar metadados do usuário
      const { data: metaData, error: metaError } = await supabase.auth.getUser();

      if (metaError) throw metaError;

      const memberSince = user.created_at
        ? format(new Date(user.created_at), 'PPP', { locale: ptBR })
        : 'N/A';

      const lastLogin = metaData?.user?.last_sign_in_at
        ? format(new Date(metaData.user.last_sign_in_at), 'PPP', { locale: ptBR })
        : 'N/A';

      setProfileStats({
        transactionCount: transactionCount || 0,
        categoryCount: categoryCount || 0,
        memberSince,
        lastLogin
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas do perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar alterações no perfil
  const handleSaveProfile = async () => {
    if (!nome.trim()) {
      toast.error('Digite seu nome');
      return;
    }

    if (!user?.id) {
      toast.error('Erro ao identificar usuário');
      return;
    }

    try {
      setIsLoading(true);

      // Atualizar perfil
      const { error } = await supabase
        .from('usuarios')
        .update({ nome: nome.trim() })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso');
      setIsEditingProfile(false);

      // Recarregar a página para atualizar os dados do usuário
      window.location.reload();

    } catch (error: unknown) {
      console.error('Erro ao atualizar perfil:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancelar edição do perfil
  const handleCancelEdit = () => {
    setNome(userProfile?.nome || '');
    setIsEditingProfile(false);
  };

  // Iniciar processo de logout
  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  // Confirmar logout
  const confirmLogout = async () => {
    await signOut();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Meu Perfil</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Visualize e edite suas informações pessoais
          </p>
        </div>

        {/* Card de perfil */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Informações do usuário */}
          <div className="cashpilot-card p-6 md:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Informações Pessoais
              </h2>

              {!isEditingProfile ? (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
                >
                  <Edit size={16} className="mr-1" />
                  <span>Editar</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
                  >
                    <X size={16} className="mr-1" />
                    <span>Cancelar</span>
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
                    disabled={isLoading}
                  >
                    <Save size={16} className="mr-1" />
                    <span>{isLoading ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Formulário de perfil */}
            <div className="space-y-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome
                </label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="cashpilot-input"
                    placeholder="Seu nome completo"
                  />
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <User size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                    <span className="text-gray-800 dark:text-white">{userProfile?.nome || 'N/A'}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Mail size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-gray-800 dark:text-white">{userProfile?.email || 'N/A'}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  O email não pode ser alterado.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Membro desde
                    </p>
                    <div className="flex items-center mt-1">
                      <Calendar size={16} className="text-gray-500 dark:text-gray-400 mr-1" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {profileStats.memberSince}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                      Último login
                    </p>
                    <div className="flex items-center justify-end mt-1">
                      <Calendar size={16} className="text-gray-500 dark:text-gray-400 mr-1" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {profileStats.lastLogin}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas do usuário */}
          <div className="cashpilot-card p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
              Estatísticas
            </h2>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Total de Transações
                </p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-white">
                  {isLoading ? '...' : profileStats.transactionCount}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Total de Categorias
                </p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-white">
                  {isLoading ? '...' : profileStats.categoryCount}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full cashpilot-button-danger flex items-center justify-center"
                >
                  <LogOut size={16} className="mr-2" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dicas e avisos */}
        <div className="cashpilot-card p-6">
          <div className="flex items-start">
            <div className="mr-4 text-primary-600 dark:text-primary-400 flex-shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Dicas para usar o Cashpilot
              </h3>
              <div className="text-gray-600 dark:text-gray-300 space-y-2">
                <p>
                  • Categorize suas transações para obter relatórios mais precisos.
                </p>
                <p>
                  • Registre suas transações regularmente para manter seu controle financeiro em dia.
                </p>
                <p>
                  • Use os filtros na página de transações para encontrar informações específicas.
                </p>
                <p>
                  • Exporte seus dados para análises mais detalhadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

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

export default Profile;