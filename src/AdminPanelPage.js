  import React, { useState, useEffect, useCallback } from 'react';
  import { useSelector, useDispatch } from 'react-redux';
  import { useNavigate } from 'react-router-dom';
  import axios from 'axios';
  import { clearAuthData } from './store/authSlice';
  import { format } from 'date-fns';
  import { ru } from 'date-fns/locale';

  // Фиксированные роли на основе t_roles
  const ROLES = [
    { id: 1, name: 'EMPLOYEE', displayName: 'Сотрудник' },
    { id: 2, name: 'ADMIN', displayName: 'Админ' },
  ];

  const AdminPanelPage = () => {
    const [showQueue, setShowQueue] = useState(false);
    const [showEmployees, setShowEmployees] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [queueData, setQueueData] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLoadingQueue, setIsLoadingQueue] = useState(false);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
    const [isLoadingAddEmployee, setIsLoadingAddEmployee] = useState(false);
    const [isLoadingDelete, setIsLoadingDelete] = useState({});
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { jwtToken } = useSelector((state) => state.auth.authData || {});

    // Состояние для формы нового сотрудника
    const [newEmployee, setNewEmployee] = useState({
      lastName: '',
      firstName: '',
      middleName: '',
      phone: '',
      email: '',
      password: '',
      role: 1, // По умолчанию EMPLOYEE
    });

    // Централизованная функция для API-запросов
    const apiRequest = useCallback(
      async (method, url, data) => {
        try {
          const response = await axios({
            method,
            url: `http://localhost:8081${url}`,
            data,
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          return response.data;
        } catch (err) {
          const message =
            err.response?.status === 401
              ? 'Ошибка аутентификации. Пожалуйста, войдите снова.'
              : err.response?.data?.message ||
                (err.code === 'ERR_NETWORK' ? 'Сервер недоступен. Проверьте подключение.' : 'Произошла ошибка.');
          setError(message);
          if (err.response?.status === 401) {
            dispatch(clearAuthData());
            localStorage.removeItem('authData');
            navigate('/employee-login');
          }
          throw err;
        }
      },
      [jwtToken, dispatch, navigate]
    );

    // Загрузка данных очереди
    const fetchQueue = useCallback(async () => {
      if (!jwtToken) {
        setError('Токен отсутствует. Пожалуйста, войдите снова.');
        navigate('/employee-login');
        return;
      }

      setIsLoadingQueue(true);
      setError(null);
      try {
        const data = await apiRequest('get', '/api/v1/employee/queue/all');
        setQueueData(Array.isArray(data) ? data : []);
      } finally {
        setIsLoadingQueue(false);
      }
    }, [apiRequest, jwtToken, navigate]);

    // Загрузка данных сотрудников
    const fetchEmployees = useCallback(async () => {
      if (!jwtToken) {
        setError('Токен отсутствует. Пожалуйста, войдите снова.');
        navigate('/employee-login');
        return;
      }

      setIsLoadingEmployees(true);
      setError(null);
      try {
        const data = await apiRequest('get', '/api/v1/employee/employee/all');
        const formattedEmployees = Array.isArray(data)
          ? data.map((emp) => ({
              id: emp.id,
              fullName: `${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.trim(),
              number: `${emp.role.name === 'ADMIN' ? 'Админ' : 'Сотрудник'} №${emp.id}`,
              clientsServed: 0, // Заглушка
              workTime: '0 часов', // Заглушка
              date: format(new Date(), 'dd.MM.yyyy'), // Заглушка
              isOnline: emp.isOnline,
              email: emp.email,
              phone: emp.phone,
            }))
          : [];
        setEmployees(formattedEmployees);
      } finally {
        setIsLoadingEmployees(false);
      }
    }, [apiRequest, jwtToken, navigate]);

    // Удаление сотрудника
    const handleDeleteEmployee = useCallback(
      async (employeeId) => {
        if (employeeId === 1) {
          setError('Нельзя удалить пользователя с ID 1');
          return;
        }

        if (!window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
          return;
        }

        setIsLoadingDelete((prev) => ({ ...prev, [employeeId]: true }));
        setError(null);
        try {
          await apiRequest('delete', `/api/v1/employee/employee/${employeeId}`);
          setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
          console.log(`Сотрудник с ID ${employeeId} удален`);
        } catch (err) {
          // Ошибка уже обработана в apiRequest
        } finally {
          setIsLoadingDelete((prev) => ({ ...prev, [employeeId]: false }));
        }
      },
      [apiRequest]
    );

    // Вызов fetchQueue и fetchEmployees при открытии соответствующих вкладок
    useEffect(() => {
      if (showQueue) {
        fetchQueue();
      }
      if (showEmployees) {
        fetchEmployees();
      }
    }, [showQueue, showEmployees, fetchQueue, fetchEmployees]);

    // Очистка ошибки через 5 секунд
    useEffect(() => {
      if (error) {
        const timer = setTimeout(() => setError(null), 5000);
        return () => clearTimeout(timer);
      }
    }, [error]);

    // Форматирование времени из createdAt
    const formatCreatedTime = (createdAt) => {
      if (!createdAt) return 'Время не указано';
      try {
        return format(new Date(createdAt), 'HH:mm', { locale: ru });
      } catch {
        return 'Время не указано';
      }
    };

    // Форматирование даты
    const formatDate = (date) => {
      if (!date) return 'Дата не указана';
      try {
        return format(new Date(date), 'dd.MM.yyyy', { locale: ru });
      } catch {
        return 'Дата не указана';
      }
    };

    // Перевод статуса
    const translateStatus = (status) => {
      const statuses = {
        PENDING: 'Ожидает',
        CALLED: 'Вызван',
        ARRIVED: 'Пришел',
        NO_SHOW: 'Не пришел',
        SERVED: 'Обслужен',
      };
      return statuses[status] || '-';
    };

    // Обработка изменений в форме
    const handleInputChange = useCallback((e) => {
      const { name, value } = e.target;
      setNewEmployee((prev) => ({
        ...prev,
        [name]: name === 'role' ? parseInt(value, 10) : value,
      }));
    }, []);

    // Валидация формы
    const validateForm = () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!newEmployee.lastName.trim() || !newEmployee.firstName.trim()) {
        setError('Фамилия и имя обязательны');
        return false;
      }
      if (!emailRegex.test(newEmployee.email)) {
        setError('Некорректный email');
        return false;
      }
      if (!newEmployee.phone.trim()) {
        setError('Телефон обязателен');
        return false;
      }
      if (newEmployee.password.length < 6) {
        setError('Пароль должен содержать минимум 6 символов');
        return false;
      }
      if (![1, 2].includes(newEmployee.role)) {
        setError('Выберите корректную роль');
        return false;
      }
      return true;
    };

    // Добавление нового сотрудника
    const handleAddEmployee = useCallback(
      async (e) => {
        e.preventDefault();
        setError(null);
        if (!validateForm()) return;

        setIsLoadingAddEmployee(true);
        try {
          const payload = {
            lastName: newEmployee.lastName,
            firstName: newEmployee.firstName,
            middleName: newEmployee.middleName,
            phone: newEmployee.phone,
            email: newEmployee.email,
            password: newEmployee.password,
            role: newEmployee.role,
          };
          const newEmp = await apiRequest('post', '/api/v1/auth/register', payload);
          setEmployees((prev) => [
            ...prev,
            {
              id: newEmp.id,
              fullName: `${newEmp.lastName} ${newEmp.firstName} ${newEmp.middleName || ''}`.trim(),
              number: `${newEmp.role.name === 'ADMIN' ? 'Админ' : 'Сотрудник'} №${newEmp.id}`,
              clientsServed: 0,
              workTime: '0 часов',
              date: format(new Date(), 'dd.MM.yyyy'),
              isOnline: newEmp.isOnline || false,
              email: newEmp.email,
              phone: newEmp.phone,
            },
          ]);
          setNewEmployee({
            lastName: '',
            firstName: '',
            middleName: '',
            phone: '',
            email: '',
            password: '',
            role: 1,
          });
          setShowEditForm(false);
          console.log('Новый сотрудник добавлен:', newEmp);
        } catch (err) {
          // Ошибка уже обработана в apiRequest
        } finally {
          setIsLoadingAddEmployee(false);
        }
      },
      [apiRequest, newEmployee]
    );

    // Функции для кнопок
    const handleQueue = () => {
      setShowQueue(!showQueue);
      setShowEmployees(false);
      setShowEditForm(false);
    };

    const handleEmployee = () => {
      setShowEmployees(!showEmployees);
      setShowQueue(false);
      setShowEditForm(false);
    };

    const handleChange = () => {
      setShowEditForm(!showEditForm);
      setShowQueue(false);
      setShowEmployees(false);
    };

    return (
      <div className="min-h-screen bg-gray-200 flex flex-col items-center p-6">
        {/* Панель администратора с кнопками */}
        <div className="w-full max-w-4xl mb-6">
          <div className="flex justify-between space-x-4">
            <button
              onClick={handleQueue}
              className="flex-1 py-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all duration-300"
            >
              Очередь
            </button>
            <button
              onClick={handleEmployee}
              className="flex-1 py-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all duration-300"
            >
              Сотрудник
            </button>
            <button
              onClick={handleChange}
              className="flex-1 py-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all duration-300"
            >
              Изменение
            </button>
          </div>
        </div>

        {/* Отображение очереди */}
        {showQueue && (
          <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Очередь</h2>
            {error && (
              <div className="mb-4 text-red-500 text-center flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            {isLoadingQueue ? (
              <div className="text-center text-gray-600">
                <svg className="animate-spin h-8 w-8 mx-auto text-green-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                </svg>
                Загрузка...
              </div>
            ) : queueData.length === 0 ? (
              <p className="text-gray-600 text-center">Очередь пуста</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="p-3 text-left text-gray-700">№ Талона</th>
                      <th className="p-3 text-left text-gray-700">Клиент</th>
                      <th className="p-3 text-left text-gray-700">Время</th>
                      <th className="p-3 text-left text-gray-700">Цель</th>
                      <th className="p-3 text-left text-gray-700">Статус</th>
                      <th className="p-3 text-left text-gray-700">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueData.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3 text-gray-700">{item.id || '-'}</td>
                        <td className="p-3 text-gray-700">{item.client?.email || 'Клиент не указан'}</td>
                        <td className="p-3 text-gray-700">{item.timeSlot.slotTime || 'Время не указано'}</td>
                        <td className="p-3 text-gray-700">{item.target?.name || 'Цель не указана'}</td>
                        <td className="p-3 text-gray-700">{translateStatus(item.status)}</td>
                        <td className="p-3 text-gray-700">{formatDate(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Отображение сотрудников */}
        {showEmployees && (
          <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Сотрудники</h2>
            {error && (
              <div className="mb-4 text-red-500 text-center flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            {isLoadingEmployees ? (
              <div className="text-center text-gray-600">
                <svg className="animate-spin h-8 w-8 mx-auto text-green-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                </svg>
                Загрузка...
              </div>
            ) : employees.length === 0 ? (
              <p className="text-gray-600 text-center">Список сотрудников пуст</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b-2 border-gray-300 p-3 text-left text-gray-700">ФИО</th>
                      <th className="border-b-2 border-gray-300 p-3 text-left text-gray-700">Номер</th>
                      <th className="border-b-2 border-gray-300 p-3 text-left text-gray-700">Принято людей</th>
                      <th className="border-b-2 border-gray-300 p-3 text-left text-gray-700">Время работы</th>
                      <th className="border-b-2 border-gray-300 p-3 text-left text-gray-700">Дата</th>
                      <th className="border-b-2 border-gray-300 p-3 text-left text-gray-700">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="border-b border-gray-200 p-3 text-gray-700">{employee.fullName}</td>
                        <td className="border-b border-gray-200 p-3 text-gray-700">{employee.number}</td>
                        <td className="border-b border-gray-200 p-3 text-gray-700">{employee.clientsServed}</td>
                        <td className="border-b border-gray-200 p-3 text-gray-700">{employee.workTime}</td>
                        <td className="border-b border-gray-200 p-3 text-gray-700">{employee.date}</td>
                        <td className="border-b border-gray-200 p-3 text-gray-700">
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            disabled={isLoadingDelete[employee.id] || employee.id === 1}
                            className={`py-1 px-3 bg-red-500 text-white font-semibold rounded-lg transition-all duration-300 ${
                              isLoadingDelete[employee.id] || employee.id === 1
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-red-600'
                            }`}
                          >
                            {isLoadingDelete[employee.id] ? (
                              <span className="flex items-center">
                                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                                </svg>
                                Удаление...
                              </span>
                            ) : (
                              'Удалить'
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Форма для создания сотрудника */}
        {showEditForm && (
          <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Добавить нового сотрудника</h2>
            {error && (
              <div className="mb-4 text-red-500 text-center flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Фамилия</label>
                <input
                  type="text"
                  name="lastName"
                  value={newEmployee.lastName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Имя</label>
                <input
                  type="text"
                  name="firstName"
                  value={newEmployee.firstName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Отчество</label>
                <input
                  type="text"
                  name="middleName"
                  value={newEmployee.middleName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Телефон</label>
                <input
                  type="tel"
                  name="phone"
                  value={newEmployee.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Почта</label>
                <input
                  type="email"
                  name="email"
                  value={newEmployee.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Пароль</label>
                <input
                  type="password"
                  name="password"
                  value={newEmployee.password}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Роль</label>
                <select
                  name="role"
                  value={newEmployee.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  {ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoadingAddEmployee}
                className={`py-2 px-4 bg-green-500 text-white font-semibold rounded-lg transition-all duration-300 ${
                  isLoadingAddEmployee ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
                }`}
              >
                {isLoadingAddEmployee ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                    </svg>
                    Добавление...
                  </span>
                ) : (
                  'Добавить сотрудника'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  export default AdminPanelPage;