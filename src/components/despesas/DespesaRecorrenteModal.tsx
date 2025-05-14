import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { PostgrestError } from '@supabase/supabase-js';

interface Categoria {
    id: string;
    nome: string;
}

interface DespesaRecorrente {
    id: string;
    valor: number;
    descricao: string;
    dia_vencimento: number;
    categoria_id: string | null;
    ativa: boolean;
    data_inicio: string;
    data_fim: string | null;
}

interface DespesaRecorrenteModalProps {
    isOpen: boolean;
    onClose: () => void;
    despesa?: DespesaRecorrente;
}

const DespesaRecorrenteModal = ({ isOpen, onClose, despesa }: DespesaRecorrenteModalProps) => {
    const { user } = useAuth();
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // Estado do formulário
    const [valor, setValor] = useState('');
    const [descricao, setDescricao] = useState('');
    const [diaVencimento, setDiaVencimento] = useState('');
    const [categoriaId, setCategoriaId] = useState<string | null>(null);
    const [ativa, setAtiva] = useState(true);
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    // Carregar categorias
    useEffect(() => {
        if (isOpen && user) {
            loadCategorias();
        }
    }, [isOpen, user]);

    // Preencher dados para edição
    useEffect(() => {
        if (despesa) {
            setValor(String(despesa.valor));
            setDescricao(despesa.descricao);
            setDiaVencimento(String(despesa.dia_vencimento));
            setCategoriaId(despesa.categoria_id);
            setAtiva(despesa.ativa);
            setDataInicio(despesa.data_inicio.split('T')[0]);
            if (despesa.data_fim) {
                setDataFim(despesa.data_fim.split('T')[0]);
            } else {
                setDataFim('');
            }
        } else {
            // Para nova despesa, definir data para hoje
            const today = new Date().toISOString().split('T')[0];
            setDataInicio(today);
            setValor('');
            setDescricao('');
            setDiaVencimento('1');
            setCategoriaId(null);
            setAtiva(true);
            setDataFim('');
        }
    }, [despesa, isOpen]);

    const loadCategorias = async () => {
        try {
            const { data, error } = await supabase
                .from('categorias')
                .select('*')
                .eq('usuario_id', user?.id || '')
                .order('nome');

            if (error) throw error;
            setCategorias(data || []);
        } catch (error: unknown) {
            const pgError = error as PostgrestError;
            console.error('Erro ao carregar categorias:', pgError);
            toast.error('Não foi possível carregar as categorias');
        }
    };

    const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Permitir apenas números e vírgula/ponto
        const value = e.target.value.replace(/[^0-9,.]/g, '');
        setValor(value);
    };

    const handleDiaVencimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Permitir apenas números
        const value = e.target.value.replace(/[^0-9]/g, '');

        // Limitar entre 1 e 31
        const numValue = parseInt(value, 10);

        if (!value) {
            setDiaVencimento('');
        } else if (numValue < 1) {
            setDiaVencimento('1');
        } else if (numValue > 31) {
            setDiaVencimento('31');
        } else {
            setDiaVencimento(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        // Validação de formulário
        if (!descricao.trim()) {
            setFormError('É necessário informar uma descrição');
            return;
        }

        if (!valor || parseFloat(valor.replace(',', '.')) <= 0) {
            setFormError('É necessário informar um valor válido');
            return;
        }

        if (!diaVencimento || parseInt(diaVencimento) < 1 || parseInt(diaVencimento) > 31) {
            setFormError('É necessário informar um dia de vencimento entre 1 e 31');
            return;
        }

        if (!dataInicio) {
            setFormError('É necessário informar a data de início');
            return;
        }

        if (!user?.id) {
            setFormError('Usuário não identificado. Faça login novamente.');
            return;
        }

        try {
            setIsLoading(true);

            // Converter o valor para o formato correto
            const valorNumerico = parseFloat(valor.replace(',', '.'));

            // Criar objeto com os dados da despesa
            const despesaData = {
                usuario_id: user.id,
                valor: valorNumerico,
                descricao: descricao.trim(),
                dia_vencimento: parseInt(diaVencimento),
                categoria_id: categoriaId,
                ativa,
                data_inicio: dataInicio,
                data_fim: dataFim || null
            };

            let error;

            if (despesa) {
                // Atualização de despesa existente
                const { error: updateError } = await supabase
                    .from('despesas_recorrentes')
                    .update(despesaData)
                    .eq('id', despesa.id);

                error = updateError;
            } else {
                // Inserção de nova despesa
                const { error: insertError } = await supabase
                    .from('despesas_recorrentes')
                    .insert([despesaData]);

                error = insertError;
            }

            if (error) throw error;

            // Fechar modal e notificar sucesso
            onClose();
            toast.success(despesa ? 'Despesa atualizada com sucesso!' : 'Despesa cadastrada com sucesso!');

        } catch (error: unknown) {
            const pgError = error as PostgrestError;
            console.error('Erro ao salvar despesa:', pgError);
            setFormError(pgError.message || 'Ocorreu um erro ao salvar a despesa');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !isLoading && onClose()}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm dark:bg-gray-900/70" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="div" className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {despesa ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}
                                    </h3>
                                    <button
                                        onClick={() => !isLoading && onClose()}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </Dialog.Title>

                                {formError && (
                                    <div className="mb-4 p-3 bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 rounded-lg flex items-start">
                                        <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm">{formError}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
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
                                            placeholder="Ex: Aluguel, Conta de Luz, etc."
                                            disabled={isLoading}
                                        />
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
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Dia de Vencimento */}
                                        <div className="mb-4">
                                            <label htmlFor="diaVencimento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Dia de Vencimento
                                            </label>
                                            <input
                                                type="text"
                                                id="diaVencimento"
                                                value={diaVencimento}
                                                onChange={handleDiaVencimentoChange}
                                                className="cashpilot-input"
                                                placeholder="Ex: 10"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        {/* Categoria */}
                                        <div className="mb-4">
                                            <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Categoria
                                            </label>
                                            <select
                                                id="categoria"
                                                value={categoriaId || ''}
                                                onChange={(e) => setCategoriaId(e.target.value || null)}
                                                className="cashpilot-input"
                                                disabled={isLoading}
                                            >
                                                <option value="">Selecione uma categoria</option>
                                                {categorias.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.nome}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Data de Início */}
                                        <div className="mb-4">
                                            <label htmlFor="dataInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Data de Início
                                            </label>
                                            <input
                                                type="date"
                                                id="dataInicio"
                                                value={dataInicio}
                                                onChange={(e) => setDataInicio(e.target.value)}
                                                className="cashpilot-input"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        {/* Data de Fim (opcional) */}
                                        <div className="mb-4">
                                            <label htmlFor="dataFim" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Data de Fim (opcional)
                                            </label>
                                            <input
                                                type="date"
                                                id="dataFim"
                                                value={dataFim}
                                                onChange={(e) => setDataFim(e.target.value)}
                                                className="cashpilot-input"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    {/* Ativa */}
                                    <div className="mb-6">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="ativa"
                                                checked={ativa}
                                                onChange={(e) => setAtiva(e.target.checked)}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                disabled={isLoading}
                                            />
                                            <label htmlFor="ativa" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                Despesa ativa
                                            </label>
                                        </div>
                                    </div>

                                    {/* Botões */}
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => !isLoading && onClose()}
                                            className="cashpilot-button-outline"
                                            disabled={isLoading}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="cashpilot-button-primary"
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
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default DespesaRecorrenteModal; 