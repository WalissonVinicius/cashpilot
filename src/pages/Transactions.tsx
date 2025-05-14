import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ArrowUpDown,
  Trash2,
  Edit,
  FileDown,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatarMoeda } from '../lib/supabase';
import TransactionModal from '../components/transactions/TransactionModal';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  data: string;
  descricao: string;
  categoria_id: string | null;
  categoria?: { nome: string } | null;
}

interface FilterState {
  search: string;
  dateFrom: string;
  dateTo: string;
  type: 'todos' | 'entrada' | 'saida';
  category: string;
}

const Transactions = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>([]);

  // Estado para modal e edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | undefined>(undefined);

  // Estado para confirmação de exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Estado para filtros
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    dateFrom: '',
    dateTo: '',
    type: 'todos',
    category: ''
  });

  // Estado para ordenação
  const [sortField, setSortField] = useState('data');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Buscar dados ao carregar o componente
  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchCategories();
    }
  }, [user]);

  // Buscar transações com filtros aplicados
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);

      // Iniciar consulta
      let query = supabase
        .from('transacoes')
        .select(`
          id,
          tipo,
          valor,
          data,
          descricao,
          categoria_id,
          categorias (
            nome
          )
        `)
        .eq('usuario_id', user?.id);

      // Aplicar filtros
      if (filter.search) {
        query = query.ilike('descricao', `%${filter.search}%`);
      }

      if (filter.dateFrom) {
        query = query.gte('data', filter.dateFrom);
      }

      if (filter.dateTo) {
        query = query.lte('data', filter.dateTo);
      }

      if (filter.type !== 'todos') {
        query = query.eq('tipo', filter.type);
      }

      if (filter.category) {
        query = query.eq('categoria_id', filter.category);
      }

      // Aplicar ordenação
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      // Executar consulta
      const { data, error } = await query;

      if (error) throw error;

      // Processar dados
      const processedTransactions = data.map((transaction: any) => ({
        id: transaction.id,
        tipo: transaction.tipo,
        valor: transaction.valor,
        data: transaction.data,
        descricao: transaction.descricao,
        categoria_id: transaction.categoria_id,
        categoria: transaction.categorias
      }));

      setTransactions(processedTransactions);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast.error('Não foi possível carregar as transações');
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar categorias
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .eq('usuario_id', user?.id)
        .order('nome');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  // Abrir modal para edição
  const handleEdit = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setIsModalOpen(true);
  };

  // Iniciar processo de exclusão
  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setShowDeleteConfirm(true);
  };

  // Confirmar e executar exclusão
  const confirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', transactionToDelete)
        .eq('usuario_id', user?.id);

      if (error) throw error;

      toast.success('Transação excluída com sucesso');
      fetchTransactions(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Não foi possível excluir a transação');
    } finally {
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
    }
  };

  // Alternar direção da ordenação
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Aplicar filtros
  const applyFilters = () => {
    fetchTransactions();
    setIsFilterOpen(false);
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilter({
      search: '',
      dateFrom: '',
      dateTo: '',
      type: 'todos',
      category: ''
    });

    // Usar setTimeout para garantir que o estado foi atualizado antes de buscar
    setTimeout(() => {
      fetchTransactions();
      setIsFilterOpen(false);
    }, 0);
  };

  // Atualizar filtro
  const updateFilter = (field: keyof FilterState, value: string) => {
    setFilter(prev => ({ ...prev, [field]: value }));
  };

  // Exportar transações para CSV
  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error('Não há transações para exportar');
      return;
    }

    // Preparar dados
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
    const csvRows = [headers.join(',')];

    transactions.forEach(t => {
      const formattedDate = format(parseISO(t.data), 'dd/MM/yyyy');
      const formattedValue = t.valor.toString().replace('.', ',');
      const row = [
        formattedDate,
        `"${t.descricao.replace(/"/g, '""')}"`, // Escapar aspas
        `"${t.categoria?.nome || 'Sem categoria'}"`,
        t.tipo === 'entrada' ? 'Entrada' : 'Saída',
        formattedValue
      ];
      csvRows.push(row.join(','));
    });

    // Criar blob e link para download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transacoes-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();

    // Limpar
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Arquivo exportado com sucesso');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Título e botões */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Transações</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gerencie todas as suas entradas e saídas
            </p>
          </div>

          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={exportToCSV}
              className="cashpilot-button-secondary flex items-center"
            >
              <FileDown size={16} className="mr-1" />
              <span className="hidden md:inline">Exportar</span>
              <span className="md:hidden">CSV</span>
            </button>

            <button
              onClick={() => {
                setCurrentTransaction(undefined);
                setIsModalOpen(true);
              }}
              className="cashpilot-button-primary flex items-center"
            >
              <Plus size={16} className="mr-1" />
              <span>Nova Transação</span>
            </button>
          </div>
        </div>

        {/* Filtros e busca */}
        <div className="cashpilot-card p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {/* Campo de busca */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar transações..."
                value={filter.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="cashpilot-input pr-10"
              />
              <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Botões de filtro e ação */}
            <div className="flex space-x-2">
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="cashpilot-button-secondary flex items-center"
                >
                  <Filter size={16} className="mr-1" />
                  <span>Filtros</span>
                  <ChevronDown size={16} className="ml-1" />
                </button>

                {/* Painel de filtros */}
                {isFilterOpen && (
                  <div className="absolute right-0 top-full mt-2 z-10 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-3">Filtrar Transações</h4>

                    <div className="space-y-3">
                      {/* Tipo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tipo
                        </label>
                        <select
                          value={filter.type}
                          onChange={(e) => updateFilter('type', e.target.value)}
                          className="cashpilot-input"
                        >
                          <option value="todos">Todos</option>
                          <option value="entrada">Entradas</option>
                          <option value="saida">Saídas</option>
                        </select>
                      </div>

                      {/* Categoria */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Categoria
                        </label>
                        <select
                          value={filter.category}
                          onChange={(e) => updateFilter('category', e.target.value)}
                          className="cashpilot-input"
                        >
                          <option value="">Todas</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Data inicial */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          De
                        </label>
                        <input
                          type="date"
                          value={filter.dateFrom}
                          onChange={(e) => updateFilter('dateFrom', e.target.value)}
                          className="cashpilot-input"
                        />
                      </div>

                      {/* Data final */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Até
                        </label>
                        <input
                          type="date"
                          value={filter.dateTo}
                          onChange={(e) => updateFilter('dateTo', e.target.value)}
                          className="cashpilot-input"
                        />
                      </div>

                      {/* Botões */}
                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={clearFilters}
                          className="cashpilot-button-secondary text-sm flex-1"
                        >
                          Limpar
                        </button>
                        <button
                          onClick={applyFilters}
                          className="cashpilot-button-primary text-sm flex-1"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  updateFilter('search', '');
                  fetchTransactions();
                }}
                className="cashpilot-button-primary"
                disabled={!filter.search}
              >
                Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de transações */}
        <div className="cashpilot-card p-4 overflow-hidden">
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={28} className="text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">Nenhuma transação encontrada</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {Object.values(filter).some(v => v !== '' && v !== 'todos')
                  ? 'Tente ajustar os filtros para ver mais resultados'
                  : 'Comece registrando uma nova transação'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-medium cursor-pointer" onClick={() => toggleSort('data')}>
                      <div className="flex items-center">
                        Data
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th className="pb-3 font-medium cursor-pointer" onClick={() => toggleSort('descricao')}>
                      <div className="flex items-center">
                        Descrição
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th className="pb-3 font-medium">Categoria</th>
                    <th className="pb-3 font-medium cursor-pointer" onClick={() => toggleSort('tipo')}>
                      <div className="flex items-center">
                        Tipo
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th className="pb-3 font-medium text-right cursor-pointer" onClick={() => toggleSort('valor')}>
                      <div className="flex items-center justify-end">
                        Valor
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th className="pb-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 whitespace-nowrap">
                        {format(parseISO(transaction.data), 'dd/MM/yyyy')}
                      </td>
                      <td className="py-3 font-medium text-gray-800 dark:text-white max-w-xs truncate">
                        {transaction.descricao}
                      </td>
                      <td className="py-3">
                        {transaction.categoria ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {transaction.categoria.nome}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            Sem categoria
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${transaction.tipo === 'entrada'
                            ? 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300'
                            : 'bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300'
                          }`}>
                          {transaction.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-medium ${transaction.tipo === 'entrada'
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-danger-600 dark:text-danger-400'
                        }`}>
                        {transaction.tipo === 'entrada' ? '+' : '-'}
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(transaction.valor)}
                      </td>
                      <td className="py-3 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-1">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                            aria-label="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(transaction.id)}
                            className="p-1.5 rounded-full text-gray-500 hover:text-danger-600 hover:bg-danger-50 dark:text-gray-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/30"
                            aria-label="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal de transação */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCurrentTransaction(undefined);
          fetchTransactions(); // Recarregar dados após fechar o modal
        }}
        transaction={currentTransaction}
      />

      {/* Confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Confirmar exclusão
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </p>
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

export default Transactions;