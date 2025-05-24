import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ru from 'date-fns/locale/ru';

// Регистрация русской локализации
registerLocale('ru', ru);

const DatePickerPage = () => {
  const [targets, setTargets] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Начальная дата: текущая
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [queueId, setQueueId] = useState(null); // Храним queueId после записи
  const navigate = useNavigate();

  // Извлекаем client из Redux слайса
  const client = useSelector((state) => state.client.client);

  // Текущая дата и время (локальное время пользователя)
  const currentDateTime = new Date();

  // Максимальная дата: через 1 месяц от текущей даты
  const maxDate = new Date(currentDateTime);
  maxDate.setMonth(maxDate.getMonth() + 1);

  // Загрузка типов из API
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8081/api/v1/client/targets', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.headers['content-type']?.includes('application/json')) {
          throw new Error('Ответ сервера не является JSON');
        }
        setTargets(response.data);
      } catch (err) {
        console.error('Ошибка при загрузке типов:', err);
        setError(`Не удалось загрузить услуги: ${err.response ? `${err.response.status} ${err.response.statusText}` : err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchTargets();
  }, []);

  // Загрузка слотов при выборе услуги и даты
useEffect(() => {
     if (!selectedTarget || !selectedDate) return;

     const fetchSlots = async () => {
       try {
         setLoading(true);
         // Форматируем дату в YYYY-MM-DD в локальном часовом поясе (Астана)
         const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
         console.log('Formatted date for request:', formattedDate); // Для отладки
         const response = await axios.get('http://localhost:8081/api/v1/client/slots', {
           params: {
             targetId: selectedTarget.id,
             slotDate: formattedDate,
           },
           headers: {
             'Content-Type': 'application/json',
           },
         });
         if (!response.headers['content-type']?.includes('application/json')) {
           throw new Error('Ответ сервера не является JSON');
         }
         setSlots(response.data);
         setError(null);
       } catch (err) {
         console.error('Ошибка при загрузке слотов:', err);
         setError(`Не удалось загрузить слоты: ${err.response ? `${err.response.status} ${err.response.statusText}` : err.message}`);
       } finally {
         setLoading(false);
       }
     };
     fetchSlots();
   }, [selectedTarget, selectedDate]);

  // Обработчик выбора услуги
  const handleTargetSelect = (target) => {
    setSelectedTarget(target);
    setSelectedSlot(null);
    setSuccessMessage(null);
    setQueueId(null);
  };

  // Обработчик выбора даты
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSuccessMessage(null);
    setQueueId(null);
  };

  // Обработчик выбора слота
  const handleSlotSelect = (slot) => {
    if (slot.isAvailable) {
      setSelectedSlot(slot);
      setSuccessMessage(null);
      setQueueId(null);
    }
  };

  // Форматирование времени слота для отображения
  const formatSlotTime = (slotTime) => {
    if (typeof slotTime === 'string') {
      return slotTime.split(':').slice(0, 2).join(':');
    } else if (typeof slotTime === 'object' && slotTime.hour !== undefined) {
      return `${slotTime.hour.toString().padStart(2, '0')}:${slotTime.minute.toString().padStart(2, '0')}`;
    }
    console.warn('Некорректный формат slotTime:', slotTime);
    return 'Неверное время';
  };

  // Форматирование даты для отображения
  const formatSlotDate = (slotDate) => {
    const date = new Date(slotDate);
    return date.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Преобразование slotTime в строку HH:mm:ss для проверки времени
  const convertSlotTimeToString = (slotTime) => {
    if (typeof slotTime === 'string') {
      const [hour, minute] = slotTime.split(':').map(Number);
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    } else if (typeof slotTime === 'object' && slotTime.hour !== undefined) {
      return `${slotTime.hour.toString().padStart(2, '0')}:${slotTime.minute.toString().padStart(2, '0')}:00`;
    }
    console.error('Некорректный формат slotTime:', slotTime);
    throw new Error('Некорректный формат slotTime');
  };

  // Функция проверки слота в прошлом (оставлена для возможного восстановления)
  const isSlotInPast = (slot) => {
    const slotDateTime = new Date(`${slot.slotDate}T${convertSlotTimeToString(slot.slotTime)}`);
    return slotDateTime < currentDateTime;
  };

  // Группировка слотов по времени дня
  const groupSlotsByTime = (slots) => {
    const morning = [];
    const afternoon = [];
    const evening = [];

    slots.forEach((slot) => {
      const hour = typeof slot.slotTime === 'string'
        ? parseInt(slot.slotTime.split(':')[0], 10)
        : slot.slotTime.hour;
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 16) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = groupSlotsByTime(slots);

  // Обработчик подтверждения записи
  const handleSubmit = async () => {
    if (!selectedTarget || !selectedSlot || !selectedDate) {
      alert('Пожалуйста, выберите услугу, дату и время');
      return;
    }

    if (!client || !client.id || client.id === 0) {
      console.error('Ошибка: client.id не определён или равен 0', client);
      alert('Ошибка: клиент не авторизован. Пожалуйста, войдите в систему.');
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const requestBody = {
        clientId: client.id,
        targetId: selectedTarget.id,
        slotId: selectedSlot.id,
      };

      console.log('Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post('http://localhost:8081/api/v1/queue/select', requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response:', response.data);

      // Сохраняем queueId из ответа
      const newQueueId = response.data.queueId || 0;
      setQueueId(newQueueId);

      // Обновляем слоты после успешной записи
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const slotsResponse = await axios.get('http://localhost:8081/api/v1/client/slots', {
        params: { targetId: selectedTarget.id, slotDate: formattedDate },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!slotsResponse.headers['content-type']?.includes('application/json')) {
        throw new Error('Ответ сервера не является JSON');
      }
      setSlots(slotsResponse.data); // Сохраняем слоты без изменений
      setSelectedSlot(null);
      setSuccessMessage('Запись успешно подтверждена!');
    } catch (err) {
      console.error('Ошибка при подтверждении записи:', err);
      console.log('Error Response:', err.response?.data);
      let errorMessage = 'Не удалось подтвердить запись';
      if (err.response) {
        if (err.response.status === 403) {
          errorMessage = 'Доступ запрещён: проверьте ID клиента или доступ к слоту';
        } else if (err.response.status === 400) {
          errorMessage = `Некорректный запрос: ${err.response.data || 'проверьте данные'}`;
        } else {
          errorMessage = `${err.response.status} ${err.response.statusText}: ${err.response.data || ''}`;
        }
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик повторного вызова
  const handleRecall = async () => {
    if (!queueId) {
      alert('Ошибка: ID очереди не определён. Сначала подтвердите запись.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestBody = {
        queueId: queueId,
        tableId: 0,
      };

      console.log('Recall Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post('http://localhost:8081/api/v1/employee/queue/re-call', requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Recall Response:', response.data);
      setSuccessMessage('Клиент успешно вызван повторно!');
    } catch (err) {
      console.error('Ошибка при повторном вызове:', err);
      console.log('Recall Error Response:', err.response?.data);
      let errorMessage = 'Не удалось выполнить повторный вызов';
      if (err.response) {
        if (err.response.status === 403) {
          errorMessage = 'Доступ запрещён: проверьте права сотрудника';
        } else if (err.response.status === 400) {
          errorMessage = `Некорректный запрос: ${err.response.data || 'проверьте queueId и tableId'}`;
        } else {
          errorMessage = `${err.response.status} ${err.response.statusText}: ${err.response.data || ''}`;
        }
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex justify-center items-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-red-600 text-center max-w-md animate-fade-in">
          <h2 className="text-3xl font-bold mb-4">Ошибка</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-gray-50 to-gray-100 flex flex-col items-center p-4 sm:p-8">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-10 text-gray-900 drop-shadow-lg animate-fade-in">
        Запись на прием
      </h1>

      {successMessage && (
        <div className="w-full max-w-lg mb-8 p-6 bg-green-100 text-green-800 rounded-2xl shadow-xl animate-fade-in">
          <h3 className="text-xl font-semibold">{successMessage}</h3>
          {queueId && (
            <button
              className={`mt-4 px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl shadow-md hover:from-teal-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleRecall}
              disabled={loading}
            >
              Повторный вызов
            </button>
          )}
        </div>
      )}

      <div className="w-full max-w-lg mb-8 flex justify-between">
        <div className={`flex-1 text-center ${selectedTarget ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="font-semibold">1. Услуга</span>
          <div className={`h-1 mt-2 ${selectedTarget ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        </div>
        <div className={`flex-1 text-center ${selectedDate ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="font-semibold">2. Дата</span>
          <div className={`h-1 mt-2 ${selectedDate ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        </div>
        <div className={`flex-1 text-center ${selectedSlot ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="font-semibold">3. Время</span>
          <div className={`h-1 mt-2 ${selectedSlot ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        </div>
      </div>

      <div className="w-full max-w-lg mb-10 animate-fade-in">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Выберите услугу</h2>
        {loading && !selectedTarget && (
          <div className="text-center text-gray-600 animate-pulse">Загрузка услуг...</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {targets.map((target) => (
            <button
              key={target.id}
              className={`relative p-5 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 group ${
                selectedTarget?.id === target.id
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                  : 'bg-white text-gray-800 hover:bg-blue-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleTargetSelect(target)}
              disabled={loading}
            >
              <span className="font-medium">{target.name}</span>
              {selectedTarget?.id === target.id && (
                <svg
                  className="absolute top-3 right-3 h-5 w-5 text-blue-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedTarget && (
        <div className="w-full max-w-lg mb-10 animate-fade-in">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Выберите дату</h2>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateSelect}
            minDate={currentDateTime} // Ограничение: только текущая дата и будущие
            maxDate={maxDate} // Ограничение: не дальше одного месяца вперёд
            dateFormat="dd.MM.yyyy"
            locale="ru"
            className="p-3 border border-gray-200 rounded-xl w-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
            placeholderText="Выберите дату"
            popperClassName="custom-datepicker-popper"
          />
        </div>
      )}

      {selectedTarget && selectedDate && (
        <div className="w-full max-w-lg mb-10 animate-fade-in">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Выберите время</h2>
          {loading && <div className="text-center text-gray-600 animate-pulse">Загрузка времени...</div>}
          {!loading && slots.length === 0 && (
            <div className="text-center text-gray-600 bg-white p-4 rounded-2xl shadow-xl">
              Нет доступных слотов на выбранную дату
            </div>
          )}
          {!loading && slots.length > 0 && (
            <div className="space-y-8">
              {morning.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-600 mb-3 border-b border-gray-200 pb-2">Утро (до 12:00)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {morning.map((slot) => (
                      <button
                        key={slot.id}
                        className={`relative p-4 rounded-2xl shadow-xl transition-all duration-300 transform group ${
                          slot.isAvailable
                            ? selectedSlot?.id === slot.id
                              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white animate-pulse'
                              : 'bg-white text-gray-800 hover:bg-green-50 hover:scale-105'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={!slot.isAvailable || loading}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-medium">{formatSlotTime(slot.slotTime)}</div>
                          {slot.isAvailable ? (
                            <svg
                              className="h-5 w-5 text-green-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <span className="text-gray-400 group-hover:tooltip">🔒</span>
                          )}
                        </div>
                        {!slot.isAvailable && (
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                            Слот занят
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {afternoon.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-600 mb-3 border-b border-gray-200 pb-2">День (12:00–16:00)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {afternoon.map((slot) => (
                      <button
                        key={slot.id}
                        className={`relative p-4 rounded-2xl shadow-xl transition-all duration-300 transform group ${
                          slot.isAvailable
                            ? selectedSlot?.id === slot.id
                              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white animate-pulse'
                              : 'bg-white text-gray-800 hover:bg-green-50 hover:scale-105'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={!slot.isAvailable || loading}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-medium">{formatSlotTime(slot.slotTime)}</div>
                          {slot.isAvailable ? (
                            <svg
                              className="h-5 w-5 text-green-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <span className="text-gray-400 group-hover:tooltip">🔒</span>
                          )}
                        </div>
                        {!slot.isAvailable && (
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                            Слот занят
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {evening.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-600 mb-3 border-b border-gray-200 pb-2">Вечер (после 16:00)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {evening.map((slot) => (
                      <button
                        key={slot.id}
                        className={`relative p-4 rounded-2xl shadow-xl transition-all duration-300 transform group ${
                          slot.isAvailable
                            ? selectedSlot?.id === slot.id
                              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white animate-pulse'
                              : 'bg-white text-gray-800 hover:bg-green-50 hover:scale-105'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={!slot.isAvailable || loading}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-medium">{formatSlotTime(slot.slotTime)}</div>
                          {slot.isAvailable ? (
                            <svg
                              className="h-5 w-5 text-green-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <span className="text-gray-400 group-hover:tooltip">🔒</span>
                          )}
                        </div>
                        {!slot.isAvailable && (
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                            Слот занят
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedTarget && selectedDate && selectedSlot && (
        <div className="w-full max-w-lg mb-10 p-6 bg-white rounded-2xl shadow-xl animate-fade-in">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Ваш выбор</h3>
          <p className="text-gray-600">
            <span className="font-medium">Услуга:</span> {selectedTarget.name}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Дата:</span> {formatSlotDate(selectedSlot.slotDate)}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Время:</span> {formatSlotTime(selectedSlot.slotTime)}
          </p>
        </div>
      )}

      <div className="relative group">
        <button
          className={`px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 ${
            !selectedTarget || !selectedDate || !selectedSlot || loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleSubmit}
          disabled={!selectedTarget || !selectedDate || !selectedSlot || loading}
        >
          Подтвердить запись
        </button>
        {(!selectedTarget || !selectedDate || !selectedSlot) && (
          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
            Выберите услугу, дату и время
          </span>
        )}
      </div>

      <div className="flex flex-col space-y-2 mt-6">
        <button
          className="text-teal-600 hover:text-teal-800 text-sm font-medium bg-transparent border border-teal-600 hover:border-teal-800 rounded-md px-4 py-2 inline-block transition-colors duration-200"
          onClick={() => navigate('/')}
        >
          Клиент
        </button>
        <button
          className="text-teal-600 hover:text-teal-800 text-sm font-medium bg-transparent border border-teal-600 hover:border-teal-800 rounded-md px-4 py-2 inline-block transition-colors duration-200"
          onClick={() => navigate('/dashboard')}
        >
          Табло очередей
        </button>
      </div>
    </div>
  );
};

// Кастомные стили
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out;
  }
  .custom-datepicker-popper {
    z-index: 50 !important;
  }
  .react-datepicker {
    font-family: 'Inter', sans-serif;
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    background: #ffffff;
    padding: 10px;
  }
  .react-datepicker__header {
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    border-bottom: none;
    padding: 12px 0;
    border-radius: 12px 12px 0 0;
  }
  .react-datepicker__current-month,
  .react-datepicker__day-name {
    color: #ffffff;
    font-weight: 600;
  }
  .react-datepicker__day {
    color: #1f2937;
    font-size: 14px;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  .react-datepicker__day:hover {
    background: #eff6ff;
    color: #1f2937;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background: #3b82f6 !important;
    color: #ffffff !important;
    font-weight: 600;
  }
  .react-datepicker__day--disabled {
    color: #d1d5db;
    cursor: not-allowed;
  }
  .react-datepicker__navigation-icon::before {
    border-color: #ffffff;
  }
  .react-datepicker__triangle {
    display: none;
  }
`;
document.head.appendChild(style);

export default DatePickerPage;