import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const VerificationCodePage = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleLogin = async () => {
    if (!code.trim()) {
      alert('Пожалуйста, введите код подтверждения');
      return;
    }

    const email = location.state?.email;
    if (!email) {
      alert('Ошибка: Email не передан. Вернитесь на страницу входа.');
      navigate('/');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8081/api/v1/mail/verify', {
        email,
        code,
      });

      const { firstName, lastName } = response.data;
      alert(`Добро пожаловать, ${firstName} ${lastName}! Вы успешно подтвердили код.`);
      navigate('/date-picker');
    } catch (error) {
      console.error('Ошибка при проверке кода:', error.response ? error.response.data : error.message);
      alert('Неверный код или произошла ошибка. Попробуйте снова.');
    } finally {
      setIsLoading(false);
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
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2 2 .896 2 2 2zm0 2c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4z"></path>
            </svg>
            <input
              type="text"
              id="code"
              value={code}
              onChange={handleCodeChange}
              placeholder="Введите код"
              className="w-full outline-none text-gray-700"
              disabled={isLoading}
            />
          </div>
        </div>
        <button
          onClick={handleLogin}
          className={`w-full py-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-semibold rounded-lg transition-all duration-300 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-teal-600 hover:to-teal-800'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Загрузка...' : 'Войти'}
        </button>
      </div>
    </div>
  );
};

export default VerificationCodePage;