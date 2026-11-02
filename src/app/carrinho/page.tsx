
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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

  // Buscar os itens do carrinho
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
    let ativo = true;

    const buscarItens = async () => {
      try {
        const res = await fetch('/api/carrinho');
        const data = await res.json();

        if (ativo && data.success) {
          setItens(data.itens);
        }
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    };

    buscarItens();

    return () => {
      ativo = false;
    };
  }, []);

  const removerItem = async (carrinho_item_id: number) => {
    try {
      await fetch(`/api/carrinho?id=${carrinho_item_id}`, {
        method: 'DELETE',
      });

      await carregarCarrinho();
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  };

  const limparCarrinho = async () => {
    try {
      await fetch('/api/carrinho?limpar=true', {
        method: 'DELETE',
      });

      setItens([]);
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
    }
  };

  // Cálculos do pedido
  const subtotalItens = itens.reduce(
    (acc, item) => acc + Number(item.preco) * item.quantidade,
    0
  );

  const custoEmbalagemPresente =
    itens.filter((item) => item.embalagem?.includes('Presente')).length * 5;

  const taxaEntrega = 0.01;

  const totalGeral =
    subtotalItens + custoEmbalagemPresente + taxaEntrega;

  const totalItensCount = itens.reduce(
    (acc, item) => acc + item.quantidade,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-sm text-gray-500">
        A carregar carrinho...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between font-sans text-[#3D2C1E]">
      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-grow">
        <h1 className="text-3xl font-serif font-bold text-[#3D2314] mb-1">
          Seu Carrinho
        </h1>

        <p className="text-xs text-gray-500 mb-6">
          Revise seus itens salvos na base de dados antes de finalizar o pedido
        </p>

        {itens.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#EFE7DE] shadow-sm my-6">
            <p className="text-base font-medium text-gray-600 mb-4">
              O seu carrinho está vazio.
            </p>

            <Link
              href="/catalogo"
              className="bg-[#D9537A] text-white px-6 py-2.5 rounded-lg text-xs font-medium hover:bg-[#c2466a]"
            >
              Ver Catálogo de Doces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {itens.map((item) => (
                <div
                  key={item.carrinho_item_id}
                  className="bg-white rounded-2xl border border-[#EFE7DE] p-5 shadow-sm flex justify-between items-center gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.imagem || '/images/placeholder.png'}
                        alt={item.nome}
                        fill
                        sizes="64px"
                        className="rounded-xl object-cover border border-gray-100"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#D9537A] uppercase">
                        {item.categoria}
                      </span>

                      <h3 className="font-serif font-bold text-sm text-[#3D2314]">
                        {item.nome}
                      </h3>

                      <p className="text-xs text-gray-500 mt-0.5">
                        R$ {Number(item.preco).toFixed(2)} /un
                      </p>

                      {item.embalagem && (
                        <span className="text-[10px] bg-[#F4EBE1] text-[#3D2314] px-2 py-0.5 rounded-md mt-1 inline-block">
                          {item.embalagem}
                        </span>
                      )}

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

                    <span className="text-xs text-gray-500">
                      Qtd: {item.quantidade}
                    </span>
                  </div>
                </div>
              ))}

              <button
                onClick={limparCarrinho}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Limpar carrinho
              </button>
            </div>

            {/* Resumo do pedido */}
            <div className="bg-white rounded-2xl border border-[#EFE7DE] p-6 shadow-sm h-fit space-y-5">
              <h3 className="font-serif font-bold text-base text-[#3D2314] border-b pb-3">
                Resumo do Pedido
              </h3>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItensCount} itens)</span>
                  <span className="font-medium text-[#3D2314]">
                    R$ {subtotalItens.toFixed(2)}
                  </span>
                </div>

                {custoEmbalagemPresente > 0 && (
                  <div className="flex justify-between">
                    <span>Embalagem para presente</span>
                    <span className="font-medium text-[#3D2314]">
                      R$ {custoEmbalagemPresente.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Taxa de entrega</span>
                  <span className="font-medium text-[#3D2314]">
                    R$ {taxaEntrega.toFixed(2)}
                  </span>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div className="flex justify-between items-baseline">
                <span className="font-serif font-bold text-sm text-[#3D2314]">
                  Total
                </span>

                <span className="text-xl font-bold text-[#D9537A]">
                  R$ {totalGeral.toFixed(2)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="w-full bg-[#D9537A] hover:bg-[#c24568] text-white font-semibold py-3 rounded-lg transition duration-200 text-center block shadow mt-6"
              >
                Finalizar Pedido
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
