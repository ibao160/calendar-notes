import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  format, 
  isSameDay,
  addWeeks,
  subWeeks
} from 'date-fns';
import { vi } from 'date-fns/locale';

export default function WeekView({ token, currentDate, onDateChange }) {
  const [notes, setNotes] = useState([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(currentDate, { weekStartsOn: 1 }));
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    content: '',
    time: '',
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    setWeekStart(startOfWeek(currentDate, { weekStartsOn: 1 }));
  }, [currentDate]);

  useEffect(() => {
    fetchNotes();
  }, [weekStart, token]);

  const fetchNotes = async () => {
    try {
      const start = format(weekStart, 'yyyy-MM-dd');
      const end = format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      const response = await axios.get('/api/notes', {
        params: { startDate: start, endDate: end },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handlePrevWeek = () => {
    const newWeekStart = subWeeks(weekStart, 1);
    setWeekStart(newWeekStart);
    onDateChange(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = addWeeks(weekStart, 1);
    setWeekStart(newWeekStart);
    onDateChange(newWeekStart);
  };

  const handleAddNote = (date) => {
    setSelectedDate(date);
    setShowNoteForm(true);
    setFormData({ content: '', time: '', image: null });
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitNote = async (e) => {
    e.preventDefault();
    
    if (!formData.image) {
      alert('Vui lòng chọn ảnh');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('date', format(selectedDate, 'yyyy-MM-dd'));
      formDataToSend.append('time', formData.time);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('image', formData.image);

      await axios.post('/api/notes', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setShowNoteForm(false);
      fetchNotes();
      setFormData({ content: '', time: '', image: null });
      setImagePreview(null);
    } catch (error) {
      alert('Lỗi khi tạo ghi chú: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Bạn có chắc muốn xóa ghi chú này?')) return;

    try {
      await axios.delete(`/api/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotes();
    } catch (error) {
      alert('Lỗi khi xóa ghi chú');
    }
  };

  const getNotesForDate = (date) => {
    return notes.filter(note => isSameDay(new Date(note.date), date));
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-800">
            Tuần {format(weekStart, 'dd/MM')} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'dd/MM/yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrevWeek}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
            >
              ← Tuần trước
            </button>
            <button
              onClick={handleNextWeek}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
            >
              Tuần sau →
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const dayNotes = getNotesForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={index}
                className={`bg-white rounded-lg border-2 p-4 min-h-[300px] ${
                  isToday ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase">
                      {format(day, 'EEEE', { locale: vi })}
                    </div>
                    <div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddNote(day)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition"
                    title="Thêm ghi chú"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  {dayNotes.map(note => (
                    <div key={note._id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      {note.time && (
                        <div className="text-xs font-semibold text-blue-600 mb-1">
                          🕐 {note.time}
                        </div>
                      )}
                      <p className="text-sm text-gray-700 mb-2">{note.content}</p>
                      {note.imageUrl && (
                        <img
                          src={note.imageUrl}
                          alt="Note"
                          className="w-full h-32 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-90"
                          onClick={() => window.open(note.imageUrl, '_blank')}
                        />
                      )}
                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Note Form Modal */}
      {showNoteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              Thêm ghi chú - {format(selectedDate, 'dd/MM/yyyy', { locale: vi })}
            </h3>

            <form onSubmit={handleSubmitNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Thời gian (tùy chọn)</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nội dung *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Nhập nội dung ghi chú..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ảnh *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 w-full h-48 object-cover rounded-lg"
                  />
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Lưu ghi chú'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteForm(false);
                    setImagePreview(null);
                  }}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}