'use client';

import { useState } from 'react';

export default function Home() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, whatsapp }),
      });

      if (response.ok) {
        alert('Lead cadastrado com sucesso no banco de dados!');

        // Número de WhatsApp da Doce Momento (Exemplo: DDI + DDD + Número)
        const numeroWhatsApp = '5592993406975'; 
        
        // Mensagem personalizada codificada para URL
        const mensagem = encodeURIComponent(
          `Olá! O meu nome é ${nome}, o meu e-mail é ${email} e quero saber mais novidades da Doce Momento!`
        );

        // Abre o WhatsApp numa nova aba automaticamente
        window.open(`https://wa.me/${numeroWhatsApp}?text=${mensagem}`, '_blank');
      } else {
        alert('Erro ao cadastrar lead.');
      }
    } catch (error) {
      console.error('Erro na submissão:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A3525] font-sans">
      {/* Topo / Header */}
      <header className="bg-[#3D2C1E] text-white py-2 text-center text-xs">
        Frete grátis em compras acima de R$ 150 | Entrega em até 24h na Capital
      </header>
      
      <nav className="flex justify-between items-center px-8 py-4 border-b border-[#EFE7DE] max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="bg-[#C94A67] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">D</span>
          <span className="text-xl font-bold tracking-wide text-[#3D2C1E]">Doce Momento</span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium">
          <a href="#" className="hover:text-[#C94A67]">Início</a>
          <a href="#cardapio" className="hover:text-[#C94A67]">Cardápio</a>
          <a href="#leads" className="hover:text-[#C94A67]">Cadastrar Leads</a>
          <a href="#contato" className="hover:text-[#C94A67]">Contato</a>
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
            <a href="#cardapio" className="bg-[#C94A67] text-white px-6 py-3 rounded-md font-medium shadow hover:bg-[#b03d57]">
              Ver Cardápio
            </a>
            <a href="#leads" className="border border-[#3D2C1E] text-[#3D2C1E] px-6 py-3 rounded-md font-medium hover:bg-[#3D2C1E] hover:text-white transition">
              Cadastrar Leads
            </a>
          </div>
        </div>
        <div className="bg-[#F5EBE6] rounded-2xl h-80 flex items-center justify-center shadow-inner">
          <p className="text-[#8C7A6B] italic font-medium">[Imagem de Destaque - Doce Momento]</p>
        </div>
      </section>

      {/* Seção de Mais Vendidos (Cardápio) */}
      <section id="cardapio" className="max-w-7xl mx-auto px-8 py-12">
        <h2 className="text-2xl font-bold mb-6 text-[#3D2C1E]">Mais Vendidos da Semana</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { nome: 'Brigadeiro Gourmet de Pistache', preco: 'R$ 4,50/un' },
            { nome: 'Bolo de Pote de Ninho com Nutella', preco: 'R$ 15,00/un' },
            { nome: 'Torta de Limão Siciliano', preco: 'R$ 85,00/un' },
            { nome: 'Cupcake Red Velvet', preco: 'R$ 9,00/un' },
          ].map((produto, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-[#EFE7DE] p-4 flex flex-col justify-between">
              <div>
                <div className="bg-[#EFE7DE] h-40 rounded-md mb-3 flex items-center justify-center text-xs text-gray-500">Foto do Doce</div>
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

      {/* Seção de Captura de Leads e WhatsApp (Requisito Semana 2) */}
      <section id="leads" className="bg-[#F5EBE6] py-16 px-8 mt-12 border-t border-[#EFE7DE]">
        <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-[#3D2C1E] mb-2 text-center">Cadastre-se na Doce Momento</h2>
          <p className="text-gray-600 text-sm mb-6 text-center">Receba novidades e promoções exclusivas direto no seu WhatsApp!</p>
          
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
              Criar Conta / Enviar para WhatsApp
            </button>
          </form>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="bg-[#3D2C1E] text-white py-8 text-center text-xs mt-12">
        <p>© 2026 Doce Momento. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}