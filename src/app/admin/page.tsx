
'use client';

import { useState } from 'react';

type DataRow = Record<string, unknown>;

type OrderItem = DataRow;

type AdminOrder = DataRow & {
  id: number;
  items: OrderItem[];
};

type AdminData = {
  users: DataRow[];
  orders: AdminOrder[];
};

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [data, setData] = useState<AdminData | null>(null);
  const [section, setSection] = useState<'orders' | 'users'>('orders');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  
    async function loadData(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
        const loginResponse = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        cache: 'no-store',
        });

        const loginResult = await loginResponse.json();

        if (!loginResponse.ok) {
        throw new Error(loginResult.error || 'Não foi possível entrar.');
        }

        const response = await fetch('/api/admin', {
        cache: 'no-store',
        });

        const result = await response.json();

        if (!response.ok) {
        throw new Error(result.error || 'Erro ao carregar os dados.');
        }

        setData(result);
    } catch (err) {
        setData(null);
        setError(
        err instanceof Error ? err.message : 'Erro inesperado.'
        );
    } finally {
        setLoading(false);
    }
    }

    

  function formatValue(value: unknown) {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  function formatDate(value: unknown) {
    if (!value) return '—';

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString('pt-BR');
  }

  function formatLabel(key: string) {
    const labels: Record<string, string> = {
      id: 'ID',
      name: 'Nome',
      email: 'E-mail',
      phone: 'Telefone',
      created_at: 'Data de cadastro',
      customer_name: 'Nome do cliente',
      customer_email: 'E-mail do cliente',
      customer_phone: 'Telefone do cliente',
      shipping_address: 'Endereço de entrega',
      delivery_date: 'Data de entrega',
      subtotal: 'Subtotal',
      shipping_fee: 'Taxa de entrega',
      discount: 'Desconto',
      total_amount: 'Valor total',
      status: 'Status do pedido',
      payment_status: 'Status do pagamento',
      payment_id: 'ID do pagamento/preferência',
      payment_type: 'Tipo de pagamento',
      notes: 'Observações',
    };

    return labels[key] || key.replaceAll('_', ' ');
  }

  function displayValue(key: string, value: unknown) {
    if (key === 'created_at' || key === 'delivery_date') {
      return formatDate(value);
    }

    if (
      [
        'subtotal',
        'shipping_fee',
        'discount',
        'total_amount',
        'unit_price',
      ].includes(key) &&
      value !== null &&
      value !== undefined
    ) {
      return Number(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
    }

    return formatValue(value);
  }

  function statusStyle(status: unknown) {
    const value = String(status ?? '').toLowerCase();

    if (
      value.includes('conclu') ||
      value.includes('entreg') ||
      value.includes('aprov')
    ) {
      return 'bg-green-100 text-green-700';
    }

    if (
      value.includes('cancel') ||
      value.includes('falh') ||
      value.includes('rejeit')
    ) {
      return 'bg-red-100 text-red-700';
    }

    return 'bg-[#FCE8ED] text-[#C94A67]';
  }

  const cardClass =
    'bg-white rounded-xl border border-[#EFE7DE] shadow-sm p-5';

  const buttonClass =
    'px-5 py-2.5 rounded-md text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed';

  const tableHeaderClass =
    'bg-[#F5EBE6] text-[#3D2C1E] text-left text-xs font-semibold uppercase tracking-wide px-4 py-3';

  const tableCellClass =
    'px-4 py-3 text-sm text-[#4A3525] border-b border-[#EFE7DE]';

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#4A3525] font-sans">
      {/* Cabeçalho */}
      <header className="bg-[#3D2C1E] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              Doce Momento
            </h1>
            <p className="text-sm text-[#F5EBE6] mt-1">
              Painel administrativo
            </p>
          </div>

          <span className="text-xs bg-white/10 border border-white/20 rounded-full px-4 py-2 w-fit">
            Gerenciamento da loja
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-10">
        {!data ? (
          <section className="max-w-md mx-auto mt-8 md:mt-14">
            <div className={`${cardClass} p-6 md:p-8`}>
              <div className="w-14 h-14 rounded-full bg-[#FCE8ED] text-[#C94A67] flex items-center justify-center mb-5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-7 h-7"
                  aria-hidden="true"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-[#3D2C1E]">
                Acesso administrativo
              </h2>

              <p className="text-sm text-gray-600 mt-2 mb-6">
                Informe a senha administrativa para consultar
                clientes e pedidos da loja.
              </p>

              <form onSubmit={loadData} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-password"
                    className="block text-sm font-semibold text-[#3D2C1E] mb-2"
                  >
                    Senha administrativa
                  </label>

                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    className="w-full border border-[#EFE7DE] rounded-md px-4 py-3 text-sm bg-[#FDFBF7] focus:outline-none focus:border-[#C94A67] focus:ring-2 focus:ring-[#FCE8ED]"
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`${buttonClass} w-full bg-[#C94A67] text-white hover:bg-[#b03d57] py-3`}
                >
                  {loading ? 'Verificando acesso...' : 'Entrar no painel'}
                </button>
              </form>
            </div>

            <p className="text-center text-xs text-gray-500 mt-5">
              Área restrita à administração da Doce Momento.
            </p>
          </section>
        ) : (
          <>
            {/* Título e ações */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C94A67] mb-2">
                  Administração
                </p>
                <h2 className="text-3xl font-bold text-[#3D2C1E]">
                  Visão geral
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  Consulte os clientes cadastrados e acompanhe os pedidos.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                    try {
                        await fetch('/api/admin/logout', {
                        method: 'POST',
                        });
                    } finally {
                        setData(null);
                        setPassword('');
                        setError('');
                    }
                    }}
                className={`${buttonClass} border border-[#EFE7DE] bg-white text-[#3D2C1E] hover:bg-[#F5EBE6] w-fit`}
              >
                Sair do painel
              </button>
            </div>

            {/* Cartões de resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-600">
                      Total de pedidos
                    </p>
                    <p className="text-3xl font-bold text-[#3D2C1E] mt-2">
                      {data.orders.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#FCE8ED] text-[#C94A67] flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="w-6 h-6"
                      aria-hidden="true"
                    >
                      <path d="M5 8h14l-1 12H6L5 8Z" />
                      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-600">
                      Usuários cadastrados
                    </p>
                    <p className="text-3xl font-bold text-[#3D2C1E] mt-2">
                      {data.users.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#F5EBE6] text-[#3D2C1E] flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="w-6 h-6"
                      aria-hidden="true"
                    >
                      <circle cx="9" cy="8" r="3" />
                      <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
                      <path d="M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v1" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Navegação */}
            <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-[#EFE7DE] pb-4">
              <button
                type="button"
                onClick={() => setSection('orders')}
                className={`${buttonClass} ${
                  section === 'orders'
                    ? 'bg-[#C94A67] text-white shadow-sm'
                    : 'bg-white border border-[#EFE7DE] text-[#3D2C1E] hover:bg-[#F5EBE6]'
                }`}
              >
                Pedidos ({data.orders.length})
              </button>

              <button
                type="button"
                onClick={() => setSection('users')}
                className={`${buttonClass} ${
                  section === 'users'
                    ? 'bg-[#C94A67] text-white shadow-sm'
                    : 'bg-white border border-[#EFE7DE] text-[#3D2C1E] hover:bg-[#F5EBE6]'
                }`}
              >
                Clientes ({data.users.length})
              </button>
            </div>

            {/* Seção de pedidos */}
            {section === 'orders' && (
              <section>
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-[#3D2C1E]">
                    Pedidos da loja
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Selecione um pedido para visualizar todas as informações.
                  </p>
                </div>

                {data.orders.length === 0 ? (
                  <div className={`${cardClass} text-center py-12`}>
                    <p className="text-[#3D2C1E] font-semibold">
                      Nenhum pedido cadastrado.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Os pedidos aparecerão aqui quando forem registrados.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.orders.map((order) => (
                      <details
                        key={String(order.id)}
                        className="group bg-white border border-[#EFE7DE] rounded-xl shadow-sm overflow-hidden"
                      >
                        <summary className="list-none cursor-pointer p-4 md:p-5 hover:bg-[#FDFBF7] transition [&::-webkit-details-marker]:hidden">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-11 h-11 shrink-0 rounded-lg bg-[#FCE8ED] text-[#C94A67] flex items-center justify-center font-bold">
                                #{formatValue(order.id)}
                              </div>

                              <div>
                                <h4 className="font-bold text-[#3D2C1E]">
                                  {formatValue(order.customer_name)}
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">
                                  {formatValue(order.customer_email)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Pedido #{formatValue(order.id)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-4">
                              <div className="md:text-right">
                                <p className="text-xs text-gray-500">
                                  Valor total
                                </p>
                                <p className="font-bold text-[#C94A67] mt-1">
                                  {displayValue('total_amount', order.total_amount)}
                                </p>
                                <span
                                  className={`inline-block mt-2 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(order.status)}`}
                                >
                                  {formatValue(order.status)}
                                </span>
                              </div>

                              <span className="text-[#C94A67] text-xl transition-transform group-open:rotate-180">
                               ⌄
                              </span>
                            </div>
                          </div>
                        </summary>

                        <div className="border-t border-[#EFE7DE] p-4 md:p-6 space-y-7">
                          <div>
                            <h5 className="font-bold text-[#3D2C1E] mb-3">
                              Informações do pedido
                            </h5>

                            <div className="overflow-x-auto rounded-lg border border-[#EFE7DE]">
                              <table className="w-full border-collapse">
                                <tbody>
                                  {Object.entries(order)
                                    .filter(([key]) => key !== 'items')
                                    .map(([key, value]) => (
                                      <tr key={key}>
                                        <th className="bg-[#FDFBF7] text-left text-sm font-semibold text-[#3D2C1E] px-4 py-3 border-b border-[#EFE7DE] w-1/3 align-top">
                                          {formatLabel(key)}
                                        </th>
                                        <td className="text-sm text-[#4A3525] px-4 py-3 border-b border-[#EFE7DE] break-words">
                                          {displayValue(key, value)}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div>
                            <h5 className="font-bold text-[#3D2C1E] mb-3">
                              Produtos do pedido
                            </h5>

                            {Array.isArray(order.items) && order.items.length > 0 ? (
                              <div className="overflow-x-auto rounded-lg border border-[#EFE7DE]">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr>
                                      <th className={tableHeaderClass}>Produto</th>
                                      <th className={tableHeaderClass}>Qtd.</th>
                                      <th className={tableHeaderClass}>Preço unitário</th>
                                      <th className={tableHeaderClass}>Personalização</th>
                                      <th className={tableHeaderClass}>Total do item</th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {order.items.map((item, index) => (
                                      <tr
                                        key={String(item.id ?? index)}
                                        className="hover:bg-[#FDFBF7]"
                                      >
                                        <td className={tableCellClass}>
                                          {formatValue(item.product_name)}
                                        </td>
                                        <td className={tableCellClass}>
                                          {formatValue(item.quantity)}
                                        </td>
                                        <td className={tableCellClass}>
                                          {displayValue('unit_price', item.unit_price)}
                                        </td>
                                        <td className={`${tableCellClass} min-w-40`}>
                                          {formatValue(item.customization)}
                                        </td>
                                        <td className={`${tableCellClass} font-semibold whitespace-nowrap`}>
                                          {(Number(item.quantity) * Number(item.unit_price)).toLocaleString(
                                            'pt-BR',
                                            {
                                              style: 'currency',
                                              currency: 'BRL',
                                            }
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 bg-[#FDFBF7] rounded-lg p-4">
                                Este pedido não possui itens registrados.
                              </p>
                            )}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Seção de usuários */}
            {section === 'users' && (
              <section>
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-[#3D2C1E]">
                    Clientes cadastrados
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Consulte os dados de contato e as datas de cadastro.
                  </p>
                </div>

                {data.users.length === 0 ? (
                  <div className={`${cardClass} text-center py-12`}>
                    <p className="font-semibold text-[#3D2C1E]">
                      Nenhum usuário cadastrado.
                    </p>
                  </div>
                ) : (
                  <div className={`${cardClass} p-0 overflow-hidden`}>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={tableHeaderClass}>ID</th>
                            <th className={tableHeaderClass}>Nome</th>
                            <th className={tableHeaderClass}>E-mail</th>
                            <th className={tableHeaderClass}>Telefone</th>
                            <th className={tableHeaderClass}>Data de cadastro</th>
                          </tr>
                        </thead>

                        <tbody>
                          {data.users.map((user) => (
                            <tr
                              key={String(user.id)}
                              className="hover:bg-[#FDFBF7] transition"
                            >
                              <td className={tableCellClass}>
                                {formatValue(user.id)}
                              </td>
                              <td className={`${tableCellClass} font-medium`}>
                                {formatValue(user.name)}
                              </td>
                              <td className={tableCellClass}>
                                {formatValue(user.email)}
                              </td>
                              <td className={tableCellClass}>
                                {formatValue(user.phone)}
                              </td>
                              <td className={`${tableCellClass} whitespace-nowrap`}>
                                {formatDate(user.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* Rodapé */}
      <footer className="bg-[#3D2C1E] text-white py-6 text-center text-xs mt-12">
        <p>© 2026 Doce Momento. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
