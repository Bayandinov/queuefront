import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VerificationCodePage = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleLogin = () => {
    // Простая проверка: код не должен быть пустым
    if (code.trim()) {
      navigate('/date-picker'); // Перенаправление на страницу DatePickerPage
    } else {
      alert('Пожалуйста, введите код подтверждения');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-300">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-teal-600 mb-6">Подтверждение</h2>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="code">
            Введите код подтверждения
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg p-2">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2 2 .896 2 2 2zm0 2c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4z"></path>
            </svg>
            <input
              type="text"
              id="code"
              value={code}
              onChange={handleCodeChange}
              placeholder="Введите код"
              className="w-full outline-none text-gray-700"
            />
          </div>
        </div>
        <button
          onClick={handleLogin}
          className="w-full py-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300"
        >
          Войти
        </button>
      </div>
    </div>
  );
};

export default VerificationCodePage;