'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Conta criada com sucesso!');
        router.push('/login');
      } else {
        setError(data.error || 'Ocorreu um erro ao registar.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between p-6 font-sans">
      {/* Cabeçalho */}
      <header className="flex justify-between items-center max-w-6xl w-full px-4 mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-[#D9537A] text-white font-bold w-8 h-8 rounded-full flex items-center justify-center font-serif text-lg">D</div>
          <span className="font-serif text-xl font-bold text-[#3D2314]">Doce Momento</span>
        </div>
        <Link href="/" className="text-xs text-gray-500 hover:text-black">← Voltar para loja</Link>
      </header>

      {/* Conteúdo Principal (Card Central) */}
      <main className="flex items-center justify-center my-auto py-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2">
          
          {/* Lado Esquerdo: Imagem com caixa de doces */}
          <div className="relative hidden md:flex items-center justify-center bg-[#F4EBE1] p-8">
            <div className="bg-white p-4 rounded-xl shadow-md z-10 text-center max-w-xs">
              <div className="w-full h-64 rounded-lg bg-cover bg-center mb-4 flex items-end justify-center pb-4 text-white font-serif text-xl" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&q=80&w=500')` }}>
                <span className="bg-black/40 px-3 py-1 rounded backdrop-blur-sm text-sm">feito com carinho</span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Formulário */}
          <div className="p-8 md:p-10 flex flex-col justify-center">
            
            {/* Abas Entrar / Criar Conta */}
            <div className="flex bg-[#F4EBE1] p-1 rounded-full mb-6">
              <Link href="/login" className="w-1/2 text-center py-2 text-xs font-semibold text-gray-600 rounded-full">Entrar</Link>
              <div className="w-1/2 text-center py-2 text-xs font-semibold bg-white text-[#3D2314] rounded-full shadow-sm">Criar conta</div>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-serif font-bold text-[#3D2314]">Crie sua conta</h1>
              <p className="text-xs text-gray-400 mt-0.5">É rápido e fácil – leva menos de 1 minuto</p>
            </div>

            {error && <div className="bg-red-50 text-red-500 p-2.5 rounded mb-4 text-xs text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Nome completo *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full p-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#D9537A]" placeholder="Maria Silva" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">E-mail *</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#D9537A]" placeholder="maria@email.com" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">WhatsApp *</label>
                  <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#D9537A]" placeholder="(11) 98765-4321" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Senha *</label>
                  <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full p-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#D9537A]" placeholder="********" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Confirmar senha *</label>
                  <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full p-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#D9537A]" placeholder="********" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#D9537A] hover:bg-[#c2466a] text-white font-medium py-2.5 rounded transition duration-200 text-xs mt-3 shadow-sm">
                {loading ? 'A criar conta...' : 'Criar Conta'}
              </button>
            </form>

            <p className="text-center text-[11px] text-gray-500 mt-4">
              Já tem uma conta? <Link href="/login" className="text-[#D9537A] font-semibold hover:underline">Faça login</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="flex justify-between items-center text-[10px] text-gray-400 max-w-6xl w-full px-4 mx-auto">
        <span>© 2026 Doce Momento</span>
        <div className="flex gap-4">
          <span>Termos de Uso</span>
          <span>Política de Privacidade</span>
          <span>Contacto</span>
        </div>
      </footer>
    </div>
  );
}