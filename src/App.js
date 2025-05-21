import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginClient from './LoginClient';
import DatePickerPage from './DatePickerPage';
import EmployeeLoginPage from './EmployeeLoginPage';
import GuestServicePage from './GuestServicePage';
import VerificationCodePage from './VerificationCodePage';
import DashboardPage from './DashboardPage';
import './App.css';
import AdminPanelPage from './AdminPanelPage';

// const App = () => {
//   //return <GuestServicePage />;
//   //return <EmployeeLoginPage />;
// //return <LoginClient />;
//    //return <DatePickerPage />;
//   //return <VerificationCodePage/>;
//   //return <DashboardPage/>;
//  // return <AdminPanelPage/>;
// };

function App() {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<LoginClient />} />
      <Route path="/employee-login" element={<EmployeeLoginPage />} />
      <Route path="/date-picker" element={<DatePickerPage />} />
      <Route path="/verify-code" element={<VerificationCodePage />} />
      <Route path="/guest-service" element={<GuestServicePage />} />
      <Route path="/admin-panel" element={<AdminPanelPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;