import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, AlertCircle, DollarSign, PiggyBank } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { PostgrestError } from '@supabase/supabase-js';

interface ConfiguracaoOrcamento {
    valor_mensal: number;
    valor_reserva_emergencia: number;
    percentual_lazer: number;
}

interface OrcamentoModalProps {
    isOpen: boolean;
    onClose: () => void;
    orcamentoAtual?: ConfiguracaoOrcamento;
}

const OrcamentoModal = ({ isOpen, onClose, orcamentoAtual }: OrcamentoModalProps) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // Estado do formulário
    const [valorMensal, setValorMensal] = useState('');
    const [valorReserva, setValorReserva] = useState('');
    const [percentualLazer, setPercentualLazer] = useState('10');

    // Preencher dados iniciais
    useEffect(() => {
        if (orcamentoAtual) {
            setValorMensal(String(orcamentoAtual.valor_mensal));
            setValorReserva(String(orcamentoAtual.valor_reserva_emergencia));
            setPercentualLazer(String(orcamentoAtual.percentual_lazer));
        } else {
            setValorMensal('');
            setValorReserva('0');
            setPercentualLazer('10');
        }
    }, [orcamentoAtual, isOpen]);

    const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        // Permitir apenas números e vírgula/ponto
        const value = e.target.value.replace(/[^0-9,.]/g, '');
        setter(value);
    };

    const handlePercentualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Permitir apenas números
        const value = e.target.value.replace(/[^0-9]/g, '');
        const numValue = parseInt(value, 10);

        if (!value) {
            setPercentualLazer('');
        } else if (numValue > 100) {
            setPercentualLazer('100');
        } else {
            setPercentualLazer(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        // Validação de formulário
        if (!valorMensal || parseFloat(valorMensal.replace(',', '.')) <= 0) {
            setFormError('É necessário informar um valor mensal válido');
            return;
        }

        if (!user?.id) {
            setFormError('Usuário não identificado. Faça login novamente.');
            return;
        }

        try {
            setIsLoading(true);

            // Converter valores para o formato correto
            const valorMensalNumerico = parseFloat(valorMensal.replace(',', '.'));
            const valorReservaNumerico = valorReserva ? parseFloat(valorReserva.replace(',', '.')) : 0;
            const percentualLazerNumerico = percentualLazer ? parseInt(percentualLazer, 10) : 10;

            // Criar objeto com os dados do orçamento
            const orcamentoData = {
                usuario_id: user.id,
                valor_mensal: valorMensalNumerico,
                valor_reserva_emergencia: valorReservaNumerico,
                percentual_lazer: percentualLazerNumerico,
                updated_at: new Date().toISOString()
            };

            // Verificar se já existe um orçamento para este usuário
            const { data: existingData, error: checkError } = await supabase
                .from('configuracoes_orcamento')
                .select('id')
                .eq('usuario_id', user.id)
                .maybeSingle();

            if (checkError) throw checkError;

            let error;

            if (existingData?.id) {
                // Atualizar configuração existente
                const { error: updateError } = await supabase
                    .from('configuracoes_orcamento')
                    .update(orcamentoData)
                    .eq('usuario_id', user.id);

                error = updateError;
            } else {
                // Inserir nova configuração
                const { error: insertError } = await supabase
                    .from('configuracoes_orcamento')
                    .insert([orcamentoData]);

                error = insertError;
            }

            if (error) throw error;

            // Fechar modal e notificar sucesso
            onClose();
            toast.success('Orçamento configurado com sucesso!');

        } catch (error: unknown) {
            const pgError = error as PostgrestError;
            console.error('Erro ao salvar orçamento:', pgError);
            setFormError(pgError.message || 'Ocorreu um erro ao salvar o orçamento');
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
                                        Configurar Orçamento Mensal
                                    </h3>
                                    <button
                                        onClick={() => !isLoading && onClose()}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </Dialog.Title>

                                <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg">
                                    <h4 className="font-medium flex items-center mb-2">
                                        <DollarSign size={18} className="mr-2" />
                                        Planeje seu orçamento mensal
                                    </h4>
                                    <p className="text-sm">
                                        Configure seu orçamento para saber quanto pode gastar com segurança a cada mês,
                                        sem afetar suas despesas fixas e reserva de emergência.
                                    </p>
                                </div>

                                {formError && (
                                    <div className="mb-4 p-3 bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 rounded-lg flex items-start">
                                        <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm">{formError}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    {/* Valor Mensal */}
                                    <div className="mb-4">
                                        <label htmlFor="valorMensal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Renda Mensal Total (R$)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                                                R$
                                            </span>
                                            <input
                                                type="text"
                                                id="valorMensal"
                                                value={valorMensal}
                                                onChange={(e) => handleValorChange(e, setValorMensal)}
                                                className="cashpilot-input pl-10"
                                                placeholder="0,00"
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Soma de todos os seus rendimentos mensais
                                        </p>
                                    </div>

                                    {/* Valor Reserva de Emergência */}
                                    <div className="mb-4">
                                        <label htmlFor="valorReserva" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Valor para Reserva de Emergência (R$)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                                                R$
                                            </span>
                                            <input
                                                type="text"
                                                id="valorReserva"
                                                value={valorReserva}
                                                onChange={(e) => handleValorChange(e, setValorReserva)}
                                                className="cashpilot-input pl-10"
                                                placeholder="0,00"
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Valor a ser poupado mensalmente (recomendado: 10% da renda)
                                        </p>
                                    </div>

                                    {/* Percentual para Lazer */}
                                    <div className="mb-6">
                                        <label htmlFor="percentualLazer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Percentual para Lazer (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="percentualLazer"
                                                value={percentualLazer}
                                                onChange={handlePercentualChange}
                                                className="cashpilot-input pr-8"
                                                placeholder="10"
                                                disabled={isLoading}
                                            />
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400">
                                                %
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Percentual do valor disponível que você deseja destinar para lazer
                                        </p>
                                    </div>

                                    {/* Estimativa */}
                                    {valorMensal && (
                                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <h4 className="font-medium flex items-center mb-2">
                                                <PiggyBank size={18} className="mr-2 text-primary-600 dark:text-primary-400" />
                                                Estimativa
                                            </h4>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="block text-gray-500 dark:text-gray-400">Valor disponível:</span>
                                                    <span className="font-medium text-gray-800 dark:text-white">
                                                        R$ {(parseFloat(valorMensal.replace(',', '.')) - (valorReserva ? parseFloat(valorReserva.replace(',', '.')) : 0)).toFixed(2).replace('.', ',')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-500 dark:text-gray-400">Para lazer:</span>
                                                    <span className="font-medium text-gray-800 dark:text-white">
                                                        R$ {((parseFloat(valorMensal.replace(',', '.')) - (valorReserva ? parseFloat(valorReserva.replace(',', '.')) : 0)) * (parseInt(percentualLazer || '10') / 100)).toFixed(2).replace('.', ',')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

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

export default OrcamentoModal; 