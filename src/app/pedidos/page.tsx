'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_type: string;
  delivery_date: string;
  created_at: string;
  delivery_address?: string;
  shipping_fee?: number;
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
}

export default function MeusPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados para o Modal de Detalhes
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/usuario/pedidos');
      const data = await res.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.error || 'Não foi possível carregar os pedidos.');
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setError('Erro de conexão ao carregar os pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Função para abrir detalhes do pedido
  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/usuario/pedidos?id=${order.id}`);
      const data = await res.json();
      if (data.success) {
        setOrderItems(data.items || []);
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Função para cancelar o pedido
  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Tem certeza de que deseja cancelar este pedido?')) return;

    try {
      const res = await fetch('/api/usuario/pedidos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg('Pedido cancelado com sucesso.');
        fetchOrders(); // Atualiza a lista
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null); // Fecha o modal se estiver aberto
        }
      } else {
        alert(data.error || 'Não foi possível cancelar o pedido.');
      }
    } catch (err) {
      console.error('Erro ao cancelar:', err);
      alert('Erro de conexão ao tentar cancelar o pedido.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-sm text-gray-500 font-sans">
        A carregar os seus pedidos...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4 font-sans relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-[#3D2314]">Meus Pedidos</h1>
          <Link href="/catalogo" className="text-xs text-[#D9537A] font-semibold hover:underline">
            ← Continuar a Comprar
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-4 text-sm">
            {successMsg}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Ainda não tem nenhum pedido registado.</p>
            <Link 
              href="/catalogo" 
              className="inline-block bg-[#D9537A] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#c24568] transition"
            >
              Ver Catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isPaymentConfirmed = ['pago', 'confirmed', 'approved'].includes(order.payment_status?.toLowerCase());
              const isCancelled = order.status === 'Cancelado';

              return (
                <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#3D2314]">Pedido #{order.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        order.status === 'Cancelado' ? 'bg-red-100 text-red-800' :
                        order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Data: {new Date(order.created_at).toLocaleDateString('pt-BR')} | Entrega: {order.delivery_date}
                    </p>
                    <p className="text-xs text-gray-600">
                      Pagamento: <span className="uppercase font-semibold">{order.payment_type || 'N/A'}</span> ({order.payment_status})
                    </p>
                  </div>

                  <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                    <span className="text-lg font-bold text-[#D9537A]">
                      R$ {Number(order.total_amount).toFixed(2)}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md font-medium hover:bg-gray-200 transition"
                      >
                        Ver Detalhes
                      </button>

                      {!isPaymentConfirmed && !isCancelled && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-md font-medium hover:bg-red-100 transition"
                        >
                          Cancelar Pedido
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg font-bold"
            >
              ✕
            </button>

            <h2 className="text-2xl font-serif text-[#3D2314] mb-4">Detalhes do Pedido #{selectedOrder.id}</h2>

            <div className="space-y-3 text-sm text-gray-600 mb-6 border-b pb-4">
              <p><strong>Estado do Pedido:</strong> {selectedOrder.status}</p>
              <p><strong>Estado do Pagamento:</strong> {selectedOrder.payment_status}</p>
              <p><strong>Forma de Pagamento:</strong> {selectedOrder.payment_type || 'N/A'}</p>
              <p><strong>Data do Pedido:</strong> {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}</p>
              <p><strong>Previsão de Entrega:</strong> {selectedOrder.delivery_date}</p>
              {selectedOrder.delivery_address && (
                <p><strong>Endereço de Entrega:</strong> {selectedOrder.delivery_address}</p>
              )}
            </div>

            <h3 className="font-bold text-[#3D2314] mb-2 text-sm">Itens do Pedido:</h3>
            {loadingDetails ? (
              <p className="text-xs text-gray-400">A carregar itens...</p>
            ) : orderItems.length > 0 ? (
              <div className="space-y-2 mb-6">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs bg-gray-50 p-2 rounded">
                    <span>{item.quantity}x {item.product_name}</span>
                    <span className="font-semibold">R$ {(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 mb-6">Informação de itens detalhados não disponível.</p>
            )}

            {/* Secção de Frete e Total */}
            <div className="border-t pt-3 space-y-1.5 text-xs mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Taxa de Entrega (Frete):</span>
                <span>R$ {Number(selectedOrder.shipping_fee || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <span className="font-bold text-[#3D2314]">Total:</span>
              <span className="text-xl font-bold text-[#D9537A]">R$ {Number(selectedOrder.total_amount).toFixed(2)}</span>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {!['pago', 'confirmed', 'approved'].includes(selectedOrder.payment_status?.toLowerCase()) && selectedOrder.status !== 'Cancelado' && (
                <button
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                >
                  Cancelar Pedido
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-[#3D2314] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-black transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}