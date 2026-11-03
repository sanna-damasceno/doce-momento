'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { aplicarMascaraWhatsApp } from '@/utils/mascaras';
import { registrarEvento, obterClientId } from '@/utils/analytics';


interface ItemCarrinho {
  carrinho_item_id: number;
  produto_id: number;
  nome: string;
  preco: number;
  quantidade: number;
  embalagem?: string;
  observacao?: string;
}

function getMinDeliveryDate() {
  const today = new Date();

  // Adiciona 3 dias à data atual
  today.setDate(today.getDate() + 3);

  // Formata como YYYY-MM-DD para o input date
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


export default function CheckoutPage() {
  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);
  
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loading, setLoading] = useState(false);
  const eventoCheckoutRegistrado = useRef(false);

  // Estado para os dados de entrega e pagamento
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    delivery_date: '', 
    neighborhood: '',
    city: 'Parintins',
    state: 'AM',
    zip_code: '',
    notes: '',
    payment_type: 'credit_card',
  });

  // Buscar itens do carrinho e dados do utilizador ao carregar a página
  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        // 1. Verifica se o usuário está autenticado
        const resUser = await fetch('/api/usuario', {
          cache: 'no-store',
        });

        const dataUser = await resUser.json();

        // Se não estiver logado, redireciona para o login
        if (!resUser.ok || !dataUser.success || !dataUser.usuario) {
          router.replace('/login?redirect=/checkout');
          return;
        }

        // Usuário autenticado
        setAutenticado(true);

        // 2. Carrega os dados cadastrados do usuário
        setFormData(prev => ({
          ...prev,
          customer_name: dataUser.usuario.nome || '',
          customer_email: dataUser.usuario.email || '',
          customer_phone: aplicarMascaraWhatsApp(
            dataUser.usuario.telefone || ''
          ),
        }));

        // 3. Somente depois carrega o carrinho
        const resCart = await fetch('/api/carrinho');
        const dataCart = await resCart.json();

        if (dataCart.success) {
          setItens(dataCart.itens);

          if (dataCart.itens.length === 0) {
            router.push('/carrinho');
            return;
          }
          // Registra o início do checkout apenas uma vez
          if (!eventoCheckoutRegistrado.current) {
            registrarEvento('iniciou_checkout', {
              quantidade_itens: dataCart.itens.reduce(
                (total: number, item: ItemCarrinho) => total + item.quantidade,
                0
              ),
              currency: 'BRL',
            });
            eventoCheckoutRegistrado.current = true;
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        router.replace('/login');
      } finally {
        setLoadingCart(false);
      }
    }

    carregarDadosIniciais();
  }, [router]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não for número
    let cep = e.target.value.replace(/\D/g, '');

    // Limita a 8 números
    cep = cep.slice(0, 8);

    setFormData({
      ...formData,
      zip_code: cep,
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const whatsapp = aplicarMascaraWhatsApp(e.target.value);

    setFormData(prev => ({
      ...prev,
      customer_phone: whatsapp,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Cálculos dinâmicos
  const subtotal = itens.reduce((acc, item) => acc + (Number(item.preco) * item.quantidade), 0);
  const custoEmbalagemPresente = itens.filter(i => i.embalagem?.includes('Presente')).length * 5.00;
  const shippingFee = 0.01;
  const discount = 0.00; 
  const totalAmount = subtotal + custoEmbalagemPresente + shippingFee - discount;
  const totalItensCount = itens.reduce((acc, item) => acc + item.quantidade, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{8}$/.test(formData.zip_code)) {
      alert('Digite um CEP válido com exatamente 8 números.');
      return;
    }

    // Valida o WhatsApp
    if (!/^\(\d{2}\) 9\d{4}-\d{4}$/.test(formData.customer_phone)) {
      alert('Digite um WhatsApp válido com DDD.');
      return;
    }
    setLoading(true);

    try {
      const fullAddress = `${formData.shipping_address}, ${formData.neighborhood}, ${formData.city} - ${formData.state}, CEP: ${formData.zip_code}`;

      const formattedItems = itens.map(item => ({
        product_id: item.produto_id,
        product_name: item.nome,
        quantity: item.quantidade,
        unit_price: Number(item.preco),
        customization: {
          embalagem: item.embalagem || 'Embalagem Simples',
          observacao: item.observacao || ''
        }
      }));

      const clientId = await obterClientId();

      const orderPayload = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        shipping_address: fullAddress,
        delivery_date: formData.delivery_date,
        subtotal: subtotal + custoEmbalagemPresente,
        shipping_fee: shippingFee,
        discount: discount,
        total_amount: totalAmount,
        notes: formData.notes,
        payment_type: formData.payment_type,
        items: formattedItems,
        ga_client_id: clientId,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (response.ok && data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert(`Erro ao criar pedido: ${data.error || 'Erro desconhecido'}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      alert('Erro de conexão ao finalizar pedido.');
      setLoading(false);
    }
  };

  if (loadingCart || !autenticado) {
    return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-sm text-gray-500">A carregar dados do checkout...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif font-bold text-[#3D2314] mb-1">Finalizar Pedido</h1>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna da Esquerda */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Bloco 1: Dados de Entrega */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-[#3D2314] mb-4 flex items-center gap-2">
                <span className="bg-[#3D2314] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Dados de Entrega
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NOME COMPLETO - Bloqueado */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo (Não alterável)</label>
                  <input 
                    type="text" 
                    name="customer_name" 
                    value={formData.customer_name} 
                    readOnly 
                    className="w-full p-2 border rounded text-sm bg-gray-100 text-gray-600 cursor-not-allowed select-none" 
                  />
                </div>

                {/* E-MAIL - Bloqueado */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">E-mail (Não alterável)</label>
                  <input 
                    type="email" 
                    name="customer_email" 
                    value={formData.customer_email} 
                    readOnly 
                    className="w-full p-2 border rounded text-sm bg-gray-100 text-gray-600 cursor-not-allowed select-none" 
                  />
                </div>

                {/* TELEFONE - Pré-preenchido, mas editável */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Telefone / WhatsApp *</label>
                  <input 
                    type="text" 
                    name="customer_phone" 
                    required 
                    value={formData.customer_phone} 
                    onChange={handlePhoneChange}
                    inputMode="numeric"
                    maxLength={15}
                    className="w-full p-2 border rounded text-sm" 
                    placeholder="(92) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    CEP *
                  </label>

                  <input
                    type="text"
                    name="zip_code"
                    required
                    value={
                      formData.zip_code.length > 5
                        ? `${formData.zip_code.slice(0, 5)}-${formData.zip_code.slice(5)}`
                        : formData.zip_code
                    }
                    onChange={handleCepChange}
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="00000-000"
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Endereço / Rua *</label>
                  <input type="text" name="shipping_address" required value={formData.shipping_address} onChange={handleChange} className="w-full p-2 border rounded text-sm" placeholder="Rua das Flores, 123" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bairro *</label>
                  <input type="text" name="neighborhood" required value={formData.neighborhood} onChange={handleChange} className="w-full p-2 border rounded text-sm" placeholder="Jardim das Rosas" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cidade *</label>
                  <input type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full p-2 border rounded text-sm" />
                </div>
                {/* DATA DE ENTREGA */}
                <div>
                  <label
                    htmlFor="delivery_date"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Data de entrega *
                  </label>

                  <input
                    type="date"
                    id="delivery_date"
                    name="delivery_date"
                    required
                    min={getMinDeliveryDate()}
                    value={formData.delivery_date}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-sm"
                  />

                  <p className="text-xs text-gray-500 mt-1">
                    Escolha uma data com pelo menos 3 dias de antecedência.
                  </p>
                </div>
              </div>
              {/* Observações */}
              <div className='mt-4'>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observações do pedido</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full p-2 border rounded text-sm" placeholder="Ex: Tocar a campainha 2x..." maxLength={200} />
              </div>
            </div>

            {/* Bloco 2: Forma de Pagamento */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-[#3D2314] mb-4 flex items-center gap-2">
                <span className="bg-[#3D2314] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                Forma de Pagamento
              </h2>

              <div className="flex gap-4 mb-4">
                <label className={`flex-1 p-4 border rounded-lg cursor-pointer flex items-center gap-3 ${formData.payment_type === 'credit_card' ? 'border-[#D9537A] bg-pink-50' : 'border-gray-200'}`}>
                  <input type="radio" name="payment_type" value="credit_card" checked={formData.payment_type === 'credit_card'} onChange={handleChange} />
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Cartão de Crédito</p>
                    <p className="text-xs text-gray-500">Em até 3x sem juros</p>
                  </div>
                </label>

                <label className={`flex-1 p-4 border rounded-lg cursor-pointer flex items-center gap-3 ${formData.payment_type === 'pix' ? 'border-[#D9537A] bg-pink-50' : 'border-gray-200'}`}>
                  <input type="radio" name="payment_type" value="pix" checked={formData.payment_type === 'pix'} onChange={handleChange} />
                  <div>
                    <p className="font-semibold text-sm text-gray-800">PIX</p>
                    <p className="text-xs text-gray-500">Aprovação imediata</p>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Coluna da Direita: Resumo do Pedido */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
            <h3 className="text-lg font-semibold text-[#3D2314] mb-4 border-b pb-2">Resumo do Pedido</h3>
            
            <div className="space-y-3 mb-4 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({totalItensCount} itens)</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {custoEmbalagemPresente > 0 && (
                <div className="flex justify-between">
                  <span>Embalagem presente</span>
                  <span>R$ {custoEmbalagemPresente.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxa de entrega</span>
                <span>R$ {shippingFee.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6 flex justify-between items-center">
              <span className="font-bold text-lg text-[#3D2314]">Total</span>
              <span className="font-bold text-xl text-[#D9537A]">R$ {totalAmount.toFixed(2)}</span>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#D9537A] hover:bg-[#c24568] text-white font-semibold py-3 rounded-lg transition duration-200 text-center shadow cursor-pointer disabled:opacity-50"
            >
              {loading ? 'A processar pagamento...' : `Pagar R$ ${totalAmount.toFixed(2)}`}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}