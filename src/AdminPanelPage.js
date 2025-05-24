import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { clearAuthData } from './store/authSlice';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const ROLES = [
  { id: 1, name: 'EMPLOYEE', displayName: 'Сотрудник' },
  { id: 2, name: 'ADMIN', displayName: 'Админ' },
];

const AdminPanelPage = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [queueData, setQueueData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tables, setTables] = useState([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isLoadingAddEmployee, setIsLoadingAddEmployee] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingAddTable, setIsLoadingAddTable] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState({});
  const [isLoadingDeleteTable, setIsLoadingDeleteTable] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { jwtToken } = useSelector((state) => state.auth.authData || {});

  // Состояние для формы нового сотрудника
  const [newEmployee, setNewEmployee] = useState({
    lastName: '', firstName: '', middleName: '', phone: '', email: '', password: '', role: 1,
  });

  // Состояние для формы нового стола
  const [newTable, setNewTable] = useState({ number: '' });

  // Централизованная функция для API-запросов
  const apiRequest = useCallback(async (method, url, data) => {
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
          : err.response?.data?.message || 'Произошла ошибка.';
      setError(message);
      if (err.response?.status === 401) {
        dispatch(clearAuthData());
        localStorage.removeItem('authData');
        navigate('/employee-login');
      }
      throw err;
    }
  }, [jwtToken, dispatch, navigate]);

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
    } catch (err) {
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
          clientsServed: 0,
          workTime: '0 часов',
          date: format(new Date(), 'dd.MM.yyyy'),
          isOnline: emp.isOnline,
          email: emp.email,
          phone: emp.phone,
        }))
        : [];
      setEmployees(formattedEmployees);
    } catch (err) {
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [apiRequest, jwtToken, navigate]);

  // Загрузка данных столов
  const fetchTables = useCallback(async () => {
    if (!jwtToken) {
      setError('Токен отсутствует. Пожалуйста, войдите снова.');
      navigate('/employee-login');
      return;
    }
    setIsLoadingTables(true);
    setError(null);
    try {
      const data = await apiRequest('get', '/api/v1/table/all');
      const formattedTables = Array.isArray(data)
        ? data.map((table) => ({
          id: table.id ?? 'N/A',
          number: table.number ?? 'N/A',
          user: table.user ? `${table.user.lastName || ''} ${table.user.firstName || ''}`.trim() : 'Нет пользователя',
          status: table.status || 'Не указан',
        }))
        : [];
      setTables(formattedTables);
    } catch (err) {
    } finally {
      setIsLoadingTables(false);
    }
  }, [apiRequest, jwtToken, navigate]);

  // Удаление сотрудника
  const handleDeleteEmployee = useCallback(async (employeeId) => {
    if (employeeId === 1) {
      setError('Нельзя удалить пользователя с ID 1');
      return;
    }
    if (!window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;
    setIsLoadingDelete((prev) => ({ ...prev, [employeeId]: true }));
    try {
      await apiRequest('delete', `/api/v1/employee/employee/${employeeId}`);
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    } catch (err) {
    } finally {
      setIsLoadingDelete((prev) => ({ ...prev, [employeeId]: false }));
    }
  }, [apiRequest]);

  // Удаление стола
  const handleDeleteTable = useCallback(async (tableId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот стол?')) return;
    setIsLoadingDeleteTable((prev) => ({ ...prev, [tableId]: true }));
    try {
      await apiRequest('delete', `/api/v1/table/${tableId}`);
      setTables((prev) => prev.filter((table) => table.id !== tableId));
    } catch (err) {
    } finally {
      setIsLoadingDeleteTable((prev) => ({ ...prev, [tableId]: false }));
    }
  }, [apiRequest]);

  // Обработка изменений в форме сотрудника
  const handleEmployeeInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({
      ...prev,
      [name]: name === 'role' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Обработка изменений в форме стола
  const handleTableInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewTable((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Валидация формы сотрудника
  const validateEmployeeForm = () => {
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

  // Валидация формы стола
  const validateTableForm = () => {
    if (!newTable.number.trim() || isNaN(newTable.number) || parseInt(newTable.number) <= 0) {
      setError('Введите корректный номер стола (положительное число)');
      return false;
    }
    return true;
  };

  // Добавление нового сотрудника
  const handleAddEmployee = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateEmployeeForm()) return;
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
        lastName: '', firstName: '', middleName: '', phone: '', email: '', password: '', role: 1,
      });
    } catch (err) {
    } finally {
      setIsLoadingAddEmployee(false);
    }
  }, [apiRequest, newEmployee]);

  // Добавление нового стола
  const handleAddTable = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateTableForm()) return;
    setIsLoadingAddTable(true);
    try {
      const payload = { number: parseInt(newTable.number) };
      const newTableData = await apiRequest('post', '/api/v1/table/add', payload);
      setTables((prev) => [
        ...prev,
        {
          id: newTableData.id || Date.now(),
          number: parseInt(newTable.number),
          user: null,
          status: 'AVAILABLE',
        },
      ]);
      setNewTable({ number: '' });
    } catch (err) {
    } finally {
      setIsLoadingAddTable(false);
    }
  }, [apiRequest, newTable]);

  // Загрузка данных при переключении вкладок
  useEffect(() => {
    if (activeTab === 'queue') fetchQueue();
    if (activeTab === 'employees') fetchEmployees();
    if (activeTab === 'tables') fetchTables();
  }, [activeTab, fetchQueue, fetchEmployees, fetchTables]);

  // Очистка ошибки через 5 секунд
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Форматирование времени
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 font-sans">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Панель администратора</h1>

      {/* Вкладки */}
      <div className="w-full max-w-6xl mb-8 bg-white rounded-lg shadow-md">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'queue', label: 'Очередь' },
            { id: 'employees', label: 'Сотрудники' },
            { id: 'tables', label: 'Столы' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 px-6 text-center font-semibold text-lg transition-colors duration-300 ${activeTab === tab.id
                  ? 'border-b-4 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-green-600'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Отображение ошибки */}
      {error && (
        <div className="w-full max-w-6xl mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center shadow-sm">
          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Очередь */}
      {activeTab === 'queue' && (
        <div className="w-full max-w-6xl bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Очередь</h2>
          {isLoadingQueue ? (
            <div className="text-center text-gray-600">
              <svg className="animate-spin h-8 w-8 mx-auto text-green-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
              </svg>
              <span>Загрузка...</span>
            </div>
          ) : queueData.length === 0 ? (
            <p className="text-gray-600 text-center">Очередь пуста</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {['№ Талона', 'Клиент', 'Время', 'Цель', 'Статус', 'Дата'].map((header, index) => (
                      <th key={index} className="p-4 text-left text-gray-700 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queueData.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 text-gray-700">{item.id || '-'}</td>
                      <td className="p-4 text-gray-700">{item.client?.email || 'Клиент не указан'}</td>
                      <td className="p-4 text-gray-700">{item.timeSlot.slotTime || 'Время не указано'}</td>
                      <td className="p-4 text-gray-700">{item.target?.name || 'Цель не указана'}</td>
                      <td className="p-4 text-gray-700">{translateStatus(item.status)}</td>
                      <td className="p-4 text-gray-700">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Сотрудники */}
      {activeTab === 'employees' && (
        <div className="w-full max-w-6xl bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Управление сотрудниками</h2>
          <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[
              { label: 'Фамилия', name: 'lastName', type: 'text', required: true },
              { label: 'Имя', name: 'firstName', type: 'text', required: true },
              { label: 'Отчество', name: 'middleName', type: 'text', required: false },
              { label: 'Телефон', name: 'phone', type: 'tel', required: true },
              { label: 'Почта', name: 'email', type: 'email', required: true },
              { label: 'Пароль', name: 'password', type: 'password', required: true },
            ].map((field, index) => (
              <div key={index}>
                <label className="block text-gray-700 text-sm font-semibold mb-2">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={newEmployee[field.name]}
                  onChange={handleEmployeeInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  required={field.required}
                />
              </div>
            ))}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Роль</label>
              <select
                name="role"
                value={newEmployee.role}
                onChange={handleEmployeeInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              >
                {ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isLoadingAddEmployee}
                className={`w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg transition-all duration-300 ${isLoadingAddEmployee ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700 hover:shadow-lg'
                  }`}
              >
                {isLoadingAddEmployee ? (
                  <span className="flex items-center justify-center">
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
            </div>
          </form>
          {isLoadingEmployees ? (
            <div className="text-center text-gray-600">
              <svg className="animate-spin h-8 w-8 mx-auto text-green-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
              </svg>
              <span>Загрузка...</span>
            </div>
          ) : employees.length === 0 ? (
            <p className="text-gray-600 text-center">Список сотрудников пуст</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {['ФИО', 'Номер', 'Принято людей', 'Время работы', 'Дата', 'Действия'].map((header, index) => (
                      <th key={index} className="p-4 text-left text-gray-700 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 text-gray-700">{employee.fullName}</td>
                      <td className="p-4 text-gray-700">{employee.number}</td>
                      <td className="p-4 text-gray-700">{employee.clientsServed}</td>
                      <td className="p-4 text-gray-700">{employee.workTime}</td>
                      <td className="p-4 text-gray-700">{employee.date}</td>
                      <td className="p-4 text-gray-700">
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          disabled={isLoadingDelete[employee.id] || employee.id === 1}
                          className={`py-2 px-4 bg-red-600 text-white font-semibold rounded-lg transition-all duration-300 ${isLoadingDelete[employee.id] || employee.id === 1
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-red-700 hover:shadow-lg'
                            }`}
                        >
                          {isLoadingDelete[employee.id] ? (
                            <span className="flex items-center">
                              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentпримерColor" strokeWidth="4" fill="none" />
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

      {/* Столы */}
      {activeTab === 'tables' && (
        <div className="w-full max-w-6xl bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Управление столами</h2>
          <form onSubmit={handleAddTable} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Номер стола</label>
                <input
                  type="number"
                  name="number"
                  value={newTable.number}
                  onChange={handleTableInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                  min="1"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isLoadingAddTable}
                  className={`py-3 px-6 bg-green-600 text-white font-semibold rounded-lg transition-all duration-300 ${isLoadingAddTable ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700 hover:shadow-lg'
                    }`}
                >
                  {isLoadingAddTable ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                      </svg>
                      Добавление...
                    </span>
                  ) : (
                    'Добавить стол'
                  )}
                </button>
              </div>
            </div>
          </form>
          {isLoadingTables ? (
            <div className="text-center text-gray-600">
              <svg className="animate-spin h-8 w-8 mx-auto text-green-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
              </svg>
              <span>Загрузка...</span>
            </div>
          ) : tables.length === 0 ? (
            <p className="text-gray-600 text-center">Список столов пуст</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {['ID', 'Номер стола', 'Пользователь', 'Статус', 'Действия'].map((header, index) => (
                      <th key={index} className="p-4 text-left text-gray-700 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tables.map((table) => (
                    <tr key={table.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 text-gray-700">{table.id || '-'}</td>
                      <td className="p-4 text-gray-700">{table.number || '-'}</td>
                      <td className="p-4 text-gray-700">{table.user || 'Нет пользователя'}</td>
                      <td className="p-4 text-gray-700">{table.status || 'Не указан'}</td>
                      <td className="p-4 text-gray-700">
                        <button
                          onClick={() => handleDeleteTable(table.id)}
                          disabled={isLoadingDeleteTable[table.id]}
                          className={`py-2 px-4 bg-red-600 text-white font-semibold rounded-lg transition-all duration-300 ${isLoadingDeleteTable[table.id]
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-red-700 hover:shadow-lg'
                            }`}
                        >
                          {isLoadingDeleteTable[table.id] ? (
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
    </div>
  );
};

export default AdminPanelPage;