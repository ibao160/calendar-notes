import { useState, useEffect } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import { vi } from 'date-fns/locale';
import axios from 'axios';

export default function MonthView({ token, currentDate, onDateClick, onDateChange }) {
  const [monthStart, setMonthStart] = useState(startOfMonth(currentDate));
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    setMonthStart(startOfMonth(currentDate));
  }, [currentDate]);

  useEffect(() => {
    fetchNotesForMonth();
  }, [monthStart, token]);

  const fetchNotesForMonth = async () => {
    try {
      const start = format(startOfWeek(monthStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      const response = await axios.get('/api/notes', {
        params: { startDate: start, endDate: end },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handlePrevMonth = () => {
    const newMonth = subMonths(monthStart, 1);
    setMonthStart(newMonth);
    onDateChange(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(monthStart, 1);
    setMonthStart(newMonth);
    onDateChange(newMonth);
  };

  const getNotesCountForDate = (date) => {
    return notes.filter(note => isSameDay(new Date(note.date), date)).length;
  };

  const renderCalendar = () => {
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const notesCount = getNotesCountForDate(currentDay);
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        const isToday = isSameDay(currentDay, new Date());

        days.push(
          <div
            key={currentDay}
            onClick={() => isCurrentMonth && onDateClick(currentDay)}
            className={`
              min-h-[80px] md:min-h-[120px] border border-gray-200 p-2 cursor-pointer transition
              ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-blue-50'}
              ${isToday ? 'ring-2 ring-blue-500' : ''}
            `}
          >
            <div className={`
              text-sm md:text-base font-semibold mb-1
              ${isToday ? 'text-blue-600' : ''}
            `}>
              {format(currentDay, 'd')}
            </div>
            {notesCount > 0 && isCurrentMonth && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>{notesCount} ghi chú</span>
              </div>
            )}
          </div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div key={day} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return rows;
  };

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {format(monthStart, 'MMMM yyyy', { locale: vi })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
            >
              ← Tháng trước
            </button>
            <button
              onClick={handleNextMonth}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
            >
              Tháng sau →
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
            {weekDays.map(day => (
              <div key={day} className="p-3 text-center font-semibold text-gray-700 text-sm md:text-base">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {renderCalendar()}
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          💡 Nhấp vào một ngày để xem chi tiết và thêm ghi chú
        </div>
      </div>
    </div>
  );
}