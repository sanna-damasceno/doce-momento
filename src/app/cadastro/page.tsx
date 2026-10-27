'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'verify'>('form');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Passo 1: Validar dados, verificar se o e-mail está livre e enviar o OTP via API existente
  const handleStartRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // 1. Validar e iniciar registo
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, action: 'INIT_REGISTER' }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ocorreu um erro ao registar.');
        setLoading(false);
        return;
      }

      // 2. Enviar o código OTP utilizando a sua rota existente
      const otpResponse = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const otpData = await otpResponse.json();

      if (otpResponse.ok) {
        setStep('verify'); // Avança para o passo de digitar o código de 6 dígitos
      } else {
        setError(otpData.error || 'Erro ao enviar o código de verificação.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2: Validar o OTP e concluir a criação da conta na tabela 'users'
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Validar o código OTP usando a sua rota existente
      const verifyResponse = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: otpCode }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyData.error || 'Código incorreto ou expirado.');
        setLoading(false);
        return;
      }

      // 2. Criar a conta definitivamente após a validação bem-sucedida do e-mail
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, action: 'COMPLETE_REGISTER' }),
      });

      const registerData = await registerResponse.json();

      if (registerResponse.ok) {
        alert('E-mail verificado e conta criada com sucesso!');
        router.push('/login');
      } else {
        setError(registerData.error || 'Erro ao finalizar o registo.');
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
              <h1 className="text-2xl font-serif font-bold text-[#3D2314]">
                {step === 'form' ? 'Crie sua conta' : 'Confirme seu E-mail'}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {step === 'form' 
                  ? 'É rápido e fácil – leva menos de 1 minuto' 
                  : `Digite o código de 6 dígitos enviado para ${formData.email}`}
              </p>
            </div>

            {error && <div className="bg-red-50 text-red-500 p-2.5 rounded mb-4 text-xs text-center">{error}</div>}

            {step === 'form' ? (
              <form onSubmit={handleStartRegister} className="space-y-3">
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
                  {loading ? 'A enviar código...' : 'Continuar e Enviar Código'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndRegister} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Código de Verificação (6 dígitos) *</label>
                  <input 
                    type="text" 
                    maxLength={6} 
                    required 
                    value={otpCode} 
                    onChange={(e) => setOtpCode(e.target.value)} 
                    className="w-full p-3 border border-gray-200 rounded text-center tracking-widest text-lg font-bold focus:outline-none focus:border-[#D9537A]" 
                    placeholder="123456" 
                  />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded transition duration-200 text-xs mt-3 shadow-sm">
                  {loading ? 'A verificar e criar conta...' : 'Verificar Código e Criar Conta'}
                </button>

                <button type="button" onClick={() => setStep('form')} className="w-full text-center text-xs text-gray-500 hover:underline mt-2">
                  Voltar e alterar dados
                </button>
              </form>
            )}

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