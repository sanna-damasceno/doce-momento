import Link from 'next/link';
import { Pool } from 'pg';
import { notFound } from 'next/navigation';
import BotaoComprarModal from './BotaoComprarModal';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getProdutoBySlug(slug: string) {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM produtos WHERE slug = $1', [slug]);
    client.release();
    return result.rows[0] || null;
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DetalheProdutoPage({ params }: PageProps) {
  const resolvedParams = await params;
  const produto = await getProdutoBySlug(resolvedParams.slug);

  if (!produto) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between font-sans text-[#3D2C1E]">
      {/* Cabeçalho */}
      <header className="border-b border-[#EFE7DE] bg-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#D9537A] text-white font-bold w-8 h-8 rounded-full flex items-center justify-center font-serif text-lg">D</div>
            <span className="font-serif text-xl font-bold text-[#3D2314]">Doce Momento</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/carrinho" className="text-xs font-semibold bg-[#FCE8ED] text-[#D9537A] px-3 py-1.5 rounded-full hover:bg-[#f8d7df]">
              🛒 Ver Carrinho
            </Link>
            <Link href="/catalogo" className="text-xs text-gray-500 hover:text-black">← Voltar ao Catálogo</Link>
          </div>
        </div>
      </header>

      {/* Conteúdo do Produto */}
      <main className="max-w-6xl mx-auto px-4 py-10 w-full flex-grow">
        <p className="text-xs text-gray-400 mb-4">Home &gt; Catálogo &gt; {produto.categoria} &gt; {produto.nome}</p>

        <div className="bg-white rounded-2xl border border-[#EFE7DE] p-6 md:p-10 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Imagem do Produto */}
          <div>
            <div className="w-full h-80 md:h-96 bg-gray-100 rounded-xl overflow-hidden shadow-inner">
              <img src={produto.imagem} alt={produto.nome} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Informações e Compra */}
          <div className="flex flex-col justify-center">
            <span className="text-xs font-semibold bg-[#FCE8ED] text-[#D9537A] px-2.5 py-1 rounded-full w-fit mb-2">
              Pronta Entrega
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#3D2314]">{produto.nome}</h1>
            
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-[#D9537A]">R$ {Number(produto.preco).toFixed(2)}</span>
              {produto.preco_promocional && (
                <span className="text-sm text-gray-400 line-through">R$ {Number(produto.preco_promocional).toFixed(2)}</span>
              )}
            </div>

            <p className="text-xs text-gray-600 mt-4 leading-relaxed">{produto.descricao_curta}</p>

            <hr className="my-6 border-[#EFE7DE]" />

            {/* Componente do Botão com Modal */}
            <BotaoComprarModal 
              produtoId={produto.id} 
              preco={produto.preco} 
              nomeProduto={produto.nome} 
            />
          </div>
        </div>

        {/* Informações Detalhadas */}
        <div className="mt-10 bg-white rounded-2xl border border-[#EFE7DE] p-6 md:p-8 shadow-sm">
          <div className="flex gap-8 border-b border-[#EFE7DE] pb-3 text-xs font-semibold text-gray-500">
            <span className="text-[#D9537A] border-b-2 border-[#D9537A] pb-3 -mb-3">Descrição</span>
          </div>
          <div className="mt-6 text-xs text-gray-600 space-y-4 leading-relaxed">
            <p>{produto.descricao_longa || produto.descricao_curta}</p>
            {produto.ingredientes && <p><strong>Ingredientes:</strong> {produto.ingredientes}</p>}
            {produto.armazenamento && <p><strong>Armazenamento:</strong> {produto.armazenamento}</p>}
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