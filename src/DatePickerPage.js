import React, { useState } from 'react';

const DatePickerPage = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [month, setMonth] = useState('Январь 2025');
  const [time, setTime] = useState('');

  // Дни месяца (для примера, январь 2025)
  const days = [
    { day: 30, weekDay: 'Пн', disabled: true },
    { day: 31, weekDay: 'Вт', disabled: true },
    { day: 1, weekDay: 'Ср' },
    { day: 2, weekDay: 'Чт' },
    { day: 3, weekDay: 'Пт' },
    { day: 4, weekDay: 'Сб' },
    { day: 5, weekDay: 'Вс' },
    { day: 6, weekDay: 'Пн' },
    { day: 7, weekDay: 'Вт' },
    { day: 8, weekDay: 'Ср' },
    { day: 9, weekDay: 'Чт' },
    { day: 10, weekDay: 'Пт' },
    { day: 11, weekDay: 'Сб' },
    { day: 12, weekDay: 'Вс' },
    { day: 13, weekDay: 'Пн' },
    { day: 14, weekDay: 'Вт' },
    { day: 15, weekDay: 'Ср' },
    { day: 16, weekDay: 'Чт' },
    { day: 17, weekDay: 'Пт', selected: true }, // Выбранный день
    { day: 18, weekDay: 'Сб' },
    { day: 19, weekDay: 'Вс' },
    { day: 20, weekDay: 'Пн' },
    { day: 21, weekDay: 'Вт' },
    { day: 22, weekDay: 'Ср' },
    { day: 23, weekDay: 'Чт' },
    { day: 24, weekDay: 'Пт' },
    { day: 25, weekDay: 'Сб' },
    { day: 26, weekDay: 'Вс' },
    { day: 27, weekDay: 'Пн' },
    { day: 28, weekDay: 'Вт' },
    { day: 29, weekDay: 'Ср' },
    { day: 30, weekDay: 'Чт' },
    { day: 31, weekDay: 'Пт' },
    { day: 1, weekDay: 'Сб', disabled: true },
    { day: 2, weekDay: 'Вс', disabled: true },
  ];

  // Временные слоты
  const timeSlots = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00','16:00', '17:00'];

  const handleDateClick = (day) => {
    if (!day.disabled) {
      setSelectedDate(day.day);
    }
  };

  const handleTimeClick = (time) => {
    setTime(time);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Бронирование очереди</h2>

        {/* Выбор цели */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Цель посещения
          </label>
          <select className="w-full p-2 border border-gray-300 rounded-lg">
            <option>Выберите цель</option>
            <option>Подача документов</option>
            <option>Консультация</option>
            <option>Возврат документов</option>
          </select>
        </div>

        {/* Выбор даты и времени */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Выбор даты и времени
          </label>
          <input
            type="text"
            value="ДД_ММ_ГГГГ --:--"
            readOnly
            className="w-full p-2 border border-gray-300 rounded-lg mb-2"
          />

          {/* Календарь */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <button className="text-gray-600">&larr;</button>
              <span className="text-gray-800 font-semibold">{month}</span>
              <button className="text-gray-600">&rarr;</button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                <div key={day} className="text-gray-600 font-semibold">
                  {day}
                </div>
              ))}
              {days.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`p-2 rounded-full ${
                    day.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : day.day === selectedDate
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-800 hover:bg-gray-200'
                  }`}
                  disabled={day.disabled}
                >
                  {day.day}
                </button>
              ))}
            </div>
          </div>

          {/* Выбор времени */}
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => handleTimeClick(slot)}
                className={`p-2 rounded-lg ${
                  time === slot ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Кнопка "Указать / Сегодня" */}
        <button className="w-full py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">
          Забронировать
        </button>
      </div>
    </div>
  );
};

export default DatePickerPage;