import React from 'react';

const DashboardPage = () => {
  // Пример данных для очереди ожидания
  const waitingQueue = [
    { id: 1, ticket: 'Талон №1' },
    { id: 2, ticket: 'Талон №2' },
    { id: 3, ticket: 'Талон №3' },
    { id: 4, ticket: 'Талон №4' },
    { id: 5, ticket: 'Талон №5' },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col items-stretch p-6">
      <div className="flex justify-between items-start w-full">
        {/* Колонка "Ожидание" */}
        <div className="flex-1 text-white text-center p-10 rounded-lg border-2 border-green-500">
          <h2 className="text-4xl font-bold mb-6">Ожидание</h2>
          <ul className="space-y-4">
            {waitingQueue.map((item) => (
              <li key={item.id} className="text-2xl">
                {item.ticket}
              </li>
            ))}
          </ul>
        </div>
        {/* Разделяющая полоса */}
        <div className="w-px h-full bg-green-500 mx-2"></div>
        {/* Колонка "Вызов" */}
        <div className="flex-1 text-white text-center p-10 rounded-lg border-2 border-green-500">
          <h2 className="text-4xl font-bold mb-6">Вызов</h2>
          {/* Пока пусто, можно добавить данные позже */}
        </div>
      </div>
      <div className="flex-1"></div> {/* Пустой блок для заполнения оставшегося пространства */}
    </div>
  );
};

export default DashboardPage;