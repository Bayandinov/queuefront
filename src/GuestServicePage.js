import React, { useState } from 'react';
import { HiUsers, HiChartBar, HiMenu, HiEye } from 'react-icons/hi';

const GuestServicePage = () => {
  const [status, setStatus] = useState('Обслуживание');
  const [clientNumber, setClientNumber] = useState(7);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">Обслуживание</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 bg-purple-500 text-white rounded-full">
            <HiEye className="w-5 h-5" />
          </button>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg"
          >
            <option value="Обслуживание">Обслуживание</option>
            <option value="Обед">Обед</option>
          </select>
          {/* <select className="p-2 border border-gray-300 rounded-lg">
            <option></option>
            <option>Другой пользователь</option>
          </select> */}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex space-x-4">
        {/* Left Section */}
        <div className="flex-1 bg-white p-6 rounded-lg shadow-lg relative">
          <div className="relative z-10">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-gray-600">№</th>
                  <th className="p-2 text-gray-600">Клиент</th>
                  <th className="p-2 text-gray-600">Время</th>
                  <th className="p-2 text-gray-600">Цель</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">5</td>
                  <td className="p-2">Иванов Иван Иванович</td>
                  <td className="p-2">10:30</td>
                  <td className="p-2">Консультация</td>
                  <td className="p-2">
                    <button
                      className="py-1 px-3 bg-orange-400 text-white font-semibold rounded-lg hover:bg-orange-500"
                      onClick={() => setClientNumber(5)}
                    >
                      Вызвать
                    </button>
                  </td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="p-2">6</td>
                  <td className="p-2">Ли Чу Ван</td>
                  <td className="p-2">10:45</td>
                  <td className="p-2">Подача документов</td>
                </tr>
                <tr>
                  <td className="p-2">7</td>
                  <td className="p-2">Гагарин Иван Петрович</td>
                  <td className="p-2">11:00</td>
                  <td className="p-2">Возврат документов</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-80 bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Клиент с талоном №{clientNumber}</h3>
          <div className="space-y-2">
            <p className="text-gray-600">Время ожидания: <span className="font-semibold">00:00:00</span></p>
            <p className="text-gray-600">Время обслуживания: 00:00:00</p>
            <p className="text-gray-600">Имя: -</p>
            <p className="text-gray-600">Почта: -</p>
            <p className="text-gray-600">-</p>
          </div>
          {status === 'Обслуживание' && (
            <>
              <button
                className="w-full mt-4 py-2 bg-orange-400 text-white font-semibold rounded-lg hover:bg-orange-500"
                //onClick={() => setClientNumber(clientNumber + 1)}
              >
                Повторный вызов 
              </button>
              <button className="w-full mt-2 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">
                Пришел
              </button>
              <button className="w-full mt-2 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600">
                Не пришел
              </button>
            </>
          )}
          {status === 'Обед' && (
            <p className="text-center text-gray-600 mt-4">Режим обеда, вызовы приостановлены</p>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Общие данные</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="p-2 bg-purple-100 rounded-full">
              <HiUsers className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600">Клиентов в очереди</p>
              <p className="text-2xl font-bold text-gray-800">0</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="p-2 bg-green-100 rounded-full">
              <HiChartBar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600">Принято за сегодня</p>
              <p className="text-2xl font-bold text-gray-800">0</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="p-2 bg-pink-100 rounded-full">
              <HiMenu className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="text-gray-600">Явилось / Не явилось</p>
              <p className="text-2xl font-bold text-gray-800">0/0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestServicePage;