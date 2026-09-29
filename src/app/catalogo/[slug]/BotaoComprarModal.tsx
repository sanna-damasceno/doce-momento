'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  produtoId: number;
  preco: number;
  nomeProduto: string;
}

export default function BotaoComprarModal({ produtoId, preco, nomeProduto }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [embalagem, setEmbalagem] = useState('Embalagem Simples');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConfirmarAdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/carrinho/adicionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto_id: produtoId,
          quantidade,
          embalagem,
          observacao
        })
      });

      const data = await res.json();
      if (data.success) {
        // Redireciona de volta para a tela de carrinho após confirmar
        router.push('/carrinho');
      } else {
        alert('Erro ao adicionar ao carrinho.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botão Principal */}
      <button 
        onClick={() => setModalAberto(true)}
        className="w-full bg-[#D9537A] hover:bg-[#c2466a] text-white py-3 rounded-lg font-medium text-sm transition shadow-md cursor-pointer"
      >
        Adicionar ao Carrinho - R$ {Number(preco).toFixed(2)}
      </button>

      {/* MODAL */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#EFE7DE]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif font-bold text-lg text-[#3D2314]">Personalizar Pedido</h3>
              <button 
                onClick={() => setModalAberto(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Configurar opções para: <span className="font-semibold text-[#3D2314]">{nomeProduto}</span>
            </p>

            <form onSubmit={handleConfirmarAdicao} className="space-y-4">
              {/* Quantidade */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantidade</label>
                <input 
                  type="number" 
                  min="1" 
                  value={quantidade} 
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-xs text-gray-700 focus:outline-none focus:border-[#D9537A]"
                  required
                />
              </div>

              {/* Embalagem */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Embalagem</label>
                <select 
                  value={embalagem}
                  onChange={(e) => setEmbalagem(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#D9537A]"
                >
                  <option value="Embalagem Simples">Embalagem Simples</option>
                  <option value="Caixa para Presente">Caixa para Presente (+ R$ 5,00)</option>
                  <option value="Embalagem Festiva com Laço">Embalagem Festiva com Laço</option>
                </select>
              </div>

              {/* Descrição / Observações */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observações ou Descrição personalizada</label>
                <textarea 
                  rows={3}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Escrever mensagem no cartão, restrições alimentares, etc."
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-xs text-gray-700 focus:outline-none focus:border-[#D9537A]"
                ></textarea>
              </div>

              {/* Botões do Modal */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-[#D9537A] hover:bg-[#c2466a] text-white py-2.5 rounded-lg font-medium text-xs transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'A guardar...' : 'Confirmar e Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}