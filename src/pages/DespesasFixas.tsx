import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Calendar, CheckCircle, XCircle, ArrowUpDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DespesaRecorrenteModal from '../components/despesas/DespesaRecorrenteModal';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

type DespesaRecorrente = {
    id: string;
    valor: number;
    descricao: string;
    dia_vencimento: number;
    categoria_id: string | null;
    categoria?: { nome: string } | null;
    ativa: boolean;
    data_inicio: string;
    data_fim: string | null;
};

const DespesasFixas = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [despesas, setDespesas] = useState<DespesaRecorrente[]>([]);
    const [despesaSelecionada, setDespesaSelecionada] = useState<DespesaRecorrente | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [totalDespesasAtivas, setTotalDespesasAtivas] = useState(0);

    // Filtros
    const [filtroAtivas, setFiltroAtivas] = useState<boolean | null>(true); // Padrão: apenas ativas
    const [ordenarPor, setOrdenarPor] = useState<'valor' | 'dia_vencimento' | 'descricao'>('dia_vencimento');
    const [ordenarAsc, setOrdenarAsc] = useState(true);

    useEffect(() => {
        if (user) {
            carregarDespesas();
        }
    }, [user, filtroAtivas, ordenarPor, ordenarAsc]);

    const carregarDespesas = async () => {
        try {
            setIsLoading(true);

            // Construir a query
            let query = supabase
                .from('despesas_recorrentes')
                .select(`
          id,
          valor,
          descricao,
          dia_vencimento,
          categoria_id,
          ativa,
          data_inicio,
          data_fim,
          categorias (
            nome
          )
        `)
                .eq('usuario_id', user?.id || '');

            // Aplicar filtro de ativas/inativas
            if (filtroAtivas !== null) {
                query = query.eq('ativa', filtroAtivas);
            }

            // Aplicar ordenação
            query = query.order(ordenarPor, { ascending: ordenarAsc });

            const { data, error } = await query;

            if (error) throw error;

            // Processar dados
            const despesasProcessadas = data?.map((despesa) => ({
                id: despesa.id,
                valor: despesa.valor,
                descricao: despesa.descricao,
                dia_vencimento: despesa.dia_vencimento,
                categoria_id: despesa.categoria_id,
                categoria: despesa.categorias,
                ativa: despesa.ativa,
                data_inicio: despesa.data_inicio,
                data_fim: despesa.data_fim
            })) || [];

            setDespesas(despesasProcessadas);

            // Calcular total de despesas ativas
            const total = despesasProcessadas
                .filter(d => d.ativa)
                .reduce((sum, d) => sum + d.valor, 0);

            setTotalDespesasAtivas(total);

        } catch (error) {
            console.error('Erro ao carregar despesas fixas:', error);
            toast.error('Não foi possível carregar as despesas fixas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNovoClick = () => {
        setDespesaSelecionada(undefined);
        setIsModalOpen(true);
    };

    const handleEditarClick = (despesa: DespesaRecorrente) => {
        setDespesaSelecionada(despesa);
        setIsModalOpen(true);
    };

    const handleExcluirClick = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta despesa fixa?')) {
            try {
                const { error } = await supabase
                    .from('despesas_recorrentes')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                toast.success('Despesa fixa excluída com sucesso');
                carregarDespesas();
            } catch (error) {
                console.error('Erro ao excluir despesa fixa:', error);
                toast.error('Não foi possível excluir a despesa fixa');
            }
        }
    };

    const handleAlterarStatus = async (id: string, novoStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('despesas_recorrentes')
                .update({ ativa: novoStatus })
                .eq('id', id);

            if (error) throw error;

            toast.success(`Despesa ${novoStatus ? 'ativada' : 'desativada'} com sucesso`);
            carregarDespesas();
        } catch (error) {
            console.error('Erro ao alterar status da despesa:', error);
            toast.error('Não foi possível alterar o status da despesa');
        }
    };

    // Formatação de moeda para o dashboar
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Título e botão */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciar Despesas Fixas</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Gerencie suas despesas recorrentes mensais
                    </p>
                </div>
                <button
                    onClick={handleNovoClick}
                    className="cashpilot-button-primary flex items-center"
                >
                    <Plus size={16} className="mr-1" />
                    <span>Nova Despesa Fixa</span>
                </button>
            </div>

            {/* Resumo e filtros */}
            <div className="cashpilot-card p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                    <div>
                        <p className="text-gray-600 dark:text-gray-300 mb-1">Total mensal em despesas fixas:</p>
                        <p className="text-xl font-bold text-danger-600 dark:text-danger-400">
                            {formatCurrency(totalDespesasAtivas)}
                        </p>
                    </div>

                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Mostrar:</span>
                            <select
                                value={filtroAtivas === null ? 'todas' : (filtroAtivas ? 'ativas' : 'inativas')}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === 'todas') setFiltroAtivas(null);
                                    else if (value === 'ativas') setFiltroAtivas(true);
                                    else setFiltroAtivas(false);
                                }}
                                className="cashpilot-input py-1 text-sm"
                            >
                                <option value="todas">Todas</option>
                                <option value="ativas">Apenas ativas</option>
                                <option value="inativas">Apenas inativas</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Ordenar por:</span>
                            <select
                                value={ordenarPor}
                                onChange={(e) => setOrdenarPor(e.target.value as 'valor' | 'dia_vencimento' | 'descricao')}
                                className="cashpilot-input py-1 text-sm"
                            >
                                <option value="dia_vencimento">Dia de vencimento</option>
                                <option value="valor">Valor</option>
                                <option value="descricao">Descrição</option>
                            </select>

                            <button
                                onClick={() => setOrdenarAsc(!ordenarAsc)}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <ArrowUpDown size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de despesas */}
            <div className="cashpilot-card p-4">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-500 dark:text-gray-400 text-sm">
                                <th className="pb-3 font-medium">Descrição</th>
                                <th className="pb-3 font-medium">Dia</th>
                                <th className="pb-3 font-medium">Categoria</th>
                                <th className="pb-3 font-medium text-right">Valor</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-4 text-center text-gray-500 dark:text-gray-400">
                                        Carregando despesas fixas...
                                    </td>
                                </tr>
                            ) : despesas.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-4 text-center text-gray-500 dark:text-gray-400">
                                        Nenhuma despesa fixa encontrada.
                                    </td>
                                </tr>
                            ) : (
                                despesas.map((despesa) => (
                                    <tr
                                        key={despesa.id}
                                        className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!despesa.ativa ? 'opacity-60' : ''
                                            }`}
                                    >
                                        <td className="py-3">
                                            <div className="font-medium text-gray-800 dark:text-white">
                                                {despesa.descricao}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Desde: {format(parseISO(despesa.data_inicio), 'dd/MM/yyyy')}
                                                {despesa.data_fim && ` até ${format(parseISO(despesa.data_fim), 'dd/MM/yyyy')}`}
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center">
                                                <Calendar size={14} className="mr-1 text-primary-500" />
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    Dia {despesa.dia_vencimento}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            {despesa.categoria ? (
                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                    {despesa.categoria.nome}
                                                </span>
                                            ) : (
                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                    Sem categoria
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 text-right font-medium text-danger-600 dark:text-danger-400">
                                            {formatCurrency(despesa.valor)}
                                        </td>
                                        <td className="py-3">
                                            {despesa.ativa ? (
                                                <button
                                                    onClick={() => handleAlterarStatus(despesa.id, false)}
                                                    className="flex items-center text-success-600 dark:text-success-400 hover:text-success-700 dark:hover:text-success-300"
                                                >
                                                    <CheckCircle size={16} className="mr-1" />
                                                    <span className="text-sm">Ativa</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAlterarStatus(despesa.id, true)}
                                                    className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                                >
                                                    <XCircle size={16} className="mr-1" />
                                                    <span className="text-sm">Inativa</span>
                                                </button>
                                            )}
                                        </td>
                                        <td className="py-3 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEditarClick(despesa)}
                                                    className="p-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleExcluirClick(despesa.id)}
                                                    className="p-1 text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de despesa recorrente */}
            <DespesaRecorrenteModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    carregarDespesas();
                }}
                despesa={despesaSelecionada}
            />
        </motion.div>
    );
};

export default DespesasFixas; 