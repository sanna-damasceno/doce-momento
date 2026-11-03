'use client';

import { useEffect, useRef } from 'react';
import { registrarEvento } from '@/utils/analytics';

interface Props {
  produtoId: number;
  nomeProduto: string;
  categoria: string;
  preco: number;
}

export default function RegistrarVisualizacaoProduto({
  produtoId,
  nomeProduto,
  categoria,
  preco,
}: Props) {
  const eventoRegistrado = useRef(false);

  useEffect(() => {
    // Evita registrar o mesmo evento mais de uma vez
    if (eventoRegistrado.current) {
      return;
    }

    registrarEvento('visualizou_produto', {
      item_id: String(produtoId),
      item_name: nomeProduto,
      item_category: categoria,
      price: preco,
      currency: 'BRL',
    });

    eventoRegistrado.current = true;
  }, [produtoId, nomeProduto, categoria, preco]);

  return null;
}