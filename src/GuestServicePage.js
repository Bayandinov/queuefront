import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { HiUsers, HiChartBar, HiMenu, HiEye, HiExclamationCircle } from 'react-icons/hi';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { clearAuthData } from './store/authSlice';
import { setSelectedTable, setAvailableTables, setTableError, clearTableData } from './store/tableSlice';

const GuestServicePage = () => {
  const [status, setStatus] = useState('Обслуживание');
  const [queueData, setQueueData] = useState([]);
  const [report, setReport] = useState({
    averageWaitingTimeSeconds: 0,
    maxWaitingTimeSeconds: 0,
    minWaitingTimeSeconds: 0,
    completedClients: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { jwtToken, id: userId } = useSelector((state) => state.auth.authData || {});
  const { selectedTable, availableTables, tableError } = useSelector((state) => state.table);

  // Централизованная обработка API-запросов
  const apiRequest = useCallback(
    async (method, url, data) => {
      try {
        console.log(`Sending ${method} request to ${url}:`, data);
        const response = await axios({
          method,
          url: `http://localhost:8081/api/v1/employee${url}`,
          data,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        console.log(`Response from ${url}:`, response.data);
        return response.data;
      } catch (err) {
        const message =
          err.response?.status === 403
            ? `Доступ запрещён для ${url}. Проверьте права доступа или токен.`
            : err.response?.status === 401
              ? 'Ошибка аутентификации. Пожалуйста, войдите снова.'
              : err.response?.data?.message ||
                (err.code === 'ERR_NETWORK' ? 'Сервер недоступен. Проверьте подключение.' : `Произошла ошибка при запросе к ${url}.`);
        setError(message);
        if (err.response?.status === 401) {
          dispatch(clearAuthData());
          navigate('/employee-login');
        }
        throw err;
      }
    },
    [jwtToken, dispatch, navigate]
  );

  // Перевод статуса
  const translateStatus = (status) => {
    const statuses = {
      PENDING: 'Ожидает',
      CALLED: 'Вызван',
      ARRIVED: 'Пришел',
      NO_SHOW: 'Не пришел',
      SERVED: 'Обслужен',
      RE_CALLED: 'Повторно вызван',
    };
    return statuses[status] || '-';
  };

  // Стили статуса
  const getStatusStyles = (status) => {
    const styles = {
      PENDING: 'bg-blue-100 text-blue-800',
      CALLED: 'bg-orange-100 text-orange-800',
      ARRIVED: 'bg-green-100 text-green-800',
      NO_SHOW: 'bg-red-100 text-red-800',
      SERVED: 'bg-purple-100 text-purple-800',
      RE_CALLED: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  // Форматирование времени
  const formatTime = (dateTime) => {
    if (!dateTime) return '00:00:00';
    try {
      return format(parseISO(dateTime), 'HH:mm:ss', { locale: ru });
    } catch {
      return '00:00:00';
    }
  };

  // Форматирование времени слота
  const formatSlotTime = (slotTime) => {
    if (!slotTime || slotTime.hour == null || slotTime.minute == null) return 'Время не указано';
    return `${String(slotTime.hour).padStart(2, '0')}:${String(slotTime.minute).padStart(2, '0')}`;
  };

  // Форматирование даты
  const formatDate = (date) => {
    if (!date) return format(new Date(), 'dd.MM.yyyy', { locale: ru });
    try {
      return format(parseISO(date), 'dd.MM.yyyy', { locale: ru });
    } catch {
      return format(new Date(), 'dd.MM.yyyy', { locale: ru });
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds < 0) return '0 мин 0 сек';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes} мин ${remainingSeconds} сек`;
  };

  // Проверка совпадения стола
  const canServiceClient = (queueItem) => {
    if (!selectedTable?.number || !queueItem?.table?.number) return false;
    return selectedTable.number === queueItem.table.number;
  };

  // Проверка, есть ли клиент в статусе ARRIVED за текущим столом
  const hasArrivedClient = () => {
    return queueData.some((item) => item.status === 'ARRIVED' && canServiceClient(item));
  };

  // Загрузка данных
  const fetchData = useCallback(async () => {
    if (!jwtToken || !userId) {
      setError('Токен или ID сотрудника отсутствует.');
      navigate('/employee-login');
      return;
    }

    setIsLoading(true);
    try {
      const [queueResponse, tablesResponse, reportResponse] = await Promise.all([
        apiRequest('get', `/queue?userId=${userId}`),
        apiRequest('get', '/tables'),
        apiRequest('get', `/queue/report?userId=${userId}`),
      ]);

      const newQueueData = Array.isArray(queueResponse) ? queueResponse : [];
      setQueueData(newQueueData);
      dispatch(setAvailableTables(Array.isArray(tablesResponse) ? tablesResponse : []));
      setReport(reportResponse || { averageWaitingTimeSeconds: 0, maxWaitingTimeSeconds: 0, minWaitingTimeSeconds: 0, completedClients: 0 });

      const userTable = tablesResponse.find((table) => table.user?.id === userId);
      if (userTable) dispatch(setSelectedTable(userTable));
    } catch (err) {
      console.error('Ошибка при загрузке данных:', err);
      setError('Не удалось загрузить данные.');
    } finally {
      setIsLoading(false);
    }
  }, [jwtToken, userId, dispatch, apiRequest]);

  // Периодическое обновление
  useEffect(() => {
    let isMounted = true;
    const updateData = async () => {
      if (!isMounted) return;
      await fetchData();
      setTimeout(updateData, 30000);
    };
    updateData();
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  // Очистка ошибки через 5 секунд
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Обработчик выхода
  const handleLogout = async () => {
    if (selectedTable?.id) {
      try {
        await apiRequest('post', '/tables/release', { tableId: selectedTable.id });
      } catch (err) {
        console.error('Ошибка при освобождении стола:', err);
      }
    }
    dispatch(clearAuthData());
    dispatch(clearTableData());
    localStorage.removeItem('authToken');
    navigate('/employee-login');
  };

  // Выбор стола
  const handleTableSelect = async (e) => {
    const tableId = parseInt(e.target.value);
    if (!tableId) return;

    setActionLoading(true);
    try {
      const table = await apiRequest('post', '/tables', { tableId });
      dispatch(setSelectedTable(table));
      toast.success(`Вы выбрали стол №${table.number}`);
    } catch (err) {
      console.error('Ошибка при выборе стола:', err);
      setError('Не удалось выбрать стол.');
    } finally {
      setActionLoading(false);
    }
  };

  // Вызов клиента
  const handleCallClient = async (queueId) => {
    if (!selectedTable?.id) {
      setError('Выберите свой стол перед вызовом клиента.');
      return;
    }

    const queueItem = queueData.find((item) => item.id === queueId);
    if (!queueItem) {
      setError('Клиент не найден.');
      return;
    }

    if (queueItem.status !== 'PENDING') {
      setError('Клиент не находится в статусе "Ожидает".');
      return;
    }

    if (queueItem.table && !canServiceClient(queueItem)) {
      setError('Этот клиент назначен на другой стол.');
      return;
    }

    const calledForThisTable = queueData.find(
      (item) => (item.status === 'CALLED' || item.status === 'RE_CALLED') && canServiceClient(item)
    );
    if (calledForThisTable) {
      setError('У вас уже есть вызванный клиент за вашим столом. Завершите его обслуживание.');
      return;
    }

    if (hasArrivedClient()) {
      setError('Завершите обслуживание текущего клиента перед вызовом следующего.');
      return;
    }

    setActionLoading(true);
    try {
      console.log('Calling client with:', { queueId, tableId: selectedTable.id });
      const response = await apiRequest('post', '/queue/call', { queueId, tableId: selectedTable.id });
      console.log('Call response:', response);
      await fetchData();
      toast.success(`Клиент №${queueId} вызван к вашему столу №${selectedTable.number}`);
    } catch (err) {
      console.error('Ошибка при вызове клиента:', err);
      setError('Не удалось вызвать клиента: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Повторный вызов
  const handleRecallClient = async (queueId) => {
    const queueItem = queueData.find((item) => item.id === queueId);
    if (!queueItem) {
      setError('Клиент не найден.');
      return;
    }

    if (!canServiceClient(queueItem)) {
      setError('Вы не можете обслуживать клиента за другим столом.');
      return;
    }

    if (queueItem.status !== 'CALLED') {
      setError('Клиент не находится в статусе "Вызван".');
      return;
    }

    if (!selectedTable?.id) {
      setError('Выберите стол перед повторным вызовом клиента.');
      return;
    }

    if (hasArrivedClient()) {
      setError('Завершите обслуживание текущего клиента перед повторным вызовом.');
      return;
    }

    setActionLoading(true);
    try {
      console.log('Recalling client with:', { queueId, tableId: selectedTable.id });
      const response = await apiRequest('post', '/queue/re-call', {
        queueId,
        tableId: selectedTable.id,
      });
      console.log('Re-call response:', response);
      await fetchData();
      toast.success(`Клиент №${queueId} повторно вызван к вашему столу №${selectedTable.number}`);
    } catch (err) {
      console.error('Ошибка при повторном вызове клиента:', err);
      setError('Не удалось выполнить повторный вызов: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Клиент пришел
  const handleClientArrived = async (queueId) => {
    const queueItem = queueData.find((item) => item.id === queueId);
    if (!queueItem) {
      setError('Клиент не найден.');
      return;
    }

    if (!canServiceClient(queueItem)) {
      setError('Вы не можете обслуживать клиента за другим столом.');
      return;
    }

    if (queueItem.status !== 'CALLED' && queueItem.status !== 'RE_CALLED') {
      setError('Клиент не находится в статусе "Вызван" или "Повторно вызван".');
      return;
    }

    setActionLoading(true);
    try {
      await apiRequest('post', '/queue/arrived', { queueId });
      await fetchData();
      toast.success(`Клиент №${queueId} отмечен как прибывший к вашему столу №${selectedTable.number}`);
    } catch (err) {
      console.error('Ошибка при отметке прибытия:', err);
      setError('Не удалось отметить прибытие.');
    } finally {
      setActionLoading(false);
    }
  };

  // Клиент не пришел
  const handleClientNoShow = async (queueId) => {
    const queueItem = queueData.find((item) => item.id === queueId);
    if (!queueItem) {
      setError('Клиент не найден.');
      return;
    }

    if (!canServiceClient(queueItem)) {
      setError('Вы не можете обслуживать клиента за другим столом.');
      return;
    }

    if (queueItem.status !== 'CALLED' && queueItem.status !== 'RE_CALLED') {
      setError('Клиент не находится в статусе "Вызван" или "Повторно вызван".');
      return;
    }

    setActionLoading(true);
    try {
      await apiRequest('post', '/queue/no-show', { queueId });
      await fetchData();
      toast.success(`Клиент №${queueId} отмечен как "Не пришел" для вашего стола №${selectedTable.number}`);
    } catch (err) {
      console.error('Ошибка при отметке "Не пришел":', err);
      setError('Не удалось отметить "Не пришел".');
    } finally {
      setActionLoading(false);
    }
  };

  // Клиент обслужен
  const handleClientServed = async (queueId) => {
    const queueItem = queueData.find((item) => item.id === queueId);
    if (!queueItem) {
      setError('Клиент не найден.');
      return;
    }

    if (!canServiceClient(queueItem)) {
      setError('Вы не можете обслуживать клиента за другим столом.');
      return;
    }

    if (queueItem.status !== 'ARRIVED') {
      setError('Клиент не находится в статусе "Пришел".');
      return;
    }

    setActionLoading(true);
    try {
      await apiRequest('post', '/queue/served', { queueId });
      await fetchData();
      toast.success(`Клиент №${queueId} отмечен как обслуженный за вашим столом №${selectedTable.number}`);
    } catch (err) {
      console.error('Ошибка при отметке "Обслужен":', err);
      setError('Не удалось отметить "Обслужен".');
    } finally {
      setActionLoading(false);
    }
  };

  // Разделение клиентов по статусам
  const pendingClients = queueData
    .filter((item) => item.status === 'PENDING' && (!item.table || canServiceClient(item)))
    .sort((a, b) => (a.timeSlot?.slotTime ? new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime() : a.id - b.id));
  const calledClients = queueData.filter(
    (item) => (item.status === 'CALLED' || item.status === 'RE_CALLED') && canServiceClient(item)
  );
  const arrivedClients = queueData.filter((item) => item.status === 'ARRIVED' && canServiceClient(item));
  const completedClients = queueData.filter(
    (item) => (item.status === 'SERVED' || item.status === 'NO_SHOW') && canServiceClient(item)
  );

  // Найти текущего вызванного клиента для выбранного стола
  const currentQueueItemForTable = calledClients.find((item) => canServiceClient(item));

  // Компонент таблицы
  const QueueTable = ({ title, clients, showActions, actionLabel, onAction }) => (
    <>
      <h3
        className={`text-lg font-semibold mb-2 ${
          title.includes('Ожидающие')
            ? 'text-blue-600'
            : title.includes('Вызванные')
            ? 'text-orange-600'
            : title.includes('Пришедшие')
            ? 'text-green-600'
            : 'text-purple-600'
        }`}
      >
        {title}
      </h3>
      <table className="w-full text-left mb-6">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-gray-600">№</th>
            <th className="p-2 text-gray-600">Email</th>
            <th className="p-2 text-gray-600">Время</th>
            <th className="p-2 text-gray-600">Дата</th>
            <th className="p-2 text-gray-600">Цель</th>
            <th className="p-2 text-gray-600">Статус</th>
            {showActions && <th className="p-2 text-gray-600">Действие</th>}
            <th className="p-2 text-gray-600">Стол №</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((item) => {
            const canAct = !showActions || item.status === 'PENDING' || canServiceClient(item);
            return (
              <tr
                key={item.id}
                className={`${
                  canServiceClient(item) ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                } ${currentQueueItemForTable?.id === item.id ? 'bg-gray-100' : ''}`}
              >
                <td className="p-2">{item.id ?? '-'}</td>
                <td className="p-2">{item.client?.email ? `${item.client.email}` : 'Клиент не указан'}</td>
                <td className="p-2">{item.timeSlot?.slotTime ? item.timeSlot.slotTime: formatTime(item.createdAt)}</td>
                <td className="p-2">{formatDate(item.timeSlot?.slotDate || item.createdAt)}</td>
                <td className="p-2">{item.target?.name ?? 'Цель не указана'}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded ${getStatusStyles(item.status)}`}>{translateStatus(item.status)}</span>
                </td>
                {showActions && (
                  <td className="p-2">
                    <button
                      onClick={() => onAction(item.id)}
                      disabled={actionLoading || !canAct || (item.status === 'PENDING' && hasArrivedClient())}
                      className={`py-1 px-3 rounded-lg transition ${
                        actionLabel === 'Завершить обслуживание' ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-orange-400 text-white hover:bg-orange-500'
                      } ${actionLoading || !canAct || (item.status === 'PENDING' && hasArrivedClient()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {actionLabel}
                    </button>
                  </td>
                )}
                <td className="p-2">{item.table?.number ?? 'Стол не указан'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Обслуживание</h1>
        <div className="flex items-center space-x-2">
          <button className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600">
            <HiEye className="w-5 h-5" />
          </button>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="Обслуживание">Обслуживание</option>
            <option value="Обед">Обед</option>
          </select>
          {selectedTable ? (
            <span className="p-2 bg-blue-100 text-blue-800 font-semibold rounded-lg">
              Ваш стол №{selectedTable?.number ?? '-'}
            </span>
          ) : (
            <select
              value={selectedTable?.id || ''}
              onChange={handleTableSelect}
              disabled={actionLoading}
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Выберите свой стол</option>
              {availableTables
                .filter((table) => table.status === 'FREE')
                .map((table) => (
                  <option key={table.id} value={table.id}>
                    Стол №{table.number ?? '-'}
                  </option>
                ))}
            </select>
          )}
          <button onClick={handleLogout} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
            Выйти
          </button>
        </div>
      </header>

      <div className="flex space-x-4">
        <div className="flex-1 bg-white p-6 rounded-lg shadow-lg">
          {tableError && (
            <p className="text-red-600 mb-4 flex items-center">
              <HiExclamationCircle className="w-5 h-5 mr-2" />
              {tableError}
            </p>
          )}
          {error && (
            <p className="text-red-600 mb-4 flex items-center">
              <HiExclamationCircle className="w-5 h-5 mr-2" />
              {error}
            </p>
          )}
          {status === 'Обслуживание' && (
            <button
              onClick={() => handleCallClient(pendingClients[0]?.id)}
              disabled={actionLoading || pendingClients.length === 0 || !selectedTable?.id || queueData.some((item) => (item.status === 'CALLED' || item.status === 'RE_CALLED') && canServiceClient(item)) || hasArrivedClient()}
              className={`mb-4 py-2 px-4 bg-orange-400 text-white font-semibold rounded-lg hover:bg-orange-500 transition ${
                actionLoading || pendingClients.length === 0 || !selectedTable?.id || queueData.some((item) => (item.status === 'CALLED' || item.status === 'RE_CALLED') && canServiceClient(item)) || hasArrivedClient()
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {selectedTable?.id ? (hasArrivedClient() ? 'Завершите обслуживание текущего клиента' : 'Вызвать первого клиента') : 'Выберите стол для вызова клиента'}
            </button>
          )}
          {isLoading ? (
            <p className="text-gray-600">Загрузка...</p>
          ) : queueData.length === 0 ? (
            <p className="text-gray-600">Очередь пуста</p>
          ) : (
            <div className="overflow-x-auto">
              {pendingClients.length > 0 && (
                <QueueTable
                  title="Ожидающие клиенты"
                  clients={pendingClients}
                  showActions
                  actionLabel="Вызвать"
                  onAction={handleCallClient}
                />
              )}
              {calledClients.length > 0 && (
                <QueueTable
                  title="Вызванные клиенты"
                  clients={calledClients}
                  showActions
                  actionLabel="Повторный вызов"
                  onAction={handleRecallClient}
                />
              )}
              {arrivedClients.length > 0 && (
                <QueueTable
                  title="Пришедшие клиенты"
                  clients={arrivedClients}
                  showActions
                  actionLabel="Завершить обслуживание"
                  onAction={handleClientServed}
                />
              )}
              {completedClients.length > 0 && (
                <QueueTable title="Завершенные клиенты" clients={completedClients} />
              )}
            </div>
          )}
        </div>

        <div className="w-80 bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Клиент с талоном №{currentQueueItemForTable?.id ?? '-'}
          </h3>
          <div className="space-y-2">
            <p className="text-gray-600">
              Стол: <span className="font-semibold">{selectedTable?.number || '-'}</span>
            </p>
            <p className="text-gray-600">
              Время вызова:{' '}
              <span className="font-semibold">
                {currentQueueItemForTable?.calledAt ? formatTime(currentQueueItemForTable.calledAt) : '00:00:00'}
              </span>
            </p>
            <p className="text-gray-600">
              Время повторного вызова:{' '}
              <span className="font-semibold">
                {currentQueueItemForTable?.reCalledAt ? formatTime(currentQueueItemForTable.reCalledAt) : '00:00:00'}
              </span>
            </p>
            <p className="text-gray-600">
              Почта: {currentQueueItemForTable?.client?.email ?? '-'}
            </p>
            <p className="text-gray-600">
              Статус:{' '}
              <span className={`font-semibold ${getStatusStyles(currentQueueItemForTable?.status)}`}>
                {translateStatus(currentQueueItemForTable?.status)}
              </span>
            </p>
          </div>
          {status === 'Обслуживание' && currentQueueItemForTable && (
            <>
              {currentQueueItemForTable.status === 'CALLED' && (
                <button
                  onClick={() => handleRecallClient(currentQueueItemForTable.id)}
                  disabled={actionLoading || !canServiceClient(currentQueueItemForTable) || hasArrivedClient()}
                  className={`w-full mt-4 py-2 bg-orange-400 text-white font-semibold rounded-lg hover:bg-orange-500 transition ${
                    actionLoading || !canServiceClient(currentQueueItemForTable) || hasArrivedClient() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Повторный вызов
                </button>
              )}
              {(currentQueueItemForTable.status === 'CALLED' || currentQueueItemForTable.status === 'RE_CALLED') && (
                <>
                  <button
                    onClick={() => handleClientArrived(currentQueueItemForTable.id)}
                    disabled={actionLoading || !canServiceClient(currentQueueItemForTable)}
                    className={`w-full mt-2 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition ${
                      actionLoading || !canServiceClient(currentQueueItemForTable) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Пришел
                  </button>
                  <button
                    onClick={() => handleClientNoShow(currentQueueItemForTable.id)}
                    disabled={actionLoading || !canServiceClient(currentQueueItemForTable)}
                    className={`w-full mt-2 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition ${
                      actionLoading || !canServiceClient(currentQueueItemForTable) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Не пришел
                  </button>
                </>
              )}
            </>
          )}
          {status === 'Обед' && <p className="text-center text-gray-600 mt-4">Режим обеда, вызовы приостановлены</p>}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Общие данные (Ваш стол №{selectedTable?.number || '-'})</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="p-2 bg-purple-100 rounded-full">
              <HiUsers className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600">Клиентов в очереди</p>
              <p className="text-2xl font-bold text-gray-800">
                {pendingClients.filter((item) => !item.table || canServiceClient(item)).length}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="p-2 bg-purple-100 rounded-full">
              <HiChartBar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600">Обслужено за сегодня</p>
              <p className="text-2xl font-bold text-gray-800">
                {queueData.filter((item) => item.status === 'SERVED' && canServiceClient(item)).length}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="p-2 bg-pink-100 rounded-full">
              <HiMenu className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="text-gray-600">Явилось / Не явилось</p>
              <p className="text-2xl font-bold text-gray-800">
                {queueData.filter((item) => (item.status === 'ARRIVED' || item.status === 'SERVED') && canServiceClient(item)).length} /{' '}
                {queueData.filter((item) => item.status === 'NO_SHOW' && canServiceClient(item)).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestServicePage;