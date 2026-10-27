import Link from 'next/link';
import { Pool, type PoolClient } from 'pg';
import FiltroCatalogo from './FiltroCatalogo';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getProdutos() {
  let client: PoolClient | undefined;
  try {
    const client = await pool.connect();
    const result = await client.query(`SELECT
        id,
        nome,
        slug,
        categoria,
        preco,
        preco_promocional,
        imagem,
        descricao_curta,
        destaque
      FROM produtos
      ORDER BY id ASC`);

    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  } finally {
    client?.release();
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
        <FiltroCatalogo produtos={produtos} />

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