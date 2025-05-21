import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LoginClient = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Здесь можно добавить логику проверки данных (например, валидацию ФИО и email)
    navigate('/verify-code'); // Перенаправление на страницу VerificationCodePage
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-300">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-teal-600 mb-6">Вход</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="text">
            ФИО
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg p-2">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2 2 .896 2 2 2zm0 2c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4z"></path>
            </svg>
            <input
              type="text"
              id="text"
              placeholder="Введите ФИО"
              className="w-full outline-none text-gray-700"
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
            Почта
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg p-2 mb-2">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12h2a4 4 0 0 0 0-8h-2m-6 0H6a4 4 0 0 0 0 8h2m2 0v6a4 4 0 0 0 8 0v-6m-8 0h4"></path>
            </svg>
            <input
              type="email"
              id="email"
              placeholder="Введите email"
              className="w-full outline-none text-gray-700"
            />
          </div>
          <Link to="/employee-login" className="text-teal-600 hover:text-teal-800 text-sm underline">
            Сотрудник
          </Link>
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

export default LoginClient;