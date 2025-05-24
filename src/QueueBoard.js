import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const QueueBoard = () => {
  const [calledQueue, setCalledQueue] = useState([]);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [reCalledQueue, setReCalledQueue] = useState([]);
  const [isLoading, setIsLoading] = useState({ called: false, pending: false, reCalled: false });
  const [error, setError] = useState(null);

  // Централизованная функция для API-запросов
  const apiRequest = useCallback(async (method, url) => {
    try {
      console.log(`Making ${method} request to ${url}`);
      const response = await axios({
        method,
        url: `http://localhost:8081${url}`,
        headers: { 'Content-Type': 'application/json' },
      });
      console.log(`Response from ${url}:`, response.data);
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' ? 'Сервер недоступен. Проверьте подключение.' : 'Произошла ошибка.');
      setError(message);
      console.error(`Error in ${url}:`, err);
      throw err;
    }
  }, []);

  // Загрузка данных вызванной очереди
  const fetchCalledQueue = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, called: true }));
    setError(null);
    try {
      const data = await apiRequest('get', '/api/v1/employee/queue/called');
      setCalledQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      // Ошибка уже обработана в apiRequest
    } finally {
      setIsLoading((prev) => ({ ...prev, called: false }));
    }
  }, [apiRequest]);

  // Загрузка данных ожидающей очереди
  const fetchPendingQueue = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, pending: true }));
    setError(null);
    try {
      const data = await apiRequest('get', '/api/v1/employee/queue/pending');
      setPendingQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      // Ошибка уже обработана в apiRequest
    } finally {
      setIsLoading((prev) => ({ ...prev, pending: false }));
    }
  }, [apiRequest]);

  // Загрузка данных повторно вызванной очереди
  const fetchReCalledQueue = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, reCalled: true }));
    setError(null);
    try {
      const data = await apiRequest('get', '/api/v1/employee/queue/re-called');
      setReCalledQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      // Ошибка уже обработана в apiRequest
    } finally {
      setIsLoading((prev) => ({ ...prev, reCalled: false }));
    }
  }, [apiRequest]);

  // Загрузка данных при монтировании и каждые 10 секунд
  useEffect(() => {
    fetchCalledQueue();
    fetchPendingQueue();
    fetchReCalledQueue();
    const interval = setInterval(() => {
      fetchCalledQueue();
      fetchPendingQueue();
      fetchReCalledQueue();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchCalledQueue, fetchPendingQueue, fetchReCalledQueue]);

  // Очистка ошибки через 5 секунд
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse">
        Табло очереди
      </h1>

      {error && (
        <div className="mb-8 w-full max-w-2xl bg-red-900/80 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center shadow-lg animate-fade-in">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-lg sm:text-xl text-red-200">{error}</span>
        </div>
      )}

      {/* Вызванная очередь */}
      <div className="w-full max-w-5xl mb-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-6 text-blue-300">Вызванные талоны</h2>
        {isLoading.called ? (
          <div className="text-center text-gray-300 text-lg sm:text-xl md:text-2xl">
            <svg className="animate-spin h-10 w-10 md:h-12 md:w-12 mx-auto text-blue-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
            </svg>
            Загрузка...
          </div>
        ) : calledQueue.length === 0 ? (
          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 text-center">Нет вызванных талонов</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {calledQueue.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800/90 backdrop-blur-sm p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-blue-500"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xl sm:text-2xl font-bold text-blue-200">
                    Талон №{item.id || '-'}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-blue-100">
                    Стол {item.table?.number || '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Повторно вызванная очередь */}
      <div className="w-full max-w-5xl mb-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-6 text-yellow-300">Повторно вызванные талоны</h2>
        {isLoading.reCalled ? (
          <div className="text-center text-gray-300 text-lg sm:text-xl md:text-2xl">
            <svg className="animate-spin h-10 w-10 md:h-12 md:w-12 mx-auto text-yellow-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
            </svg>
            Загрузка...
          </div>
        ) : reCalledQueue.length === 0 ? (
          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 text-center">Нет повторно вызванных талонов</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reCalledQueue.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800/90 backdrop-blur-sm p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-yellow-500"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xl sm:text-2xl font-bold text-yellow-200">
                    Талон №{item.id || '-'}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-yellow-100">
                    Стол {item.table?.number || '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ожидающая очередь */}
      <div className="w-full max-w-5xl">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-6 text-purple-300">Ожидающие талоны</h2>
        {isLoading.pending ? (
          <div className="text-center text-gray-300 text-lg sm:text-xl md:text-2xl">
            <svg className="animate-spin h-10 w-10 md:h-12 md:w-12 mx-auto text-purple-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
            </svg>
            Загрузка...
          </div>
        ) : pendingQueue.length === 0 ? (
          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 text-center">Нет ожидающих талонов</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingQueue.map((item) => (
              <div
                key={item.id}
                className="bg-gray-700/90 backdrop-blur-sm p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-purple-500"
              >
                <span className="text-xl sm:text-2xl font-bold text-purple-200">
                  Талон №{item.id || '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueBoard;