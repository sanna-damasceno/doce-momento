
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [verificandoLogin, setVerificandoLogin] = useState(true);
  const [userName, setUserName] = useState('');

  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
    }

  useEffect(() => {
    let ativo = true;

    async function verificarLogin() {
      setVerificandoLogin(true);

      try {
        const res = await fetch('/api/auth/me', {
          cache: 'no-store',
        });

        if (!ativo) return;

        if (res.ok) {
          setUsuarioLogado(true);
          setUserName(localStorage.getItem('userName') || '');
        } else {
          setUsuarioLogado(false);
          setUserName('');
        }
      } catch (error) {
        if (ativo) {
          console.error('Erro ao verificar login:', error);
          setUsuarioLogado(false);
          setUserName('');
        }
      } finally {
        if (ativo) {
          setVerificandoLogin(false);
        }
      }
    }

    verificarLogin();

    return () => {
      ativo = false;
    };
  }, [pathname]);

  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        alert('Não foi possível sair da conta. Tente novamente.');
        return;
      }

      localStorage.removeItem('userName');
      setUsuarioLogado(false);
      setUserName('');

      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao sair:', error);
      alert('Erro de conexão ao tentar sair da conta.');
    }
  }

  return (
    <>
      <div className="bg-[#3D2C1E] text-white py-2 px-4 text-center text-xs">
        Frete grátis em compras acima de R$ 150 | Entrega em até 24h
      </div>

      <header className="border-b border-[#EFE7DE] bg-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-[#C94A67] text-white font-bold w-8 h-8 rounded-full flex items-center justify-center">
              D
            </div>

            <span className="font-serif text-xl font-bold text-[#3D2C1E]">
              Doce Momento
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/" className="hover:text-[#C94A67]">
              Início
            </Link>

            <Link href="/catalogo" className="hover:text-[#C94A67]">
              Catálogo
            </Link>

            <Link href="/#sobre" className="hover:text-[#C94A67]">
              Sobre
            </Link>

            {!verificandoLogin && usuarioLogado && (
              <>
                <Link
                  href="/carrinho"
                  className="hover:text-[#C94A67]"
                >
                  Carrinho
                </Link>

                <Link
                  href="/pedidos"
                  className="hover:text-[#C94A67]"
                >
                  Pedidos
                </Link>

                <span className="font-semibold text-{#3D2C1E]">
                  {userName ? `Olá, ${userName}` : 'Olá!'}
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-red-500 hover:underline"
                >
                  Sair
                </button>
              </>
            )}

            {!verificandoLogin && !usuarioLogado && (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 border border-[#3D2C1E] rounded hover:bg-[#3D2C1E] hover:text-white transition"
                >
                  Entrar
                </Link>

                <Link
                  href="/cadastro"
                  className="px-3 py-2 bg-[#C94A67] text-white rounded hover:bg-[#b03d57] transition"
                >
                  Criar Conta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
