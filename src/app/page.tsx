'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {

  // Estados do formulário de leads/WhatsApp
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [codigoVerificacao, setCodigoVerificacao] = useState('');
  const [message, setMessage] = useState('');
  const [loadingResend, setLoadingResend] = useState(false);

  type Produto = {
    id: number;
    nome: string;
    slug: string;
    preco: number | string;
    preco_promocional: number | string | null;
    imagem: string;
    descricao_curta: string;
    quantidade_vendida: number | string;
  };

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);



  // Verificar se o utilizador está logado ao carregar a página
  useEffect(() => {

    async function buscarMaisVendidos() {
      try {
        const response = await fetch('/api/produtos/mais-vendidos');
        
        if (!response.ok) {
          throw new Error('Erro ao buscar produtos');
        }

        const data: Produto[] = await response.json();
        setProdutos(data);
      } catch (error) {
        console.error('Erro ao carregar mais vendidos:', error);
      } finally {
        setCarregandoProdutos(false);
      }
    }

    buscarMaisVendidos();

  }, []);



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
      {/* Hero Section */}
      
      {/* Banner principal */}
      <section className="bg-[#FDFBF7]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-14 md:grid-cols-2 md:px-8 md:py-20">
          <div>
            <span className="inline-flex rounded-full bg-[#FCE8ED] px-4 py-2 text-xs font-semibold text-[#C94A67]">
              ✦ Encomendas com antecedência de 3 dias
            </span>

            <h1 className="mt-6 max-w-xl text-4xl font-bold leading-tight text-[#4A2C1D] md:text-5xl lg:text-6xl">
              Doces artesanais para tornar seus momentos especiais
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-[#8A7161]">
              Sabores preparados com carinho para aniversários,
              encontros em família, presentes e celebrações especiais.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="rounded-full bg-[#C6385A] px-7 py-3.5 font-semibold text-white transition hover:bg-[#A92D4B]"
              >
                Ver nosso cardápio
              </Link>

              <a
                href="#como-funciona"
                className="rounded-full border border-[#6B4937] px-7 py-3.5 font-semibold text-[#6B4937] transition hover:bg-[#F5EBE6]"
              >
                Como funciona
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#8A7161]">
              <span>♡ Produção artesanal</span>
              <span>♡ Encomendas personalizadas</span>
            </div>
          </div>

          <div className="relative">
            <img
              src="/images/destaque.jpg"
              alt="Seleção de doces artesanais da Doce Momento"
              className="h-[320px] w-full rounded-[2rem] object-cover shadow-lg md:h-[440px]"
            />

            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/95 p-4 shadow-md">
              <p className="font-semibold text-[#4A2C1D]">
                Um doce para cada ocasião
              </p>
              <p className="mt-1 text-sm text-[#8A7161]">
                Explore nosso cardápio e planeje sua próxima encomenda.
              </p>
            </div>
          </div>
        </div>
      </section>

      
      {/* Seção de Mais Vendidos (Cardápio) */}
      
      <section id="cardapio" className="max-w-7xl mx-auto px-8 py-12">
        
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C6385A]">
              Favoritos dos clientes
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#4A2C1D]">
              Mais vendidos
            </h2>
            <p className="mt-2 text-sm text-[#8A7161]">
              Conheça os doces que fazem sucesso por aqui.
            </p>
          </div>

          <Link
            href="/catalogo"
            className="text-sm font-semibold text-[#A92D4B] hover:underline"
          >
            Ver todos →
          </Link>
        </div>


        {carregandoProdutos ? (
          <p className="text-gray-600">Carregando produtos...</p>
        ) : produtos.length === 0 ? (
          <p className="text-gray-600">
            Nenhum produto vendido foi encontrado.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {produtos.map((produto) => {
              const preco = Number(produto.preco);
              const precoPromocional =
                produto.preco_promocional == null
                  ? null
                  : Number(produto.preco_promocional);

              const precoFinal =
                precoPromocional !== null && precoPromocional > 0
                  ? precoPromocional
                  : preco;

              return (
                <div
                  key={produto.id}
                  className="bg-white rounded-lg shadow-sm border border-[#EFE7DE] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-40 rounded-md mb-3 overflow-hidden bg-[#EFE7DE]">
                      <img
                        src={produto.imagem}
                        alt={produto.nome}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <h3 className="font-semibold text-sm mb-1">
                      {produto.nome}
                    </h3>

                    <p className="text-[#C94A67] font-bold text-sm mb-4">
                      {precoFinal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>

                  <Link
                    href={`/produto/${produto.slug}`}
                    className="block text-center w-full bg-[#3D2C1E] text-white py-2 rounded text-sm font-medium hover:bg-[#2A1E14]"
                  >
                    Ver produto
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      
      {/* Categorias */}
      <section id="categorias" className="border-y border-[#F0E0D0] bg-[#FFF3E3]">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C6385A]">
                Encontre seu favorito
              </p>

              <h2 className="mt-2 text-3xl font-bold text-[#4A2C1D]">
                Nossas categorias
              </h2>

              <p className="mt-2 text-sm text-[#8A7161]">
                Delícias artesanais para todos os momentos.
              </p>
            </div>

            <Link
              href="/catalogo"
              className="text-sm font-semibold text-[#A92D4B] hover:underline"
            >
              Ver cardápio completo →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              {
                nome: "Brigadeiros",
                descricao: "Gourmet e tradicionais",
                imagem: "/images/brigadeiro.jpg",
              },
              {
                nome: "Bolos de Pote",
                descricao: "Cremosos em camadas",
                imagem: "/images/ninho.jpg",
              },
              {
                nome: "Tortas",
                descricao: "Inteiras para compartilhar",
                imagem: "/images/torta.jpg",
              },
              {
                nome: "Cupcakes",
                descricao: "Fofinhos e decorados",
                imagem: "/images/cupcake-baunilha.jpg",
              },
              {
                nome: "Caixas Presente",
                descricao: "Prontas para presentear",
                imagem: "/images/caixa-de-presente.jpg",
              },
            ].map((categoria) => (
              <Link
                key={categoria.nome}
                href={`/catalogo?categoria=${encodeURIComponent(categoria.nome)}`}
                className="group rounded-2xl border border-[#F0E0D0] bg-[#FDFBF7] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#E5B6C1] hover:shadow-md"
              >
                <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-[#F0E0D0] bg-[#FCE8ED]">
                  <img
                    src={categoria.imagem}
                    alt={categoria.nome}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                  />
                </div>

                <h3 className="mt-4 font-bold text-[#4A2C1D]">
                  {categoria.nome}
                </h3>

                <p className="mt-2 text-xs leading-5 text-[#8A7161]">
                  {categoria.descricao}
                </p>

                <span className="mt-4 block text-sm font-semibold text-[#C6385A]">
                  Explorar →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>


      
      {/* Como funciona */}
      <section id="como-funciona" className="bg-[#FFF3E3]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C6385A]">
              Simples assim
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#4A2C1D]">
              Seu pedido em três etapas
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#8A7161]">
              Planeje sua encomenda com tranquilidade e escolha os doces
              para o seu momento especial.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                numero: "01",
                titulo: "Escolha seus doces",
                descricao: "Explore o catálogo e encontre seus sabores favoritos.",
              },
              {
                numero: "02",
                titulo: "Defina a entrega",
                descricao: "Escolha uma data respeitando a antecedência mínima de 3 dias.",
              },
              {
                numero: "03",
                titulo: "Finalize seu pedido",
                descricao: "Confira os dados da encomenda e acompanhe o pedido.",
              },
            ].map((etapa) => (
              <div
                key={etapa.numero}
                className="rounded-2xl border border-[#F0E0D0] bg-[#FDFBF7] p-7 text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#4A2C1D] text-lg font-bold text-white">
                  {etapa.numero}
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#4A2C1D]">
                  {etapa.titulo}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#8A7161]">
                  {etapa.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {/* Sobre a Doce Momento */}
      <section id="sobre" className="bg-[#FDFBF7]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2 md:px-8 md:py-20">
          <div className="relative">
            <img
              src="/images/login.jpg"
              alt="Preparação artesanal dos doces da Doce Momento"
              className="h-80 w-full rounded-[2rem] object-cover shadow-md md:h-[420px]"
            />

            <div className="absolute -bottom-4 right-4 rounded-2xl bg-white p-4 shadow-lg md:right-6">
              <p className="font-bold text-[#4A2C1D]">
                Doce Momento
              </p>
              <p className="mt-1 text-xs text-[#8A7161]">
                Carinho em cada detalhe ♡
              </p>
            </div>
          </div>

          <div className="pt-4 md:pt-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C6385A]">
              Nossa história
            </p>

            <h2 className="mt-3 text-3xl font-bold leading-tight text-[#4A2C1D] md:text-4xl">
              Mais do que doces, criamos momentos especiais
            </h2>

            <p className="mt-5 text-sm leading-7 text-[#8A7161] md:text-base">
              A Doce Momento é uma confeitaria artesanal dedicada a
              tornar suas celebrações ainda mais doces. Acreditamos que
              pequenos detalhes podem transformar ocasiões simples em
              lembranças inesquecíveis.
            </p>

            <p className="mt-4 text-sm leading-7 text-[#8A7161] md:text-base">
              Cada encomenda é uma oportunidade de compartilhar carinho,
              reunir pessoas queridas e celebrar os momentos que realmente
              importam.
            </p>

            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FCE8ED]">
                
                </span>
                <div>
                  <h3 className="font-bold text-[#4A2C1D]">
                    Feito com carinho
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-[#8A7161]">
                    Atenção aos detalhes em cada encomenda.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FCE8ED]">
                  
                </span>
                <div>
                  <h3 className="font-bold text-[#4A2C1D]">
                    Para celebrar
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-[#8A7161]">
                    Doces para presentes, encontros e comemorações.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/catalogo"
              className="mt-8 inline-flex rounded-full bg-[#C6385A] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#A92D4B]"
            >
              Conheça nossos doces →
            </Link>
          </div>
        </div>
      </section>




      

      {/* Botão Flutuante Direto para o WhatsApp da Empresa (RF12)[cite: 21] */}
      <div className="fixed bottom-6 right-6 z-50">
        <a 
          href={`https://wa.me/5592993406975?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre os produtos da Doce Momento.")}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-full shadow-lg font-medium text-sm hover:bg-green-700 transition transform hover:scale-105"
        >
          <span className="text-lg">💬</span>
          <span>Fale Conosco</span>
        </a>
      </div>

      {/* Rodapé */}
      <footer className="bg-[#3D2C1E] text-white py-8 text-center text-xs mt-12">
        <p>© 2026 Doce Momento. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}