'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // auto-submit ao digitar 4 dígitos
  useEffect(() => {
    if (code.length === 4) {
      handleSubmit();
    }
  }, [code]);

  const handleDigit = (digit: string) => {
    if (code.length < 4) {
      setError('');
      setCode(code + digit);
    }
  };

  const handleBackspace = () => {
    if (code.length > 0) {
      setError('');
      setCode(code.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    const res = await signIn('credentials', {
      redirect: false,
      code
    });
    if (res?.error) {
      setError('Código inválido');
      setCode('');
    } else {
      router.replace('/');
    }
  };

  const renderDots = () => (
    <div className="flex justify-center mb-12 space-x-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={i < code.length ? 'w-5 h-5 rounded-full bg-black' : 'w-5 h-5 rounded-full border-2 border-gray-300'}
        />
      ))}
    </div>
  );

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-80 p-8 bg-white rounded-xl">
        {/* A imagem foi removida */}

        {renderDots()}

        {error && (
          <p className="text-red-600 text-center mb-6">{error}</p>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="aspect-square flex items-center justify-center bg-black text-white text-2xl rounded-lg"
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="aspect-square flex items-center justify-center bg-black text-white text-2xl rounded-lg"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="aspect-square flex items-center justify-center text-gray-500 text-2xl rounded-lg"
          >
            ⌫
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={code.length !== 4}
          className={`w-full py-4 text-white text-lg font-medium rounded-lg transition ${code.length === 4 ? 'bg-black' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          Entrar
        </button>
      </div>
    </main>
  );
}
