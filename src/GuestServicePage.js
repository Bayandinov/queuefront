import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { HiUsers, HiChartBar, HiMenu, HiEye, HiExclamationCircle } from 'react-icons/hi';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { clearAuthData } from './store/authSlice';
import { setSelectedTable, setAvailableTables, setTableError, clearTableData } from './store/tableSlice';

const GuestServicePage = () => {
  const [status, setStatus] = useState('Обслуживание');
  const [currentQueueId, setCurrentQueueId] = useState(null);
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
  const [callWarning, setCallWarning] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { jwtToken, id: userId } = useSelector((state) => state.auth.authData || {});
  const { selectedTable, availableTables, tableError } = useSelector((state) => state.table);

  // Централизованная обработка API-запросов
  const apiRequest = useCallback(
    async (method, url, data) => {
      try {
        const response = await axios({
          method,
          url: `http://localhost:8081/api/v1/employee${url}`,
          data,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtToken}`,
          },
        });
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
        apiRequest('get', '/queue'),
        apiRequest('get', '/tables'),
        apiRequest('get', '/queue/report'),
      ]);

      const newQueueData = Array.isArray(queueResponse) ? queueResponse : [];
      setQueueData(newQueueData);
      dispatch(setAvailableTables(Array.isArray(tablesResponse) ? tablesResponse : []));
      setReport(reportResponse || { averageWaitingTimeSeconds: 0, maxWaitingTimeSeconds: 0, minWaitingTimeSeconds: 0, completedClients: 0 });

      const userTable = tablesResponse.find((table) => table.user?.id === userId);
      if (userTable) dispatch(setSelectedTable(userTable));

      // Синхронизация currentQueueId с вызванным клиентом
      const calledClient = newQueueData.find((item) => item.status === 'CALLED');
      if (calledClient && !currentQueueId) {
        setCurrentQueueId(calledClient.id);
      }
    } catch (err) {
      console.error('Ошибка при загрузке данных:', err);
    } finally {
      setIsLoading(false);
    }
  }, [jwtToken, userId, dispatch, apiRequest, currentQueueId]);

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
      } catch {
        // Ошибка уже обработана в apiRequest
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
    } catch (err) {
      console.error('Ошибка при выборе стола:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Вызов клиента
  const handleCallClient = async (queueId) => {
    if (!selectedTable?.id) {
      setError('Выберите стол перед вызовом клиента.');
      return;
    }

    const queueItem = queueData.find((item) => item.id === queueId);
    if (!queueItem) {
      setError('Клиент не найден.');
      return;
    }

    setActionLoading(true);
    try {
      await apiRequest('post', '/queue/call', { queueId, tableId: selectedTable.id });
      setCurrentQueueId(queueItem.id); // Убедимся, что currentQueueId устанавливается
      await fetchData();
    } catch (err) {
      console.error('Ошибка при вызове клиента:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Повторный вызов
  const handleRecallClient = async () => {
    if (!currentQueueId) {
      setError('Нет вызванного клиента.');
      return;
    }

    const queueItem = queueData.find((item) => item.id === currentQueueId);
    if (!queueItem || queueItem.status !== 'CALLED') {
      setError('Клиент не находится в статусе "Вызван".');
      return;
    }

    if (!selectedTable?.id) {
      setError('Выберите стол перед повторным вызовом клиента.');
      return;
    }

    setActionLoading(true);
    try {
      await apiRequest('post', '/queue/re-call', {
        queueId: currentQueueId,
        tableId: selectedTable.id,
      });
      await fetchData();
    } catch (err) {
      console.error('Ошибка при повторном вызове клиента:', err);
      setError('Не удалось выполнить повторный вызов.');
    } finally {
      setActionLoading(false);
    }
  };

  // Клиент пришел
  const handleClientArrived = async () => {
    if (!currentQueueId) {
      setError('Нет вызванного клиента.');
      return;
    }

    const queueItem = queueData.find((item) => item.id === currentQueueId);
    if (!queueItem || queueItem.status !== 'CALLED') {
      setError('Клиент не находится в статусе "Вызван".');
      return;
    }

    setActionLoading(true);
    try {
      await apiRequest('post', '/queue/arrived', { queueId: currentQueueId });
      await fetchData();
    } catch (err) {
      console.error('Ошибка при отметке прибытия:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Клиент не пришел
  const handleClientNoShow = async () => {
    if (!currentQueueId) {
      setError('Нет вызванного клиента.');
      return;
    }

    const queueItem = queueData.find((item) => item.id === currentQueueId);
    if (!queueItem || queueItem.status !== 'CALLED') {
      setError('Клиент не находится в статусе "Вызван".');
      return;
    }

    setActionLoading(true);
    try {
      await apiRequest('post', '/queue/no-show', { queueId: currentQueueId });
      setCurrentQueueId(null);
      await fetchData();
    } catch (err) {
      console.error('Ошибка при отметке "Не пришел":', err);
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

    setActionLoading(true);
    try {
      await apiRequest('post', '/queue/served', { queueId });
      if (queueItem.id === currentQueueId) setCurrentQueueId(null);
      await fetchData();
    } catch (err) {
      console.error('Ошибка при отметке "Обслужен":', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Разделение клиентов по статусам
  const pendingClients = queueData
    .filter((item) => item.status === 'PENDING')
    .sort((a, b) => (a.timeSlot?.slotTime ? new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime() : a.id - b.id));
  const calledClients = queueData.filter((item) => item.status === 'CALLED');
  const arrivedClients = queueData.filter((item) => item.status === 'ARRIVED');
  const completedClients = queueData.filter((item) => item.status === 'SERVED' || item.status === 'NO_SHOW');

  // Компонент таблицы
  const QueueTable = ({ title, clients, showActions, actionLabel, onAction, highlightQueueId }) => (
    <>
      <h3
        className={`text-lg font-semibold mb-2 ${title.includes('Ожидающие')
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
          </tr>
        </thead>
        <tbody>
          {clients.map((item) => (
            <tr
              key={item.id}
              className={`${item.id === highlightQueueId ? 'bg-gray-100' : 'hover:bg-gray-50'} ${item.status === 'CALLED' && item.id !== pendingClients[0]?.id ? 'border-l-4 border-red-500' : ''
              }`}
            >
              <td className="p-2">{item.id ?? '-'}</td>
              <td className="p-2">{item.client?.email ? `${item.client.email}` : 'Клиент не указан'}</td>
              <td className="p-2">{item.timeSlot?.slotTime ? formatSlotTime(item.timeSlot.slotTime) : formatTime(item.createdAt)}</td>
              <td className="p-2">{formatDate(item.timeSlot?.slotDate || item.createdAt)}</td>
              <td className="p-2">{item.target?.name ?? 'Цель не указана'}</td>
              <td className="p-2">
                <span className={`px-2 py-1 rounded ${getStatusStyles(item.status)}`}>{translateStatus(item.status)}</span>
              </td>
              {showActions && (
                <td className="p-2">
                  <button
                    onClick={() => onAction(item.id)}
                    disabled={actionLoading}
                    className={`py-1 px-3 rounded-lg transition ${actionLabel === 'Завершить обслуживание' ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-orange-400 text-white hover:bg-orange-500'
                    } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {actionLabel}
                  </button>
                </td>
              )}
            </tr>
          ))}
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
            <span className="p-2 text-gray-800 font-semibold">Стол №{selectedTable.number}</span>
          ) : (
            <select
              value={selectedTable?.id || ''}
              onChange={handleTableSelect}
              disabled={actionLoading}
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Выберите стол</option>
              {availableTables
                .filter((table) => table.status === 'FREE')
                .map((table) => (
                  <option key={table.id} value={table.id}>
                    Стол №{table.number}
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
          {tableError && <p className="text-red-600 mb-4">{tableError}</p>}
          {error && (
            <p className="text-red-600 mb-4 flex items-center">
              <HiExclamationCircle className="w-5 h-5 mr-2" />
              {error}
            </p>
          )}
          {callWarning && (
            <p className="text-red-600 mb-4 flex items-center">
              <HiExclamationCircle className="w-5 h-5 mr-2" />
              {callWarning}
            </p>
          )}
          {status === 'Обслуживание' && (
            <button
              onClick={() => handleCallClient(pendingClients[0]?.id)}
              disabled={actionLoading || pendingClients.length === 0 || !selectedTable?.id}
              className={`mb-4 py-2 px-4 bg-orange-400 text-white font-semibold rounded-lg hover:bg-orange-500 transition ${actionLoading || pendingClients.length === 0 || !selectedTable?.id ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Вызвать первого клиента
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
                  highlightQueueId={currentQueueId}
                />
              )}
              {calledClients.length > 0 && (
                <QueueTable
                  title="Вызванные клиенты"
                  clients={calledClients}
                  showActions
                  actionLabel="Повторный вызов"
                  onAction={handleRecallClient}
                  highlightQueueId={currentQueueId}
                />
              )}
              {arrivedClients.length > 0 && (
                <QueueTable
                  title="Пришедшие клиенты"
                  clients={arrivedClients}
                  showActions
                  actionLabel="Завершить обслуживание"
                  onAction={handleClientServed}
                  highlightQueueId={currentQueueId}
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
            Клиент с талоном №{queueData.find((item) => item.id === currentQueueId)?.queueNumber ?? '-'}
          </h3>
          <div className="space-y-2">
            <p className="text-gray-600">
              Стол: <span className="font-semibold">{selectedTable?.number || '-'}</span>
            </p>
            <p className="text-gray-600">
              Время ожидания:{' '}
              <span className="font-semibold">
                {queueData.find((item) => item.id === currentQueueId)?.createdAt
                  ? formatTime(queueData.find((item) => item.id === currentQueueId)?.createdAt)
                  : '00:00:00'}
              </span>
            </p>
            <p className="text-gray-600">
              Время вызова:{' '}
              <span className="font-semibold">
                {queueData.find((item) => item.id === currentQueueId)?.calledAt
                  ? formatTime(queueData.find((item) => item.id === currentQueueId)?.calledAt)
                  : '00:00:00'}
              </span>
            </p>
            <p className="text-gray-600">
              Имя:{' '}
              {(() => {
                const selectedClient = queueData.find((item) => item.id === currentQueueId);
                return selectedClient?.client
                  ? `${selectedClient.client.lastName} ${selectedClient.client.firstName} ${selectedClient.client.middleName || ''}`
                  : '-';
              })()}
            </p>
            <p className="text-gray-600">
              Почта: {queueData.find((item) => item.id === currentQueueId)?.client?.email ?? '-'}
            </p>
            <p className="text-gray-600">
              Статус:{' '}
              <span className={`font-semibold ${getStatusStyles(queueData.find((item) => item.id === currentQueueId)?.status)}`}>
                {translateStatus(queueData.find((item) => item.id === currentQueueId)?.status)}
              </span>
            </p>
          </div>
          {status === 'Обслуживание' && (
            <>
              <button
                onClick={handleRecallClient}
                disabled={actionLoading || !currentQueueId || queueData.find((item) => item.id === currentQueueId)?.status !== 'CALLED'}
                className={`w-full mt-4 py-2 bg-orange-400 text-white font-semibold rounded-lg hover:bg-orange-500 transition ${actionLoading || !currentQueueId || queueData.find((item) => item.id === currentQueueId)?.status !== 'CALLED' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Повторный вызов
              </button>
              <button
                onClick={handleClientArrived}
                disabled={actionLoading || !currentQueueId || queueData.find((item) => item.id === currentQueueId)?.status !== 'CALLED'}
                className={`w-full mt-2 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition ${actionLoading || !currentQueueId || queueData.find((item) => item.id === currentQueueId)?.status !== 'CALLED' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Пришел
              </button>
              <button
                onClick={handleClientNoShow}
                disabled={actionLoading || !currentQueueId || queueData.find((item) => item.id === currentQueueId)?.status !== 'CALLED'}
                className={`w-full mt-2 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition ${actionLoading || !currentQueueId || queueData.find((item) => item.id === currentQueueId)?.status !== 'CALLED' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Не пришел
              </button>
            </>
          )}
          {status === 'Обед' && <p className="text-center text-gray-600 mt-4">Режим обеда, вызовы приостановлены</p>}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Общие данные</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="p-2 bg-purple-100 rounded-full">
              <HiUsers className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600">Клиентов в очереди</p>
              <p className="text-2xl font-bold text-gray-800">{pendingClients.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="p-2 bg-green-100 rounded-full">
              <HiChartBar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600">Принято за сегодня</p>
              <p className="text-2xl font-bold text-gray-800">{arrivedClients.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="p-2 bg-purple-100 rounded-full">
              <HiChartBar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600">Обслужено за сегодня</p>
              <p className="text-2xl font-bold text-gray-800">{queueData.filter((item) => item.status === 'SERVED').length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="p-2 bg-pink-100 rounded-full">
              <HiMenu className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="text-gray-600">Явилось / Не явилось</p>
              <p className="text-2xl font-bold text-gray-800">
                {queueData.filter((item) => item.status === 'ARRIVED' || item.status === 'SERVED').length} /{' '}
                {queueData.filter((item) => item.status === 'NO_SHOW').length}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <HiChartBar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600">Среднее время ожидания</p>
              <p className="text-2xl font-bold text-gray-800">{formatDuration(report.averageWaitingTimeSeconds)}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="p-2 bg-yellow-100 rounded-full">
              <HiChartBar className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-gray-600">Максимальное время ожидания</p>
              <p className="text-2xl font-bold text-gray-800">{formatDuration(report.maxWaitingTimeSeconds)}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="p-2 bg-red-100 rounded-full">
              <HiChartBar className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-600">Минимальное время ожидания</p>
              <p className="text-2xl font-bold text-gray-800">{formatDuration(report.minWaitingTimeSeconds)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestServicePage;