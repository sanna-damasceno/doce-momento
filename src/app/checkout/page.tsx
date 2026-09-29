'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ItemCarrinho {
  carrinho_item_id: number;
  produto_id: number;
  nome: string;
  preco: number;
  quantidade: number;
  embalagem?: string;
  observacao?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loading, setLoading] = useState(false);

  // Estado para os dados de entrega e pagamento
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    delivery_date: '2026-10-12', 
    neighborhood: '',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '',
    notes: '',
    payment_type: 'credit_card',
  });

  // Buscar itens do carrinho e dados do utilizador ao carregar a página
  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        // 1. Carrega o carrinho
        const resCart = await fetch('/api/carrinho');
        const dataCart = await resCart.json();
        if (dataCart.success) {
          setItens(dataCart.itens);
          if (dataCart.itens.length === 0) {
            router.push('/carrinho');
            return;
          }
        }

        // 2. Carrega os dados cadastrados do utilizador
        const resUser = await fetch('/api/usuario');
        const dataUser = await resUser.json();
        if (dataUser.success && dataUser.usuario) {
          setFormData(prev => ({
            ...prev,
            customer_name: dataUser.usuario.nome || '',
            customer_email: dataUser.usuario.email || '',
            customer_phone: dataUser.usuario.telefone || '',
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoadingCart(false);
      }
    }
    carregarDadosIniciais();
  }, [router]);

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
    setLoading(true);

    try {
      const fullAddress = `${formData.shipping_address}, ${formData.neighborhood}, ${formData.city} - ${formData.state}, CEP: ${formData.zip_code}`;

      const formattedItems = itens.map(item => ({
        product_name: item.nome,
        quantity: item.quantidade,
        unit_price: Number(item.preco),
        customization: {
          embalagem: item.embalagem || 'Embalagem Simples',
          observacao: item.observacao || ''
        }
      }));

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

  if (loadingCart) {
    return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-sm text-gray-500">A carregar dados do checkout...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-[#3D2314]">Finalizar Pedido</h1>
          <Link href="/carrinho" className="text-xs text-[#D9537A] font-semibold hover:underline">← Voltar ao Carrinho</Link>
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
                    onChange={handleChange} 
                    className="w-full p-2 border rounded text-sm" 
                    placeholder="(11) 98765-4321" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">CEP *</label>
                  <input type="text" name="zip_code" required value={formData.zip_code} onChange={handleChange} className="w-full p-2 border rounded text-sm" placeholder="01234-567" />
                </div>
                <div className="md:col-span-2">
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

            {/* Observações */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <label className="block text-sm font-semibold text-[#3D2314] mb-2">Observações do pedido</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full p-2 border rounded text-sm" placeholder="Ex: Tocar a campainha 2x..." maxLength={200} />
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