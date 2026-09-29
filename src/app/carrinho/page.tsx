'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ItemCarrinho {
  carrinho_item_id: number;
  produto_id: number;
  nome: string;
  categoria: string;
  preco: number;
  quantidade: number;
  imagem: string;
  embalagem?: string;
  mensagem?: string;
}

export default function CarrinhoPage() {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [cupom, setCupom] = useState('');
  const [descontoAplicado, setDescontoAplicado] = useState(0);
  const [mensagemCupom, setMensagemCupom] = useState('');
  const [dataEntrega, setDataEntrega] = useState('Sábado, 12 de outubro');

  // Buscar itens reais da base de dados ao carregar a página
  const carregarCarrinho = async () => {
    try {
      const res = await fetch('/api/carrinho');
      const data = await res.json();
      if (data.success) {
        setItens(data.itens);
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCarrinho();
  }, []);

  const alterarQuantidade = async (id: number, delta: number, quantidadeAtual: number) => {
    const novaQtd = quantidadeAtual + delta;
    if (novaQtd <= 0) {
      removerItem(id);
      return;
    }

    try {
      // Atualiza via API (pode reutilizar ou criar uma rota PATCH, ou refazer o POST/remover)
      // Para simplificar, removemos e readicionamos ou criamos lógica direta. 
      // Aqui vamos atualizar direto na base de dados ajustando a rota se necessário, ou fazendo um fetch rápido:
      await fetch('/api/carrinho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id: id, quantidade: delta }) // ou lógica de update exata
      });
      carregarCarrinho();
    } catch (e) {
      console.error('Erro ao atualizar quantidade:', e);
    }
  };

  const removerItem = async (carrinho_item_id: number) => {
    try {
      await fetch(`/api/carrinho?id=${carrinho_item_id}`, { method: 'DELETE' });
      carregarCarrinho();
    } catch (e) {
      console.error('Erro ao remover item:', e);
    }
  };

  const limparCarrinho = async () => {
    try {
      await fetch('/api/carrinho?limpar=true', { method: 'DELETE' });
      setItens([]);
      setDescontoAplicado(0);
      setMensagemCupom('');
    } catch (e) {
      console.error('Erro ao limpar carrinho:', e);
    }
  };

  const aplicarCupom = (e: React.FormEvent) => {
    e.preventDefault();
    if (cupom.toUpperCase() === 'DOCE10') {
      setDescontoAplicado(0.10);
      setMensagemCupom('✓ DOCE10 - 10% off aplicado');
    } else {
      alert('Cupom inválido! Tente DOCE10');
    }
  };

  // Cálculos baseados nos dados reais da BD
  const subtotalItens = itens.reduce((acc, item) => acc + (Number(item.preco) * item.quantidade), 0);
  const custoEmbalagemPresente = itens.filter(i => i.embalagem?.includes('Presente')).length * 5.00;
  const valorDesconto = (subtotalItens + custoEmbalagemPresente) * descontoAplicado;
  const taxaEntrega = 10.00;
  const totalGeral = (subtotalItens + custoEmbalagemPresente - valorDesconto) + taxaEntrega;
  const totalItensCount = itens.reduce((acc, item) => acc + item.quantidade, 0);

  if (loading) {
    return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-sm text-gray-500">A carregar carrinho...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between font-sans text-[#3D2C1E]">
      <header className="border-b border-[#EFE7DE] bg-white py-4 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#D9537A] text-white font-bold w-8 h-8 rounded-full flex items-center justify-center font-serif text-lg">D</div>
            <span className="font-serif text-xl font-bold text-[#3D2314]">Doce Momento</span>
          </div>
          <Link href="/catalogo" className="text-xs text-[#D9537A] font-semibold hover:underline">← Voltar ao Catálogo</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-grow">
        <h1 className="text-3xl font-serif font-bold text-[#3D2314] mb-1">Seu Carrinho</h1>
        <p className="text-xs text-gray-500 mb-6">Revise seus itens salvos na base de dados antes de finalizar o pedido</p>

        {itens.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#EFE7DE] shadow-sm my-6">
            <p className="text-base font-medium text-gray-600 mb-4">O seu carrinho está vazio.</p>
            <Link href="/catalogo" className="bg-[#D9537A] text-white px-6 py-2.5 rounded-lg text-xs font-medium hover:bg-[#c2466a]">
              Ver Catálogo de Doces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {itens.map((item) => (
                <div key={item.carrinho_item_id} className="bg-white rounded-2xl border border-[#EFE7DE] p-5 shadow-sm flex justify-between items-center gap-4">
                  <div className="flex items-start gap-4">
                    <img src={item.imagem} alt={item.nome} className="w-16 h-16 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-[#D9537A] uppercase">{item.categoria}</span>
                      <h3 className="font-serif font-bold text-sm text-[#3D2314]">{item.nome}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">R$ {Number(item.preco).toFixed(2)} /un</p>
                      
                      {item.embalagem && <span className="text-[10px] bg-[#F4EBE1] text-[#3D2314] px-2 py-0.5 rounded-md mt-1 inline-block">{item.embalagem}</span>}
                      
                      <button 
                        onClick={() => removerItem(item.carrinho_item_id)}
                        className="text-[10px] text-red-400 hover:text-red-600 mt-2 block"
                      >
                        Remover item
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-[#3D2314] mb-2">
                      R$ {(Number(item.preco) * item.quantidade).toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">Qtd: {item.quantidade}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo do Pedido */}
            <div className="bg-white rounded-2xl border border-[#EFE7DE] p-6 shadow-sm h-fit space-y-5">
              <h3 className="font-serif font-bold text-base text-[#3D2314] border-b pb-3">Resumo do Pedido</h3>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItensCount} itens)</span>
                  <span className="font-medium text-[#3D2314]">R$ {subtotalItens.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de entrega</span>
                  <span className="font-medium text-[#3D2314]">R$ {taxaEntrega.toFixed(2)}</span>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div className="flex justify-between items-baseline">
                <span className="font-serif font-bold text-sm text-[#3D2314]">Total</span>
                <span className="text-xl font-bold text-[#D9537A]">R$ {totalGeral.toFixed(2)}</span>
              </div>



                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">                
                <Link 
                    href="/checkout" 
                    className="w-full bg-[#D9537A] hover:bg-[#c24568] text-white font-semibold py-3 rounded-lg transition duration-200 text-center block shadow mt-6"
                >
                    Finalizar Pedido
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}