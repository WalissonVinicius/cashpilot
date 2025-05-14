import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  BarChart,
  ArrowUpRight,
  Clock,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  PiggyBank,
  Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import TransactionModal from '../components/transactions/TransactionModal';
import DespesaRecorrenteModal from '../components/despesas/DespesaRecorrenteModal';
import OrcamentoModal from '../components/despesas/OrcamentoModal';
import { Bar, Line } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Transaction {
  id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  data: string;
  descricao: string;
  categoria_id: string | null;
  categoria?: { nome: string } | null;
}

interface DespesaRecorrente {
  id: string;
  valor: number;
  descricao: string;
  dia_vencimento: number;
  categoria_id: string | null;
  categoria?: { nome: string } | null;
  ativa: boolean;
}

interface ConfiguracaoOrcamento {
  valor_mensal: number;
  valor_reserva_emergencia: number;
  percentual_lazer: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false);
  const [isOrcamentoModalOpen, setIsOrcamentoModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [despesasRecorrentes, setDespesasRecorrentes] = useState<DespesaRecorrente[]>([]);
  const [configOrcamento, setConfigOrcamento] = useState<ConfiguracaoOrcamento>({
    valor_mensal: 0,
    valor_reserva_emergencia: 0,
    percentual_lazer: 10
  });

  const [summary, setSummary] = useState({
    saldo: 0,
    entradas: 0,
    saidas: 0,
    countEntradas: 0,
    countSaidas: 0,
    valorDisponivel: 0,
    totalDespesasFixas: 0
  });

  const [chartData, setChartData] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any>(null);

  // Formatação de moeda para o dashboard
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Buscar dados ao carregar o componente
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Função para buscar dados
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Data atual e data inicial (6 meses atrás)
      const currentDate = new Date();
      const startDate = subMonths(startOfMonth(currentDate), 5);

      // Buscar transações
      const { data: transactionsData, error: transactionsError } = await supabase
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
        .eq('usuario_id', user?.id || '')
        .gte('data', startDate.toISOString())
        .order('data', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Buscar despesas recorrentes
      const { data: despesasData, error: despesasError } = await supabase
        .from('despesas_recorrentes')
        .select(`
          id,
          valor,
          descricao,
          dia_vencimento,
          categoria_id,
          ativa,
          categorias (
            nome
          )
        `)
        .eq('usuario_id', user?.id || '')
        .eq('ativa', true);

      if (despesasError) throw despesasError;

      // Buscar configurações de orçamento
      const { data: configData, error: configError } = await supabase
        .from('configuracoes_orcamento')
        .select('*')
        .eq('usuario_id', user?.id || '')
        .single();

      if (configError && configError.code !== 'PGRST116') { // Ignora erro "not found"
        throw configError;
      }

      // Processar dados para o dashboard
      const processedTransactions = transactionsData?.map((transaction: any) => ({
        id: transaction.id,
        tipo: transaction.tipo,
        valor: transaction.valor,
        data: transaction.data,
        descricao: transaction.descricao,
        categoria_id: transaction.categoria_id,
        categoria: transaction.categorias
      })) || [];

      const processedDespesas = despesasData?.map((despesa: any) => ({
        id: despesa.id,
        valor: despesa.valor,
        descricao: despesa.descricao,
        dia_vencimento: despesa.dia_vencimento,
        categoria_id: despesa.categoria_id,
        categoria: despesa.categorias,
        ativa: despesa.ativa
      })) || [];

      setTransactions(processedTransactions);
      setDespesasRecorrentes(processedDespesas);

      if (configData) {
        setConfigOrcamento({
          valor_mensal: configData.valor_mensal || 0,
          valor_reserva_emergencia: configData.valor_reserva_emergencia || 0,
          percentual_lazer: configData.percentual_lazer || 10
        });
      }

      // Calcular resumo financeiro
      const entradas = processedTransactions
        .filter((t: Transaction) => t.tipo === 'entrada')
        .reduce((sum: number, t: Transaction) => sum + t.valor, 0);

      const saidas = processedTransactions
        .filter((t: Transaction) => t.tipo === 'saida')
        .reduce((sum: number, t: Transaction) => sum + t.valor, 0);

      const countEntradas = processedTransactions.filter((t: Transaction) => t.tipo === 'entrada').length;
      const countSaidas = processedTransactions.filter((t: Transaction) => t.tipo === 'saida').length;

      // Calcular total das despesas fixas mensais
      const totalDespesasFixas = processedDespesas
        .reduce((sum: number, d: DespesaRecorrente) => sum + d.valor, 0);

      // Calcular valor disponível para gastos (apenas renda mensal - despesas fixas)
      const saldoAtual = entradas - saidas;
      const valorDisponivel = Math.max(0, (configData?.valor_mensal || 0) - totalDespesasFixas);

      setSummary({
        saldo: saldoAtual,
        entradas,
        saidas,
        countEntradas,
        countSaidas,
        valorDisponivel,
        totalDespesasFixas
      });

      // Preparar dados para gráficos
      prepareChartData(processedTransactions, startDate, currentDate);
      prepareCategoryData(processedTransactions);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Preparar dados para o gráfico de linha (evolução mensal)
  const prepareChartData = (transactions: Transaction[], startDate: Date, endDate: Date) => {
    // Criar array de meses no período
    const months: Date[] = [];
    let currentMonth = startDate;

    while (currentMonth <= endDate) {
      months.push(new Date(currentMonth));
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }

    // Inicializar arrays de dados
    const monthLabels = months.map(month =>
      format(month, 'MMM/yy', { locale: ptBR }).replace('.', '')
    );

    const entradasData = Array(months.length).fill(0);
    const saidasData = Array(months.length).fill(0);

    // Preencher dados de cada mês
    transactions.forEach(transaction => {
      const transactionDate = parseISO(transaction.data);
      const monthIndex = months.findIndex(month =>
        transactionDate.getMonth() === month.getMonth() &&
        transactionDate.getFullYear() === month.getFullYear()
      );

      if (monthIndex !== -1) {
        if (transaction.tipo === 'entrada') {
          entradasData[monthIndex] += transaction.valor;
        } else {
          saidasData[monthIndex] += transaction.valor;
        }
      }
    });

    // Criar objeto de dados para o gráfico
    const data = {
      labels: monthLabels,
      datasets: [
        {
          label: 'Entradas',
          data: entradasData,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgb(16, 185, 129)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Saídas',
          data: saidasData,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgb(239, 68, 68)',
          tension: 0.3,
          fill: true,
        }
      ]
    };

    setChartData(data);
  };

  // Preparar dados para o gráfico de categorias
  const prepareCategoryData = (transactions: Transaction[]) => {
    // Apenas considerar saídas nas últimas 4 semanas para o gráfico de categorias
    const lastMonth = subMonths(new Date(), 1);
    const recentTransactions = transactions.filter(t =>
      t.tipo === 'saida' && new Date(t.data) >= lastMonth
    );

    // Agrupar por categoria
    const categorySums: { [key: string]: number } = {};

    recentTransactions.forEach(transaction => {
      const categoryName = transaction.categoria?.nome || 'Sem categoria';
      if (!categorySums[categoryName]) {
        categorySums[categoryName] = 0;
      }
      categorySums[categoryName] += transaction.valor;
    });

    // Converter para arrays para usar no gráfico
    const categories = Object.keys(categorySums);
    const values = Object.values(categorySums);

    // Limitar a 5 principais categorias
    let topCategories = categories;
    let topValues = values;

    if (categories.length > 5) {
      // Ordenar categorias por valor e pegar as 5 principais
      const categoriesWithValues = categories.map((cat, i) => ({ cat, value: values[i] }));
      categoriesWithValues.sort((a, b) => b.value - a.value);

      topCategories = categoriesWithValues.slice(0, 5).map(item => item.cat);
      topValues = categoriesWithValues.slice(0, 5).map(item => item.value);
    }

    // Criar dados para o gráfico
    const data = {
      labels: topCategories,
      datasets: [
        {
          label: 'Gastos por Categoria',
          data: topValues,
          backgroundColor: [
            'rgba(30, 58, 138, 0.7)',
            'rgba(79, 70, 229, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)'
          ],
          borderWidth: 1
        }
      ]
    };

    setCategoryData(data);
  };

  // Configurações gerais dos gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += formatCurrency(context.raw);
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  // As últimas 5 transações para o dashboard
  const recentTransactions = transactions.slice(0, 5);

  // Próximas despesas recorrentes, ordenadas por data de vencimento
  const currentDate = new Date();
  const currentDay = currentDate.getDate();

  const proximasDespesas = [...despesasRecorrentes]
    .sort((a, b) => {
      // Ordena primeiro pelos vencimentos do mês atual (ainda não vencidos)
      if (a.dia_vencimento > currentDay && b.dia_vencimento <= currentDay) {
        return -1;
      }
      if (a.dia_vencimento <= currentDay && b.dia_vencimento > currentDay) {
        return 1;
      }
      // Se ambos estão na mesma situação (vencidos ou não vencidos), ordena por dia
      return a.dia_vencimento - b.dia_vencimento;
    })
    .slice(0, 5);  // Pegar apenas as 5 primeiras

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Título e botão */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Financeiro</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Visão geral das suas finanças
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsDespesaModalOpen(true)}
            className="cashpilot-button-outline flex items-center"
          >
            <Calendar size={16} className="mr-1" />
            <span>Nova Despesa Fixa</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="cashpilot-button-primary flex items-center"
          >
            <Plus size={16} className="mr-1" />
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className={`stat-card ${summary.saldo >= 0 ? 'border-l-4 border-success-500' : 'border-l-4 border-danger-500'}`}>
          <span className="stat-card-title">Saldo Atual</span>
          <span className={`stat-card-value ${summary.saldo >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
            {formatCurrency(summary.saldo)}
          </span>
        </div>

        <div className="stat-card border-l-4 border-primary-500">
          <span className="stat-card-title">Disponível para Gastos</span>
          <span className="stat-card-value text-primary-600 dark:text-primary-400">
            {formatCurrency(summary.valorDisponivel)}
          </span>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center">
              <PiggyBank size={16} className="text-primary-500 mr-1" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Valor seguro para uso mensal
              </span>
            </div>
            <button
              onClick={() => setIsOrcamentoModalOpen(true)}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center"
            >
              <Settings size={12} className="mr-1" />
              Configurar
            </button>
          </div>
        </div>

        <div className="stat-card border-l-4 border-success-500">
          <span className="stat-card-title">Entradas</span>
          <div className="flex items-baseline">
            <span className="stat-card-value text-success-600 dark:text-success-400">
              {formatCurrency(summary.entradas)}
            </span>
            <span className="text-sm ml-2 text-gray-500 dark:text-gray-400">
              {summary.countEntradas} transações
            </span>
          </div>
          <div className="flex items-center mt-1">
            <ArrowUpRight size={16} className="text-success-500 mr-1" />
            <span className="text-xs text-success-600 dark:text-success-400">
              +{formatCurrency(summary.entradas)}
            </span>
          </div>
        </div>

        <div className="stat-card border-l-4 border-danger-500">
          <span className="stat-card-title">Despesas Fixas</span>
          <div className="flex items-baseline">
            <span className="stat-card-value text-danger-600 dark:text-danger-400">
              {formatCurrency(summary.totalDespesasFixas)}
            </span>
            <span className="text-sm ml-2 text-gray-500 dark:text-gray-400">
              {despesasRecorrentes.length} mensais
            </span>
          </div>
          <div className="flex items-center mt-1">
            <Clock size={16} className="text-danger-500 mr-1" />
            <span className="text-xs text-danger-600 dark:text-danger-400">
              -{formatCurrency(summary.totalDespesasFixas)} /mês
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos e Despesas Fixas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Gráfico de linha - Entradas x Saídas */}
        <div className="cashpilot-card p-4 lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
              <LineChart size={18} className="mr-2 text-primary-600 dark:text-primary-400" />
              Evolução Mensal
            </h3>
          </div>

          <div className="h-64">
            {chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Carregando dados...</p>
              </div>
            )}
          </div>
        </div>

        {/* Próximas despesas fixas */}
        <div className="cashpilot-card p-4 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
              <Calendar size={18} className="mr-2 text-primary-600 dark:text-primary-400" />
              Próximas Despesas Fixas
            </h3>
            <Link to="/despesas-fixas" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center">
              <Settings size={14} className="mr-1" />
              Gerenciar
            </Link>
          </div>

          {despesasRecorrentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <DollarSign size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">Nenhuma despesa fixa cadastrada</p>
              <button
                onClick={() => setIsDespesaModalOpen(true)}
                className="text-sm px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-800/50 transition-colors"
              >
                Adicionar despesa fixa
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {proximasDespesas.map((despesa) => (
                <div key={despesa.id} className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {despesa.descricao}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <Calendar size={14} className="mr-1" />
                        <span>Dia {despesa.dia_vencimento} de cada mês</span>
                      </div>
                    </div>
                    <div className="text-right font-medium text-danger-600 dark:text-danger-400">
                      {formatCurrency(despesa.valor)}
                    </div>
                  </div>
                  {despesa.categoria && (
                    <div className="mt-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {despesa.categoria.nome}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              <div className="text-center pt-2">
                <Link
                  to="/despesas-fixas"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Gerenciar despesas fixas
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gastos por categoria e transações recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Gráfico de barras - Gastos por categoria */}
        <div className="cashpilot-card p-4 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
              <BarChart size={18} className="mr-2 text-primary-600 dark:text-primary-400" />
              Principais Gastos por Categoria
            </h3>
          </div>

          <div className="h-64">
            {categoryData ? (
              <Bar data={categoryData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Carregando dados...</p>
              </div>
            )}
          </div>
        </div>

        {/* Últimas transações */}
        <div className="cashpilot-card p-4 lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Últimas Transações
            </h3>

            <div className="flex space-x-2">
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="px-3 py-1 pr-8 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
                <Search size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              <button className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {/* Lista de transações */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 text-sm">
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Categoria</th>
                  <th className="pb-2 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500 dark:text-gray-400">
                      Carregando transações...
                    </td>
                  </tr>
                ) : recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500 dark:text-gray-400">
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3">
                        <div className="font-medium text-gray-800 dark:text-white">
                          {transaction.descricao}
                        </div>
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">
                        {format(parseISO(transaction.data), 'dd/MM/yyyy')}
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
                      <td className={`py-3 text-right font-medium ${transaction.tipo === 'entrada'
                        ? 'text-success-600 dark:text-success-400'
                        : 'text-danger-600 dark:text-danger-400'
                        }`}>
                        {transaction.tipo === 'entrada' ? '+' : '-'}
                        {formatCurrency(transaction.valor)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de transação */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchData(); // Recarregar dados após fechar o modal
        }}
      />

      {/* Modal de despesa recorrente */}
      <DespesaRecorrenteModal
        isOpen={isDespesaModalOpen}
        onClose={() => {
          setIsDespesaModalOpen(false);
          fetchData(); // Recarregar dados após fechar o modal
        }}
      />

      {/* Modal de orçamento */}
      <OrcamentoModal
        isOpen={isOrcamentoModalOpen}
        onClose={() => {
          setIsOrcamentoModalOpen(false);
          fetchData(); // Recarregar dados após fechar o modal
        }}
        orcamentoAtual={configOrcamento}
      />
    </motion.div>
  );
};

export default Dashboard;