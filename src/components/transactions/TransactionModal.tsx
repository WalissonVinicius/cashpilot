import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Database } from '../../types/supabase';

type Categoria = Database['public']['Tables']['categorias']['Row'];
type Transacao = Database['public']['Tables']['transacoes']['Row'];

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transacao; // Opcional para edição
}

const TransactionModal = ({ isOpen, onClose, transaction }: TransactionModalProps) => {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Estado do formulário
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);

  // Carregar categorias
  useEffect(() => {
    if (isOpen && user) {
      loadCategorias();
    }
  }, [isOpen, user]);

  // Preencher dados para edição
  useEffect(() => {
    if (transaction) {
      setTipo(transaction.tipo);
      setValor(String(transaction.valor));
      setData(transaction.data.split('T')[0]); // Ajustar formato da data
      setDescricao(transaction.descricao);
      setCategoriaId(transaction.categoria_id);
    } else {
      // Para nova transação, definir data para hoje
      const today = new Date().toISOString().split('T')[0];
      setData(today);
      setTipo('entrada');
      setValor('');
      setDescricao('');
      setCategoriaId(null);
    }
  }, [transaction, isOpen]);

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('usuario_id', user?.id)
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Não foi possível carregar as categorias');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!valor || parseFloat(valor) <= 0) {
      setFormError('Informe um valor válido');
      return;
    }

    if (!data) {
      setFormError('Informe uma data válida');
      return;
    }

    if (!descricao.trim()) {
      setFormError('Informe uma descrição');
      return;
    }

    try {
      setIsLoading(true);
      
      // Preparar dados
      const transacaoData = {
        usuario_id: user?.id,
        tipo,
        valor: parseFloat(valor),
        data,
        descricao: descricao.trim(),
        categoria_id: categoriaId
      };

      let result;

      if (transaction) {
        // Atualizar transação existente
        result = await supabase
          .from('transacoes')
          .update(transacaoData)
          .eq('id', transaction.id)
          .eq('usuario_id', user?.id);
          
        if (result.error) throw result.error;
        toast.success('Transação atualizada com sucesso!');
      } else {
        // Criar nova transação
        result = await supabase
          .from('transacoes')
          .insert([transacaoData]);
          
        if (result.error) throw result.error;
        toast.success('Transação registrada com sucesso!');
      }
      
      // Limpar form e fechar modal
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Erro:', error);
      setFormError(error.message || 'Ocorreu um erro ao processar a transação');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTipo('entrada');
    setValor('');
    setData(new Date().toISOString().split('T')[0]);
    setDescricao('');
    setCategoriaId(null);
    setFormError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Formatar input de valor como moeda
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir apenas números e ponto
    let input = e.target.value.replace(/[^0-9.]/g, '');
    
    // Garantir apenas um ponto decimal
    const parts = input.split('.');
    if (parts.length > 2) {
      input = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setValor(input);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()} // Evitar fechamento ao clicar no modal
            >
              {/* Cabeçalho */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {transaction ? 'Editar Transação' : 'Nova Transação'}
                </h2>
                <button 
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="p-4">
                {/* Mensagem de erro */}
                {formError && (
                  <div className="mb-4 p-3 bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 rounded-lg flex items-start">
                    <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{formError}</p>
                  </div>
                )}

                {/* Tipo de transação */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Transação
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className={`flex-1 py-2 px-4 rounded-lg border ${
                        tipo === 'entrada'
                          ? 'bg-success-50 border-success-500 text-success-700 dark:bg-success-900/30 dark:border-success-600 dark:text-success-400'
                          : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                      }`}
                      onClick={() => setTipo('entrada')}
                    >
                      Entrada
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 px-4 rounded-lg border ${
                        tipo === 'saida'
                          ? 'bg-danger-50 border-danger-500 text-danger-700 dark:bg-danger-900/30 dark:border-danger-600 dark:text-danger-400'
                          : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                      }`}
                      onClick={() => setTipo('saida')}
                    >
                      Saída
                    </button>
                  </div>
                </div>

                {/* Valor */}
                <div className="mb-4">
                  <label htmlFor="valor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                      R$
                    </span>
                    <input
                      type="text"
                      id="valor"
                      value={valor}
                      onChange={handleValorChange}
                      className="cashpilot-input pl-10"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                {/* Data */}
                <div className="mb-4">
                  <label htmlFor="data" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    id="data"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="cashpilot-input"
                  />
                </div>

                {/* Descrição */}
                <div className="mb-4">
                  <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="cashpilot-input"
                    placeholder="Ex: Compras supermercado"
                  />
                </div>

                {/* Categoria */}
                <div className="mb-6">
                  <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoria
                  </label>
                  <select
                    id="categoria"
                    value={categoriaId || ''}
                    onChange={(e) => setCategoriaId(e.target.value || null)}
                    className="cashpilot-input"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botões */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="cashpilot-button-secondary flex-1"
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 ${
                      tipo === 'entrada' ? 'cashpilot-button-success' : 'cashpilot-button-primary'
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvando...
                      </span>
                    ) : (
                      'Salvar'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TransactionModal;