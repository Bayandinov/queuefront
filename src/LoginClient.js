import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const LoginClient = () => {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!lastName.trim() || !firstName.trim() || !email.trim()) {
      alert('Введите корректные Фамилию, Имя и email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8081/api/v1/mail/generate', {
        email,
        firstName,
        lastName,
        middleName,
      });

      // Передаём email через состояние маршрутизации
      navigate('/verify-code', { state: { email } });
    } catch (error) {
      console.error('Ошибка при отправке кода:', error.response ? error.response.data : error.message);
      alert('Не удалось отправить код. Проверьте введённые данные.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-300">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-teal-600 mb-6">Вход</h2>
        {/* Фамилия */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Фамилия</label>
          <input
            type="text"
            placeholder="Введите Фамилию"
            className="w-full border border-gray-300 rounded-lg p-2 outline-none text-gray-700"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {/* Имя */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Имя</label>
          <input
            type="text"
            placeholder="Введите Имя"
            className="w-full border border-gray-300 rounded-lg p-2 outline-none text-gray-700"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {/* Отчество */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Отчество</label>
          <input
            type="text"
            placeholder="Введите Отчество"
            className="w-full border border-gray-300 rounded-lg p-2 outline-none text-gray-700"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {/* Email */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Почта</label>
          <input
            type="email"
            placeholder="Введите email"
            className="w-full border border-gray-300 rounded-lg p-2 outline-none text-gray-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <Link to="/employee-login" className="text-teal-600 hover:text-teal-800 text-sm underline mt-2 inline-block">
            Сотрудник
          </Link>
        </div>
        <button
          onClick={handleSendCode}
          className={`w-full py-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-semibold rounded-lg transition-all duration-300 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-teal-600 hover:to-teal-800'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Загрузка...' : 'Получить код'}
        </button>
      </div>
    </div>
  );
};

export default LoginClient;