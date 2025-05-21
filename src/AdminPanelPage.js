import React, { useState } from 'react';

const AdminPanelPage = () => {
  const [showQueue, setShowQueue] = useState(false);
  const [showEmployees, setShowEmployees] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Пример данных для очереди
  const queue = [
    { id: 1, ticket: '5	Иванов Иван Иванович	10:30	Консультация 17.05.2025' },
    { id: 2, ticket: '6	Ли Чу Ван	10:45	Подача документов 17.05.2025' },
    { id: 3, ticket: '7	Гагарин Иван Петрович	11:00	Возврат документов 17.05.2025' },
    { id: 4, ticket: '8 Петров Александр Сергеевич	10:00 Подача документов 18.05.2025' },
    { id: 5, ticket: '9 Башаров Марат Тигранович	10:15 Консультация 18.05.2025' },
  ];

  // Пример данных для сотрудников
  const [employees, setEmployees] = useState([
    {
      id: 1,
      fullName: 'Иванов Иван Иванович',
      number: 'Сотрудник №1',
      clientsServed: 15,
      workTime: '6 часов 30 минут',
      date: '17.05.2025',
    },
    {
      id: 2,
      fullName: 'Петров Пётр Петрович',
      number: 'Сотрудник №2',
      clientsServed: 12,
      workTime: '5 часов 45 минут',
      date: '17.05.2025',
    },
    {
      id: 3,
      fullName: 'Сидорова Анна Сергеевна',
      number: 'Сотрудник №3',
      clientsServed: 18,
      workTime: '7 часов 10 минут',
      date: '17.05.2025',
    },
  ]);

  // Состояние для формы
  const [newEmployee, setNewEmployee] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    phone: '',
    email: '',
    role: 'Сотрудник', // Значение по умолчанию
  });

  // Обработка изменений в форме
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
  };

  // Добавление нового сотрудника
  const handleAddEmployee = (e) => {
    e.preventDefault();
    const newId = employees.length + 1;
    const fullName = `${newEmployee.lastName} ${newEmployee.firstName} ${newEmployee.middleName}`;
    const number = `${newEmployee.role} №${newId}`; // Например, "Сотрудник №4"
    setEmployees([...employees, { id: newId, fullName, number, clientsServed: 0, workTime: '0 часов', date: '17.05.2025' }]);
    setNewEmployee({ lastName: '', firstName: '', middleName: '', phone: '', email: '', role: 'Сотрудник' }); // Сброс формы
    setShowEditForm(false); // Закрытие формы после добавления
    console.log('Новый сотрудник добавлен:', { id: newId, fullName, number, ...newEmployee }); // Вывод в консоль для проверки
  };

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
          <ul className="space-y-2">
            {queue.map((item) => (
              <li key={item.id} className="text-lg text-gray-700">
                {item.ticket}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Отображение сотрудников */}
      {showEmployees && (
        <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Сотрудники</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b-2 border-gray-300 p-3 text-left text-gray-700">ФИО</th>
                  <th className="border-b-2 border-gray-300 p-3 text-left text-gray-700">Номер</th>
                  <th className="border-b-2 border-gray-300 p-3 text-left text-gray-700">Принято людей</th>
                  <th className="border-b-2 border-gray-300 p-3 text-left text-gray-700">Время работы</th>
                  <th className="border-b-2 border-gray-300 p-3 text-left text-gray-700">Дата</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Форма для создания сотрудника */}
      {showEditForm && (
        <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Добавить нового сотрудника</h2>
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
                required
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
              <label className="block text-gray-700 text-sm font-bold mb-2">Роль</label>
              <select
                name="role"
                value={newEmployee.role}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="Сотрудник">Сотрудник</option>
                <option value="Админ">Админ</option>
              </select>
            </div>
            <button
              type="submit"
              className="py-2 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all duration-300"
            >
              Добавить сотрудника
            </button>
          </form>
        </div>
      )}

      {/* Пространство для будущего контента */}
      <div className="flex-1 text-gray-800 text-center">
        <p className="text-xl">Здесь будет дополнительный контент для администратора</p>
      </div>
    </div>
  );
};

export default AdminPanelPage;