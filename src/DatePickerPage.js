import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

// Регистрация русской локализации
registerLocale('ru', ru);

const DatePickerPage = () => {
  const [targets, setTargets] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  // Извлекаем client из Redux слайса
  const client = useSelector((state) => state.client.client);

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

  // Загрузка слотов при выборе даты
  useEffect(() => {
    if (!selectedDate) return;

    const fetchSlots = async () => {
      try {
        setLoading(true);
        const formattedDate = selectedDate.toISOString().split('T')[0];
        const response = await axios.get('http://localhost:8081/api/v1/client/slots', {
          params: { date: formattedDate },
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
  }, [selectedDate]);

  // Обработчик выбора даты
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSuccessMessage(null);
  };

  // Обработчик выбора типа
  const handleTargetSelect = (target) => {
    setSelectedTarget(target);
    setSelectedSlot(null);
    setSuccessMessage(null);
  };

  // Обработчик выбора слота
  const handleSlotSelect = (slot) => {
    if (slot.isAvailable) {
      setSelectedSlot(slot);
      setSuccessMessage(null);
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

  // Преобразование slotTime в строку HH:mm:ss для POST-запроса
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

  // Форматирование slotDate в строку YYYY-MM-DD
  const formatSlotDateForApi = (slotDate) => {
    if (typeof slotDate === 'string') {
      const date = new Date(slotDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return slotDate;
    }
    if (slotDate instanceof Date) {
      return slotDate.toISOString().split('T')[0];
    }
    console.warn('Некорректный формат slotDate:', slotDate);
    return slotDate;
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

  // Обработчик подтверждения выбора
  const handleSubmit = async () => {
    if (!selectedTarget || !selectedSlot || !selectedDate) {
      alert('Пожалуйста, выберите дату, услугу и время');
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
        slotDate: formatSlotDateForApi(selectedSlot.slotDate),
        slotTime: convertSlotTimeToString(selectedSlot.slotTime),
      };

      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('client:', client);
      console.log('selectedTarget:', selectedTarget);
      console.log('selectedSlot:', selectedSlot);
      console.log('selectedDate:', selectedDate);

      const response = await axios.post('http://localhost:8081/api/v1/queue/select', requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response:', response.data);

      const slotsResponse = await axios.get('http://localhost:8081/api/v1/client/slots', {
        params: { date: selectedDate.toISOString().split('T')[0] },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!slotsResponse.headers['content-type']?.includes('application/json')) {
        throw new Error('Ответ сервера не является JSON');
      }
      setSlots(slotsResponse.data);
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
        </div>
      )}

      <div className="w-full max-w-lg mb-8 flex justify-between">
        <div className={`flex-1 text-center ${selectedDate ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="font-semibold">1. Дата</span>
          <div className={`h-1 mt-2 ${selectedDate ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        </div>
        <div className={`flex-1 text-center ${selectedTarget ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="font-semibold">2. Услуга</span>
          <div className={`h-1 mt-2 ${selectedTarget ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        </div>
        <div className={`flex-1 text-center ${selectedSlot ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="font-semibold">3. Время</span>
          <div className={`h-1 mt-2 ${selectedSlot ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        </div>
      </div>

      <div className="w-full max-w-lg mb-10 animate-fade-in">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Выберите дату</h2>
        <div className="relative">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            className="w-full p-4 rounded-2xl bg-white text-gray-800 border border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-400 shadow-xl transition duration-300"
            minDate={new Date()}
            dateFormat="dd.MM.yyyy"
            placeholderText="Выберите дату"
            showPopperArrow={false}
            popperClassName="custom-datepicker-popper"
            locale="ru"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
          <svg
            className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <div className="w-full max-w-lg mb-10 animate-fade-in">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Выберите услугу</h2>
        {loading && !selectedDate && (
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
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedDate && selectedTarget && (
        <div className="w-full max-w-lg mb-10 animate-fade-in">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Выберите время</h2>
          {loading && <div className="text-center text-gray-600 animate-pulse">Загрузка времени...</div>}
          {!loading && slots.length === 0 && (
            <div className="text-center text-gray-600 bg-white p-4 rounded-2xl shadow-xl">
              Нет доступных слотов
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
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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

      {selectedTarget && selectedSlot && selectedDate && (
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
            !selectedTarget || !selectedSlot || !selectedDate || loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleSubmit}
          disabled={!selectedTarget || !selectedSlot || !selectedDate || loading}
        >
          Подтвердить запись
        </button>
        {(!selectedTarget || !selectedSlot || !selectedDate) && (
          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
            Выберите дату, услугу и время
          </span>
        )}
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
    z-index: 50;
    width: fit-content;
    margin-top: 8px;
  }
  .react-datepicker {
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-family: inherit;
  }
  .react-datepicker__triangle {
    display: none;
  }
  .react-datepicker__header {
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  .react-datepicker__day {
    border-radius: 0.3rem;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background-color: #2563eb;
    color: white;
  }
`;
document.head.appendChild(style);

export default DatePickerPage;