'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
        setLoading(true);

        try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
            // 👇 ADICIONE ESTAS LINHAS PARA SALVAR A SESSÃO NO LOCALSTORAGE
            // (Certifique-se de que a sua API de login devolve o nome do utilizador, por exemplo: data.user.name)
            localStorage.setItem('userName', data.user?.name || 'Cliente');
            
            alert('Login efetuado com sucesso!');
            router.push('/'); // Redireciona para a página inicial
        } else {
            setError(data.error || 'E-mail ou senha incorretos.');
        }
        } catch (err) {
        setError('Erro de conexão com o servidor.');
        } finally {
        setLoading(false);
        }
    };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between p-6 font-sans">

      {/* Conteúdo Principal (Card Central) */}
      <main className="flex items-center justify-center my-auto py-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2">
          
          {/* Lado Esquerdo: Imagem com caixa de doces */}

          <div className="relative hidden min-h-[600px] overflow-hidden bg-[#F4EBE1] md:block">
            <img
              src="/images/login.jpg"
              alt="Caixa de doces artesanais da Doce Momento"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>



          {/* Lado Direito: Formulário de Login */}
          <div className="p-8 md:p-10 flex flex-col justify-center">
            
            {/* Abas Entrar / Criar Conta */}
            <div className="flex bg-[#F4EBE1] p-1 rounded-full mb-6">
              <div className="w-1/2 text-center py-2 text-xs font-semibold bg-white text-[#3D2314] rounded-full shadow-sm">Entrar</div>
              <Link href="/cadastro" className="w-1/2 text-center py-2 text-xs font-semibold text-gray-600 rounded-full">Criar conta</Link>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-serif font-bold text-[#3D2314]">Bem-vindo de volta</h1>
              <p className="text-xs text-gray-400 mt-0.5">Entre para aceder à sua conta</p>
            </div>

            {error && <div className="bg-red-50 text-red-500 p-2.5 rounded mb-4 text-xs text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">E-mail *</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#D9537A]" placeholder="maria@email.com" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-medium text-gray-700">Senha *</label>
                  <Link href="/recuperar-senha" className="text-[10px] text-[#D9537A] hover:underline">Esqueceu a senha?</Link>
                </div>
                <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#D9537A]" placeholder="********" />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#D9537A] hover:bg-[#c2466a] text-white font-medium py-2.5 rounded transition duration-200 text-xs mt-2 shadow-sm">
                {loading ? 'A entrar...' : 'Entrar'}
              </button>
            </form>

            <p className="text-center text-[11px] text-gray-500 mt-6">
              Ainda não tem uma conta? <Link href="/cadastro" className="text-[#D9537A] font-semibold hover:underline">Crie uma agora</Link>
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