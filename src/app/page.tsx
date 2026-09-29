'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  // Estados do formulário de leads/WhatsApp
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [codigoVerificacao, setCodigoVerificacao] = useState('');
  const [message, setMessage] = useState('');
  const [loadingResend, setLoadingResend] = useState(false);

  // Verificar se o utilizador está logado ao carregar a página
  useEffect(() => {
    // Exemplo: verificar se existe um cookie ou dado no localStorage gravado no login
    const userSession = localStorage.getItem('userName'); // ou verificação por cookie/token
    if (userSession) {
      setIsLoggedIn(true);
      setUserName(userSession);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    window.location.reload();
  };


  // 1. Submissão do formulário de contacto/cadastro
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      // Regista os dados do cliente no sistema
      const responseLeads = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, whatsapp }),
      });

      if (!responseLeads.ok) {
        alert('Erro ao registar os seus dados.');
        return;
      }

      // Solicita a geração e envio do código de segurança por e-mail
      const responseOtp = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const dataOtp = await responseOtp.json();

      if (responseOtp.ok) {
        setStep('verify');
      } else {
        alert(dataOtp.error || 'Erro ao enviar o código de verificação.');
      }
    } catch (error) {
      console.error('Erro na submissão:', error);
      alert('Erro de conexão com o servidor.');
    }
  };

  // Função para Reenviar o Código de Verificação
  const handleResendOtp = async () => {
    setLoadingResend(true);
    setMessage('');
    try {
      const response = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Um novo código de verificação foi enviado para o seu e-mail.');
      } else {
        setMessage(data.error || 'Erro ao reenviar o código.');
      }
    } catch (error) {
      console.error('Erro no reenvio:', error);
      setMessage('Erro de conexão ao reenviar o código.');
    } finally {
      setLoadingResend(false);
    }
  };

  // Função para Voltar e alterar os dados
  const handleBackToForm = () => {
    setStep('form');
    setCodigoVerificacao('');
    setMessage('');
  };

  // 2. Validação do código introduzido pelo utilizador
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codigoVerificacao }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('E-mail verificado com sucesso! A redirecionar para o WhatsApp...');

        // Número de WhatsApp da Doce Momento
        const numeroWhatsApp = '5592993406975'; 
        
        // Mensagem personalizada para o WhatsApp
        const mensagem = encodeURIComponent(
          `Olá! O meu nome é ${nome}, o meu e-mail é ${email} e quero saber mais novidades da Doce Momento!`
        );

        // Abre o WhatsApp numa nova aba automaticamente
        window.open(`https://wa.me/${numeroWhatsApp}?text=${mensagem}`, '_blank');
        
        // Reiniciar o fluxo e limpar campos
        setStep('form');
        setCodigoVerificacao('');
        setNome('');
        setEmail('');
        setWhatsapp('');
      } else {
        setMessage(data.error || 'Código incorreto ou expirado.');
      }
    } catch (error) {
      console.error('Erro na verificação:', error);
      setMessage('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A3525] font-sans">
      {/* Topo / Header */}
      <header className="bg-[#3D2C1E] text-white py-2 text-center text-xs">
        Frete grátis em compras acima de R$ 150 | Entrega em até 24h
      </header>
      
      <nav className="flex justify-between items-center px-8 py-4 border-b border-[#EFE7DE] max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="bg-[#C94A67] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">D</span>
          <span className="text-xl font-bold tracking-wide text-[#3D2C1E]">Doce Momento</span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-[#C94A67]">Início</Link>
          <Link href="/catalogo" className="hover:text-[#C94A67]">Cardápio</Link>
          <a href="#cadastro" className="hover:text-[#C94A67]">Fale Conosco</a>
        </div>

        {/* Área de Autenticação Dinâmica no Cabeçalho */}
        <div className="flex items-center gap-4">
          {/* O carrinho só aparece se o utilizador estiver logado */}
          {isLoggedIn && (
            <Link href="/carrinho" className="bg-[#C94A67] text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-[#b03d57]">
              🛒 Carrinho
            </Link>
          )}

          {isLoggedIn ? (
            <div className="flex items-center gap-3 text-xs">
              <Link href="/perfil" className="font-semibold text-[#3D2C1E] hover:text-[#C94A67]">
                Olá, {userName}
              </Link>
              <button onClick={handleLogout} className="text-red-500 hover:underline">
                Sair
              </button>
            </div>
          ) : (
            <div className="flex gap-2 text-xs">
              <Link href="/login" className="px-3 py-2 border border-[#3D2C1E] rounded font-medium hover:bg-[#3D2C1E] hover:text-white transition">
                Entrar
              </Link>
              <Link href="/cadastro" className="px-3 py-2 bg-[#C94A67] text-white rounded font-medium hover:bg-[#b03d57]">
                Criar Conta
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <span className="bg-[#FCE8ED] text-[#C94A67] text-xs font-semibold px-3 py-1 rounded-full">
            Entrega em até 24 horas
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-4 leading-tight text-[#3D2C1E]">
            Doces Artesanais para seus Momentos Especiais
          </h1>
          <p className="text-gray-600 mb-6 text-sm">
            Feitos com amor e ingredientes selecionados. Surpreenda quem você ama com o verdadeiro sabor do carinho.
          </p>
          <div className="flex gap-4">
            <Link href="/catalogo" className="bg-[#C94A67] text-white px-6 py-3 rounded-md font-medium shadow hover:bg-[#b03d57]">
              Ver Cardápio
            </Link>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-lg h-80 relative">
          <img 
            src="/images/destaque.jpg" 
            alt="Doces Artesanais Doce Momento" 
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Seção de Mais Vendidos (Cardápio) */}
      <section id="cardapio" className="max-w-7xl mx-auto px-8 py-12">
        <h2 className="text-2xl font-bold mb-6 text-[#3D2C1E]">Mais Vendidos da Semana</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { nome: 'Brigadeiro Gourmet de Pistache', preco: 'R$ 4,50/un', imagem: '/images/pistache.jpg'},
            { nome: 'Bolo de Pote de Ninho com Nutella', preco: 'R$ 15,00/un', imagem: '/images/ninho.jpg'},
            { nome: 'Torta de Limão Siciliano', preco: 'R$ 85,00/un', imagem: '/images/torta.jpg' },
            { nome: 'Cupcake Red Velvet', preco: 'R$ 9,00/un', imagem: '/images/red.jpg' },
          ].map((produto, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-[#EFE7DE] p-4 flex flex-col justify-between">
              <div>
                <div className="h-40 rounded-md mb-3 overflow-hidden bg-[#EFE7DE] relative">
                  <img 
                    src={produto.imagem} 
                    alt={produto.nome} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-sm mb-1">{produto.nome}</h3>
                <p className="text-[#C94A67] font-bold text-sm mb-4">{produto.preco}</p>
              </div>
              <button onClick={() => alert(`${produto.nome} adicionado ao carrinho!`)} className="w-full bg-[#3D2C1E] text-white py-2 rounded text-sm font-medium hover:bg-[#2A1E14]">
                Adicionar ao Carrinho
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Seção de Cadastro e Verificação por E-mail */}
      <section id="cadastro" className="bg-[#F5EBE6] py-16 px-8 mt-12 border-t border-[#EFE7DE]">
        <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-[#3D2C1E] mb-2 text-center">Fale Conosco no WhatsApp</h2>
          <p className="text-gray-600 text-sm mb-6 text-center">
            {step === 'form' 
              ? 'Insira os seus dados para receber o código de confirmação e iniciar a conversa.' 
              : `Digite o código de 6 dígitos enviado para ${email}`}
          </p>
          
          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome Completo *</label>
                <input 
                  type="text" 
                  required 
                  value={nome} 
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Maria Silva" 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C94A67]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail *</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maria@email.com" 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C94A67]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp *</label>
                <input 
                  type="text" 
                  required 
                  value={whatsapp} 
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 98765-4321" 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C94A67]"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-[#C94A67] text-white py-3 rounded font-medium text-sm hover:bg-[#b03d57] transition"
              >
                Continuar e Enviar Código
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-xs text-gray-600 text-center mb-2">
                Enviamos uma mensagem com o código de verificação para o seu e-mail.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Código de Verificação (6 dígitos) *</label>
                <input 
                  type="text" 
                  maxLength={6}
                  required 
                  value={codigoVerificacao} 
                  onChange={(e) => setCodigoVerificacao(e.target.value)}
                  placeholder="123456" 
                  className="w-full text-center tracking-widest text-lg border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#C94A67]"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-green-600 text-white py-3 rounded font-medium text-sm hover:bg-green-700 transition"
              >
                Confirmar Código e Abrir WhatsApp
              </button>

              <div className="flex justify-between items-center mt-3 text-sm">
                <button 
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loadingResend}
                  className="text-[#C94A67] hover:underline font-medium"
                >
                  {loadingResend ? 'A reenviar...' : 'Reenviar Código'}
                </button>

                <button 
                  type="button"
                  onClick={handleBackToForm}
                  className="text-gray-500 hover:underline"
                >
                  Voltar / Alterar Dados
                </button>
              </div>
            </form>
          )}

          {message && (
            <div className="mt-4 p-3 text-sm rounded-md bg-red-50 text-red-700 text-center">
              {message}
            </div>
          )}
        </div>
      </section>

      {/* Rodapé */}
      <footer className="bg-[#3D2C1E] text-white py-8 text-center text-xs mt-12">
        <p>© 2026 Doce Momento. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}