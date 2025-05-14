import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Tag,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  nome: string;
  transactionCount?: number;
}

const Categories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para criar/editar categoria
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado para confirmação de exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Buscar categorias ao carregar o componente
  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  // Filtrar categorias baseado na busca
  const filteredCategories = categories.filter(category => 
    category.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Buscar categorias e contar transações associadas
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      
      // Consulta para buscar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categorias')
        .select('id, nome')
        .eq('usuario_id', user?.id)
        .order('nome');
      
      if (categoriesError) throw categoriesError;
      
      if (!categoriesData) {
        setCategories([]);
        return;
      }
      
      // Para cada categoria, contar transações
      const categoriesWithCount = await Promise.all(
        categoriesData.map(async (category) => {
          const { count, error } = await supabase
            .from('transacoes')
            .select('id', { count: 'exact', head: true })
            .eq('categoria_id', category.id)
            .eq('usuario_id', user?.id);
          
          return {
            ...category,
            transactionCount: count || 0
          };
        })
      );
      
      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Não foi possível carregar as categorias');
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir modal para edição
  const handleEdit = (category: Category) => {
    setCategoryId(category.id);
    setCategoryName(category.nome);
    setIsModalOpen(true);
  };

  // Abrir modal para nova categoria
  const handleNew = () => {
    setCategoryId(null);
    setCategoryName('');
    setIsModalOpen(true);
  };

  // Iniciar processo de exclusão
  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setShowDeleteConfirm(true);
  };

  // Salvar categoria (criar ou atualizar)
  const handleSave = async () => {
    if (!categoryName.trim()) {
      toast.error('Digite um nome para a categoria');
      return;
    }
    
    try {
      if (categoryId) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from('categorias')
          .update({ nome: categoryName.trim() })
          .eq('id', categoryId)
          .eq('usuario_id', user?.id);
        
        if (error) throw error;
        toast.success('Categoria atualizada com sucesso');
      } else {
        // Criar nova categoria
        const { error } = await supabase
          .from('categorias')
          .insert([{ 
            nome: categoryName.trim(), 
            usuario_id: user?.id 
          }]);
        
        if (error) throw error;
        toast.success('Categoria criada com sucesso');
      }
      
      // Fechar modal e recarregar dados
      setIsModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      toast.error(error.message || 'Erro ao salvar categoria');
    }
  };

  // Confirmar e executar exclusão
  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      // Verificar se há transações usando esta categoria
      const { count, error: countError } = await supabase
        .from('transacoes')
        .select('id', { count: 'exact', head: true })
        .eq('categoria_id', categoryToDelete);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        // Confirmação adicional para categorias com transações
        if (!window.confirm(`Esta categoria está sendo usada em ${count} transações. Remover a categoria das transações?`)) {
          setShowDeleteConfirm(false);
          setCategoryToDelete(null);
          return;
        }
        
        // Atualizar transações para remover a referência à categoria
        const { error: updateError } = await supabase
          .from('transacoes')
          .update({ categoria_id: null })
          .eq('categoria_id', categoryToDelete)
          .eq('usuario_id', user?.id);
        
        if (updateError) throw updateError;
      }
      
      // Excluir a categoria
      const { error: deleteError } = await supabase
        .from('categorias')
        .delete()
        .eq('id', categoryToDelete)
        .eq('usuario_id', user?.id);
      
      if (deleteError) throw deleteError;
      
      toast.success('Categoria excluída com sucesso');
      fetchCategories(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Não foi possível excluir a categoria');
    } finally {
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Título e botão */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Categorias</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gerencie as categorias para suas transações
            </p>
          </div>
          
          <button
            onClick={handleNew}
            className="cashpilot-button-primary flex items-center w-full sm:w-auto"
          >
            <Plus size={16} className="mr-1" />
            <span>Nova Categoria</span>
          </button>
        </div>

        {/* Busca */}
        <div className="cashpilot-card p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar categorias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cashpilot-input pr-10"
            />
            <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Lista de categorias */}
        <div className="cashpilot-card p-4">
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Tag size={28} className="text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                {searchQuery ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {searchQuery ? 'Tente uma busca diferente' : 'Crie categorias para organizar suas transações'}
              </p>
              
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                        {category.nome}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {category.transactionCount === 0 
                          ? 'Nenhuma transação'
                          : category.transactionCount === 1
                            ? '1 transação'
                            : `${category.transactionCount} transações`}
                      </p>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                        aria-label="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(category.id)}
                        className="p-1.5 rounded-full text-gray-500 hover:text-danger-600 hover:bg-danger-50 dark:text-gray-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/30"
                        aria-label="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal para criar/editar categoria */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              {categoryId ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            
            <div className="mb-4">
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome da Categoria
              </label>
              <input
                type="text"
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="cashpilot-input"
                placeholder="Ex: Alimentação, Transporte, etc."
                autoFocus
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="cashpilot-button-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="cashpilot-button-primary flex-1"
                disabled={!categoryName.trim()}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="mr-3 text-danger-500 dark:text-danger-400 flex-shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Confirmar exclusão
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Tem certeza que deseja excluir esta categoria? 
                  {categories.find(c => c.id === categoryToDelete)?.transactionCount! > 0 && (
                    <span className="block mt-1 text-danger-600 dark:text-danger-400 font-medium">
                      Esta categoria está sendo usada em transações.
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="cashpilot-button-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="cashpilot-button-danger flex-1"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Categories;