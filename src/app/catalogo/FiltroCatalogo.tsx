
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type Produto = {
  id: number;
  nome: string;
  slug: string;
  categoria: string;
  preco: number | string;
  preco_promocional: number | string | null;
  imagem: string;
  descricao_curta: string;
  destaque: boolean;
};

type Props = {
  produtos: Produto[];
};

export default function FiltroCatalogo({ produtos }: Props) {
  const searchParams = useSearchParams();

  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas');

  useEffect(() => {
    const categoriaURL = searchParams.get('categoria');

    if (categoriaURL) {
      setCategoriaSelecionada(categoriaURL);
    } else {
      setCategoriaSelecionada('Todas');
    }
  }, [searchParams]);

  // Busca as categorias que realmente existem nos produtos
  const categorias = Array.from(
    new Set(
      produtos
        .map((produto) => produto.categoria?.trim())
        .filter((categoria): categoria is string => Boolean(categoria))
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Filtra os produtos pela categoria escolhida
  const produtosFiltrados =
    categoriaSelecionada === 'Todas'
      ? produtos
      : produtos.filter(
          (produto) => produto.categoria?.trim() === categoriaSelecionada
        );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="bg-white p-5 rounded-xl border border-[#EFE7DE] h-fit shadow-sm">
        <h3 className="font-semibold text-sm mb-3 text-[#3D2314]">
          Filtros
        </h3>

        <h4 className="font-medium text-gray-700 mb-2 text-xs">
          CATEGORIAS
        </h4>

        <ul className="space-y-2 text-xs">
          <li>
            <button
              type="button"
              onClick={() => setCategoriaSelecionada('Todas')}
              className={`text-left ${
                categoriaSelecionada === 'Todas'
                  ? 'font-semibold text-[#D9537A]'
                  : 'text-gray-600 hover:text-[#D9537A]'
              }`}
            >
              Todos os produtos ({produtos.length})
            </button>
          </li>

          {categorias.map((categoria) => {
            const quantidade = produtos.filter(
              (produto) => produto.categoria?.trim() === categoria
            ).length;

            return (
              <li key={categoria}>
                <button
                  type="button"
                  onClick={() => setCategoriaSelecionada(categoria)}
                  className={`text-left ${
                    categoriaSelecionada === categoria
                      ? 'font-semibold text-[#D9537A]'
                      : 'text-gray-600 hover:text-[#D9537A]'
                  }`}
                >
                  {categoria} ({quantidade})
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="md:col-span-3">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-gray-500">
            {produtosFiltrados.length}{' '}
            {produtosFiltrados.length === 1
              ? 'produto encontrado'
              : 'produtos encontrados'}
          </span>

          {categoriaSelecionada !== 'Todas' && (
            <button
              type="button"
              onClick={() => setCategoriaSelecionada('Todas')}
              className="text-xs text-[#D9537A] hover:underline"
            >
              Limpar filtro
            </button>
          )}
        </div>

        {produtosFiltrados.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum produto encontrado nesta categoria.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {produtosFiltrados.map((prod) => {
              const preco = Number(prod.preco);
              const promocional =
                prod.preco_promocional === null
                  ? null
                  : Number(prod.preco_promocional);

              const temPromocao =
                promocional !== null &&
                Number.isFinite(promocional) &&
                promocional < preco;

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-xl border border-[#EFE7DE] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <a
                      href={`/catalogo/${prod.slug}`}
                      className="block h-48 bg-gray-100 overflow-hidden"
                    >
                      <img
                        src={prod.imagem}
                        alt={prod.nome}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      />
                    </a>

                    <div className="p-4">
                      <a href={`/catalogo/${prod.slug}`}>
                        <h3 className="font-serif font-bold text-sm text-[#3D2314] line-clamp-1 hover:text-[#D9537A] transition">
                          {prod.nome}
                        </h3>
                      </a>

                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                        {prod.descricao_curta}
                      </p>

                      <div className="mt-3">
                        {temPromocao ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-400 line-through">
                              R$ {preco.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-sm font-bold text-[#D9537A]">
                              R$ {promocional!.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-[#D9537A]">
                            R$ {preco.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <a
                      href={`/catalogo/${prod.slug}`}
                      className="block w-full text-center bg-[#3D2314] hover:bg-[#2A180E] text-white text-xs py-2 rounded font-medium transition"
                    >
                      Ver produto
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
