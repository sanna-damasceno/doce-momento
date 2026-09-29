import Link from 'next/link';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getProdutos() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM produtos ORDER BY id ASC');
    client.release();
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

export default async function CatalogoPage() {
  const produtos = await getProdutos();

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between font-sans text-[#3D2C1E]">
      {/* Cabeçalho */}
      <header className="border-b border-[#EFE7DE] bg-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#D9537A] text-white font-bold w-8 h-8 rounded-full flex items-center justify-center font-serif text-lg">D</div>
            <span className="font-serif text-xl font-bold text-[#3D2314]">Doce Momento</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm">
            <Link href="/" className="hover:text-[#D9537A]">Home</Link>
            <Link href="/catalogo" className="font-semibold text-[#D9537A]">Catálogo</Link>
            <Link href="/sobre" className="hover:text-[#D9537A]">Sobre</Link>
            <Link href="/contato" className="hover:text-[#D9537A]">Contato</Link>
          </nav>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-grow">
        {/* Migalhas de pão / Título */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-1">Home &gt; Catálogo</p>
          <h1 className="text-3xl font-serif font-bold text-[#3D2314]">Catálogo de Doces</h1>
          <p className="text-xs text-gray-500 mt-1">Escolha seus doces favoritos e faça sua encomenda artesanal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Barra lateral de Filtros (Estático / Exemplo visual) */}
          <aside className="bg-white p-5 rounded-xl border border-[#EFE7DE] h-fit shadow-sm md:col-span-1">
            <h3 className="font-semibold text-sm mb-3 text-[#3D2314]">Filtros</h3>
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">CATEGORIAS</h4>
                <ul className="space-y-1.5 text-gray-600">
                  <li className="font-semibold text-[#D9537A] cursor-pointer">• Todos os Produtos</li>
                  <li className="cursor-pointer hover:text-[#D9537A]">Brigadeiros</li>
                  <li className="cursor-pointer hover:text-[#D9537A]">Bolos de Pote</li>
                  <li className="cursor-pointer hover:text-[#D9537A]">Tortas</li>
                  <li className="cursor-pointer hover:text-[#D9537A]">Cupcakes</li>
                  <li className="cursor-pointer hover:text-[#D9537A]">Caixas Presente</li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Grelha de Produtos */}
          <div className="md:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-500">{produtos.length} produtos encontrados</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {produtos.map((prod) => (
                <div key={prod.id} className="bg-white rounded-xl border border-[#EFE7DE] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    {/* Imagem clicável */}
                    <Link href={`/catalogo/${prod.slug}`} className="block h-48 bg-gray-100 overflow-hidden relative">
                        <img src={prod.imagem} alt={prod.nome} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                    </Link>
                    <div className="p-4">
                        {/* Título clicável */}
                        <Link href={`/catalogo/${prod.slug}`}>
                            <h3 className="font-serif font-bold text-sm text-[#3D2314] line-clamp-1 hover:text-[#D9537A] transition">
                                {prod.nome}
                            </h3>
                        </Link>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{prod.descricao_curta}</p>
                      <div className="mt-3">
                        <span className="text-sm font-bold text-[#D9537A]">R$ {Number(prod.preco).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <Link 
                      href={`/catalogo/${prod.slug}`} 
                      className="block w-full text-center bg-[#3D2314] hover:bg-[#2A180E] text-white text-xs py-2 rounded font-medium transition"
                    >
                      Adicionar ao Carrinho
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="bg-[#2A180E] text-white text-xs py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400">
          <p>© 2026 Doce Momento. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}