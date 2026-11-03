
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { aplicarMascaraWhatsApp } from '@/utils/mascaras';
import { registrarEvento } from '@/utils/analytics';

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      phone: aplicarMascaraWhatsApp(e.target.value),
    }));
  };


  // Passo 1: Validar dados, verificar e-mail e enviar OTP

  const handleStartRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    // 1. Verificar campos obrigatórios
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    // 2. Validar nome
    if (name.length < 2 || name.length > 100) {
      setError('O nome deve ter entre 2 e 100 caracteres.');
      return;
    }

    // 3. Validar e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError('Informe um endereço de e-mail válido.');
      return;
    }

    // 4. Validar telefone
    const phoneDigits = phone.replace(/\D/g, '');

    if (!/^\d{2}9\d{8}$/.test(phoneDigits)) {
      setError('Informe um WhatsApp válido com DDD e 9 dígitos.');
      return;
    }

    // 5. Validar senha
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // 6. Enviar dados para o backend
      const registerData = {
        name,
        email,
        phone,
        password,
        confirmPassword,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...registerData,
          action: 'INIT_REGISTER',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ocorreu um erro ao registrar.');
        return;
      }

      // 7. Solicitar código OTP
      const otpResponse = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const otpData = await otpResponse.json();

      if (otpResponse.ok) {
        registrarEvento('enviou_formulario', {
          tipo_formulario: 'cadastro',
        });
        setFormData({
          ...formData,
          name,
          email,
          phone,
        });

        setStep('verify');
      } else {
        setError(otpData.error || 'Erro ao enviar o código de verificação.');
      }

    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2: Validar OTP e concluir a criação da conta
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('1. Função de verificação iniciada');

    try {
      // 1. Validar o código OTP
      console.log('2. Enviando código para a API');
      const verifyResponse = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: otpCode }),
      });

      console.log('3. Status da API:', verifyResponse.status);

      const verifyData = await verifyResponse.json();
      console.log('4. Resposta da API:', verifyData);

      if (!verifyResponse.ok) {
        console.log('5. A API retornou erro');
        setError(verifyData.error || 'Código incorreto ou expirado.');
        setLoading(false);
        return;
      }

      console.log('E-mail verificado com sucesso!');

      registrarEvento('email_verificado');

      console.log('Evento email_verificado enviado!');

      // 2. Criar a conta após a validação do e-mail
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
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between p-6 font-sans">

      {/* Conteúdo Principal */}
      <main className="flex items-center justify-center my-auto py-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2">

          {/* Lado Esquerdo: Imagem */}
          <div className="relative hidden min-h-[600px] overflow-hidden bg-[#F4EBE1] md:block">
            <Image
              src="/images/login.jpg"
              alt="Caixa de doces artesanais da Doce Momento"
              fill
              sizes="(max-width: 768px) 0px, 50vw"
              className="object-cover object-center"
              priority
            />
          </div>

          {/* Lado Direito: Formulário */}
          <div className="p-8 md:p-10 flex flex-col justify-center">

            {/* Abas Entrar / Criar Conta */}
            <div className="flex bg-[#F4EBE1] p-1 rounded-full mb-6">
              <Link
                href="/login"
                className="w-1/2 text-center py-2 text-xs font-semibold text-gray-600 rounded-full"
              >
                Entrar
              </Link>

              <div className="w-1/2 text-center py-2 text-xs font-semibold bg-white text-[#3D2314] rounded-full shadow-sm">
                Criar conta
              </div>
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

            {error && (
              <div className="bg-red-50 text-red-500 p-2.5 rounded mb-4 text-xs text-center">
                {error}
              </div>
            )}

            {step === 'form' ? (
              <form onSubmit={handleStartRegister} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Nome completo *
                  </label>

                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#D9537A]"
                    placeholder="Maria Silva"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      E-mail *
                    </label>

                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#D9537A]"
                      placeholder="maria@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      WhatsApp *
                    </label>

                    <input
                      type="text"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      inputMode="numeric"
                      maxLength={15}
                      className="w-full p-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#D9537A]"
                      placeholder="(92) 99999-9999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      Senha *
                    </label>

                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#D9537A]"
                      placeholder="********"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      Confirmar senha *
                    </label>

                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#D9537A]"
                      placeholder="********"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#D9537A] hover:bg-[#c2466a] text-white font-medium py-2.5 rounded transition duration-200 text-xs mt-3 shadow-sm"
                >
                  {loading ? 'A enviar código...' : 'Continuar e Enviar Código'}
                </button>
              </form>
            ) : (
              <form
                    onSubmit={(e) => {
                      console.log('Formulário de verificação submetido');
                      handleVerifyAndRegister(e);
                    }}
                    className="space-y-3"
                  >
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Código de Verificação (6 dígitos) *
                  </label>

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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded transition duration-200 text-xs mt-3 shadow-sm"
                >
                  {loading
                    ? 'A verificar e criar conta...'
                    : 'Verificar Código e Criar Conta'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="w-full text-center text-xs text-gray-500 hover:underline mt-2"
                >
                  Voltar e alterar dados
                </button>
              </form>
            )}

            <p className="text-center text-[11px] text-gray-500 mt-4">
              Já tem uma conta?{' '}
              <Link
                href="/login"
                className="text-[#D9537A] font-semibold hover:underline"
              >
                Faça login
              </Link>
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
