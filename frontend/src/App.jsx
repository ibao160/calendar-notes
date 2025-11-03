import { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from './components/Auth';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const handleDateClickFromMonth = (date) => {
    setCurrentDate(date);
    setActiveTab('week');
  };

  const handleDateChange = (date) => {
    setCurrentDate(date);
  };

  if (!user || !token) {
    return <Auth onLogin={handleLogin} />;
  }

  // Nếu là admin, hiển thị Admin Dashboard
  if (user.isAdmin) {
    return <AdminDashboard token={token} onLogout={handleLogout} />;
  }

  // User bình thường
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">📅 Lịch & Ghi Chú</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Xin chào, <span className="font-semibold">{user.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('week')}
              className={`
                px-6 py-3 font-medium transition border-b-2
                ${activeTab === 'week' 
                  ? 'text-blue-600 border-blue-600' 
                  : 'text-gray-600 border-transparent hover:text-gray-800'}
              `}
            >
              📋 Lịch Tuần
            </button>
            <button
              onClick={() => setActiveTab('month')}
              className={`
                px-6 py-3 font-medium transition border-b-2
                ${activeTab === 'month' 
                  ? 'text-blue-600 border-blue-600' 
                  : 'text-gray-600 border-transparent hover:text-gray-800'}
              `}
            >
              📆 Lịch Tháng
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'week' ? (
          <WeekView 
            token={token} 
            currentDate={currentDate}
            onDateChange={handleDateChange}
          />
        ) : (
          <MonthView 
            token={token} 
            currentDate={currentDate}
            onDateClick={handleDateClickFromMonth}
            onDateChange={handleDateChange}
          />
        )}
      </div>
    </div>
  );
}

export default App;