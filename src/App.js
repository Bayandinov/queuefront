import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import LoginClient from './LoginClient';
import DatePickerPage from './DatePickerPage';
import EmployeeLoginPage from './EmployeeLoginPage';
import GuestServicePage from './GuestServicePage';
import VerificationCodePage from './VerificationCodePage';
import QueueBoard from './QueueBoard';
import AdminPanelPage from './AdminPanelPage';
import './App.css';
import { saveAuthData, clearAuthData } from './store/authSlice';
import axios from 'axios';

function App() {
  const dispatch = useDispatch();
  const { authData, isAuthenticated } = useSelector((state) => state.auth); // Извлекаем authData
  const { jwtToken, id: userId } = authData || {}; // Деструктурируем из authData

  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки

  // Логируем состояние для отладки
  console.log('App state:', { authData, isAuthenticated, jwtToken, userId });

  // Загрузка токена из localStorage при старте
  useEffect(() => {
    const authDataFromStorage = localStorage.getItem('authData');
    if (authDataFromStorage && !jwtToken) {
      try {
        const parsedAuthData = JSON.parse(authDataFromStorage);
        console.log('Загрузка authData из localStorage:', parsedAuthData);
        dispatch(saveAuthData(parsedAuthData));
      } catch (e) {
        console.error('Ошибка при загрузке authData:', e);
        dispatch(clearAuthData());
      }
    }
    setIsLoading(false);
  }, [dispatch, jwtToken]);

  // Защищённый маршрут
  const ProtectedRoute = ({ children }) => {
    console.log('ProtectedRoute check:', { isAuthenticated, jwtToken, userId });
    if (isLoading) {
      return <div>Загрузка...</div>;
    }
    if (!isAuthenticated || !jwtToken || !userId) {
      return <Navigate to="/employee-login" replace />;
    }
    return children;
  };

  // Проверка валидности токена при старте
  useEffect(() => {
    if (jwtToken && userId && isAuthenticated) {
      axios
        .get('http://localhost:8081/api/v1/employee/queue', {
          headers: { Authorization: `Bearer ${jwtToken}` },
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            console.log('Токен недействителен, очищаем состояние');
            dispatch(clearAuthData());
            localStorage.removeItem('authData');
          }
        });
    }
  }, [jwtToken, userId, isAuthenticated, dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginClient />} />
        <Route path="/employee-login" element={<EmployeeLoginPage />} />
        <Route path="/date-picker" element={<DatePickerPage />} />
        <Route path="/verify-code" element={<VerificationCodePage />} />
        <Route path="/dashboard" element={<QueueBoard />} />
        <Route
          path="/guest-service"
          element={
            <ProtectedRoute>
              <GuestServicePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute>
              <AdminPanelPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/employee-login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;