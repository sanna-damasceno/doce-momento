'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CartItem {
  id: string;
  category: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  customization: string;
}

export default function CartPage() {
  const router = useRouter();

  // Estado inicial simulando os itens do protótipo
  const [items, setItems] = useState<CartItem[]>([
    {
      id: '1',
      category: 'BRIGADEIROS',
      product_name: 'Brigadeiro Gourmet de Pistache',
      unit_price: 4.92, // 59.00 / 12
      quantity: 12,
      customization: '"Feliz Aniversário, Maria!" | Embalagem Presente (+R$ 5,00)',
    },
    {
      id: '2',
      category: 'BOLOS DE POTE',
      product_name: 'Bolo de Pote Ninho com Nutella',
      unit_price: 12.00,
      quantity: 2,
      customization: 'Embalagem Simples',
    },
    {
      id: '3',
      category: 'CUPCAKES',
      product_name: 'Cupcake Red Velvet',
      unit_price: 8.00,
      quantity: 6,
      customization: 'Embalagem Simples',
    },
  ]);

  const [deliveryDate, setDeliveryDate] = useState('Sábado, 12 de outubro');
  const [couponCode, setCouponCode] = useState('DOCE10');
  const [discountApplied, setDiscountApplied] = useState(true);

  // Funções para alterar quantidade
  const handleQuantityChange = (id: string, delta: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleClearCart = () => {
    setItems([]);
  };

  // Cálculos financeiros
  const subtotalItems = items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
  const packagingFee = 5.00; // Taxa fixa de embalagem presente ilustrativa
  const discountAmount = discountApplied ? 13.60 : 0.00;
  const shippingFee = 10.00;
  const totalAmount = subtotalItems + packagingFee - discountAmount + shippingFee;
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleProceedToCheckout = () => {
    // Pode guardar os dados do carrinho no localStorage ou Context API antes de ir para o checkout
    localStorage.setItem('cart_items', JSON.stringify(items));
    localStorage.setItem('cart_total', totalAmount.toString());
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-gray-800">
      
      {/* Top Banner */}
      <div className="bg-[#3D2314] text-white text-xs text-center py-2 px-4">
        Frete grátis em encomendas acima de R$ 120 • Entrega em até 3 dias úteis
      </div>

      {/* Header / Navbar Simples */}
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="bg-[#D9537A] text-white font-bold w-8 h-8 rounded-full flex items-center justify-center font-serif text-lg">D</span>
          <div>
            <h1 className="font-serif font-bold text-[#3D2314] leading-none">Doce Momento</h1>
            <span className="text-[10px] text-gray-500 tracking-wider">CONFEITARIA ARTESANAL</span>
          </div>
        </div>
        <nav className="hidden md:flex gap-6 text-sm text-[#3D2314]">
          <Link href="/" className="hover:text-[#D9537A]">Home</Link>
          <Link href="/catalogo" className="hover:text-[#D9537A]">Catálogo</Link>
          <Link href="/sobre" className="hover:text-[#D9537A]">Sobre</Link>
          <Link href="/contato" className="hover:text-[#D9537A]">Contato</Link>
        </nav>
        <div className="relative">
          <span className="bg-[#D9537A] text-white text-xs px-2 py-1 rounded-full">🛒 3</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Breadcrumb & Title */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-1">Home / Catálogo / <span className="text-gray-800 font-medium">Carrinho</span></p>
          <h2 className="text-3xl font-serif text-[#3D2314]">Seu Carrinho</h2>
          <p className="text-xs text-gray-500">Revise seus itens antes de finalizar o pedido</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Lista de Produtos (Esquerda) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Produto</span>
              <div className="flex gap-24 md:gap-36">
                <span>Quantidade</span>
                <span>Subtotal</span>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
                <p className="text-gray-500 mb-4">O seu carrinho está vazio.</p>
                <Link href="/catalogo" className="bg-[#D9537A] text-white px-6 py-2 rounded text-sm font-semibold">Ver Catálogo</Link>
              </div>
            ) : (
              items.map((item) => {
                const itemSubtotal = item.unit_price * item.quantity;
                return (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    
                    {/* Imagem e Detalhes */}
                    <div className="flex gap-4 items-start">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-xs text-gray-400">
                        [Foto Doce]
                      </div>
                      <div>
                        <span className="text-[10px] text-[#D9537A] font-bold tracking-widest uppercase">{item.category}</span>
                        <h3 className="font-serif font-bold text-[#3D2314] text-base">{item.product_name}</h3>
                        <p className="text-xs text-gray-500">R$ {item.unit_price.toFixed(2)} /un</p>
                        <div className="mt-2 text-xs bg-[#FDFBF7] border border-amber-100 p-1.5 rounded text-gray-600">
                          {item.customization}
                        </div>
                        <button className="text-[11px] text-[#D9537A] underline mt-1 block">Editar personalizações</button>
                      </div>
                    </div>

                    {/* Controlo de Quantidade e Subtotal */}
                    <div className="flex items-center justify-between w-full md:w-auto gap-8 mt-4 md:mt-0">
                      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                        <button 
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition"
                        >-</button>
                        <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition"
                        >+</button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-gray-400 block md:hidden">Subtotal</span>
                        <span className="font-bold text-[#3D2314] text-base">R$ {itemSubtotal.toFixed(2)}</span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}

            <div className="pt-2">
              <Link href="/catalogo" className="text-xs text-[#3D2314] hover:text-[#D9537A] font-medium flex items-center gap-1">
                ← Continuar comprando
              </Link>
            </div>
          </div>

          {/* Resumo do Pedido (Direita) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif font-bold text-lg text-[#3D2314]">Resumo do Pedido</h3>
              <span className="bg-pink-100 text-[#D9537A] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                {totalItemsCount} itens no carrinho
              </span>
            </div>

            {/* Data de Entrega */}
            <div className="bg-[#FDFBF7] border border-gray-200 rounded p-3 mb-4 text-xs">
              <p className="font-semibold text-gray-700 mb-1">Data de entrega</p>
              <p className="text-gray-500 mb-2">Encomendas com no mínimo 3 dias de antecedência</p>
              <div className="bg-white p-2 border border-gray-200 rounded font-medium text-[#3D2314] mb-1">
                📅 {deliveryDate}
              </div>
              <span className="text-green-600 text-[11px]">✓ Entrega em: Sábado, 12 de outubro</span>
            </div>

            {/* Cupom de desconto */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cupom de desconto</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)} 
                  className="w-full p-2 text-xs border border-gray-300 rounded uppercase"
                  placeholder="EX: DOCE10"
                />
                <button 
                  onClick={() => setDiscountApplied(true)} 
                  className="bg-[#3D2314] text-white text-xs px-4 py-2 rounded hover:bg-black transition"
                >
                  Aplicar
                </button>
              </div>
              {discountApplied && (
                <div className="flex justify-between items-center mt-2 text-xs text-green-600 bg-green-50 p-1.5 rounded">
                  <span>✓ DOCE10 - 10% off aplicado</span>
                  <button onClick={() => setDiscountApplied(false)} className="text-gray-400 hover:text-red-500 underline">remover</button>
                </div>
              )}
            </div>

            {/* Valores */}
            <div className="space-y-2 text-xs text-gray-600 border-t pt-4">
              <div className="flex justify-between">
                <span>Subtotal ({totalItemsCount} itens)</span>
                <span>R$ {subtotalItems.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Embalagem presente</span>
                <span>R$ {packagingFee.toFixed(2)}</span>
              </div>
              {discountApplied && (
                <div className="flex justify-between text-[#D9537A]">
                  <span>Desconto {couponCode}</span>
                  <span>-R$ {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxa de entrega</span>
                <span>R$ {shippingFee.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4 mb-6 flex justify-between items-center">
              <span className="font-bold text-base text-[#3D2314]">Total</span>
              <span className="font-bold text-xl text-[#D9537A]">R$ {totalAmount.toFixed(2)}</span>
            </div>

            <button 
              onClick={handleProceedToCheckout}
              className="w-full bg-[#D9537A] hover:bg-[#c24568] text-white font-semibold py-3 rounded-lg transition duration-200 text-center text-sm shadow mb-3"
            >
              Finalizar Pedido →
            </button>

            <Link 
              href="/catalogo"
              className="w-full block text-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg transition duration-200 text-sm mb-3"
            >
              Continuar Comprando
            </Link>

            <button 
              onClick={handleClearCart}
              className="w-full text-center text-xs text-gray-400 hover:text-red-500 underline mb-4"
            >
              Limpar carrinho
            </button>

            <div className="text-[11px] text-gray-500 space-y-1 border-t pt-4">
              <p>🔒 Compra segura</p>
              <p>📦 Entrega em até 3 dias úteis</p>
              <p>💳 Pagamento no checkout</p>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}