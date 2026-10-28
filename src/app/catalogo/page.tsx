import Link from 'next/link';
import { Pool, type PoolClient } from 'pg';
import FiltroCatalogo from './FiltroCatalogo';

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getProdutos() {
  let client: PoolClient | undefined;

  try {
    client = await pool.connect();
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

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-grow">
        {/* Título */}
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