import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { saveAuthData } from './store/authSlice';

const API_BASE_URL = 'http://localhost:8081/api/v1';

const EmployeeLoginPage = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLoginChange = useCallback((e) => {
    setLogin(e.target.value);
    setError('');
  }, []);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
    setError('');
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = useCallback(async () => {
    if (!login.trim() || !password.trim()) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (!validateEmail(login)) {
      setError('Введите корректный email');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: login,
        password,
      });

      const authData = response.data;
      console.log('Успешный вход:', authData);

      // Сохранение данных в Redux
      const authPayload = {
        jwtToken: authData.jwtToken,
        id: authData.id,
        email: authData.email,
        role: {
          id: authData.role.id,
          name: authData.role.name,
        },
      };
      dispatch(saveAuthData(authPayload));

      // Сохранение в localStorage
      localStorage.setItem('authData', JSON.stringify(authPayload));

      // Перенаправление в зависимости от роли
      const redirectTo = authData.role.name === 'ADMIN' ? '/admin-panel' : '/guest-service';
      navigate(redirectTo);
    } catch (err) {
      const message =
        err.response?.status === 401
          ? 'Неверный логин или пароль'
          : err.response?.data?.message ||
            (err.code === 'ERR_NETWORK' ? 'Сервер недоступен. Проверьте подключение.' : 'Произошла ошибка при входе');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [login, password, dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-300">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-teal-600 mb-6">Вход для сотрудников</h2>
        {error && (
          <div className="mb-4 text-red-500 text-center flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="login">
            Логин
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg p-2">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12h2a4 4 0 0 0 0-8h-2m-6 0H6a4 4 0 0 0 0 8h2m2 0v6a4 4 0 0 0 8 0v-6m-8 0h4" />
            </svg>
            <input
              type="text"
              id="login"
              value={login}
              onChange={handleLoginChange}
              placeholder="Введите email"
              className="w-full outline-none text-gray-700"
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
            Пароль
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg p-2">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2zm0 2c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4z" />
            </svg>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Введите пароль"
              className="w-full outline-none text-gray-700"
              disabled={isLoading}
            />
          </div>
          <Link to="/" className="text-teal-600 hover:text-teal-800 text-sm underline mt-2 inline-block">
            Клиент
          </Link>
        </div>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={`w-full py-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-semibold rounded-lg transition-all duration-300 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-teal-600 hover:to-teal-800'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
              </svg>
              Вход...
            </span>
          ) : (
            'Войти'
          )}
        </button>
      </div>
    </div>
  );
};

export default EmployeeLoginPage;