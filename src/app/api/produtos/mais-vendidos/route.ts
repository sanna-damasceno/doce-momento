
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    
    const result = await pool.query(`
        SELECT
            p.id,
            p.nome,
            p.slug,
            p.preco,
            p.preco_promocional,
            p.imagem,
            p.descricao_curta,
            COALESCE(SUM(oi.quantity), 0)::INTEGER AS quantidade_vendida
        FROM produtos p
        INNER JOIN order_items oi
            ON LOWER(TRIM(oi.product_name)) = LOWER(TRIM(p.nome))
        INNER JOIN orders o
            ON o.id = oi.order_id
        WHERE LOWER(TRIM(o.status)) = 'pago%'
        GROUP BY
            p.id,
            p.nome,
            p.slug,
            p.preco,
            p.preco_promocional,
            p.imagem,
            p.descricao_curta
        ORDER BY
            quantidade_vendida DESC,
            p.id ASC
        LIMIT 4
        `);


    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar mais vendidos:', error);

    return NextResponse.json(
      { error: 'Não foi possível buscar os produtos mais vendidos.' },
      { status: 500 }
    );
  }
}
