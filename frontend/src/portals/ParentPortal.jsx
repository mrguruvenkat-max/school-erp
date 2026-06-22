import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, GraduationCap, ClipboardList, 
  BellRing, LogOut, ShieldAlert, Menu, X
} from 'lucide-react';
import apLogo from '../assets/ap-logo.png';
import { API_URL, parseResponse } from '../config/api';

export default function ParentPortal({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, ATTENDANCE, MARKS, NOTIFICATIONS
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [childData, setChildData] = useState(null);
  const [myNotifications, setMyNotifications] = useState([]);
  
  // Active calendar date detail
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  useEffect(() => {
    fetchParentChildData();

    const handleAttendanceChange = () => {
      fetchParentChildData();
    };

    window.addEventListener('attendance_changed', handleAttendanceChange);
    return () => {
      window.removeEventListener('attendance_changed', handleAttendanceChange);
    };
  }, [token]);

  const fetchParentChildData = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const studentId = user.studentId || 1;
      
      const response = await fetch(`${API_URL}/api/students/profile/${studentId}`, { headers });
      const data = await parseResponse(response);
      setChildData(data);

      // Load parent-specific notifications
      const resNotifications = await fetch(`${API_URL}/api/academic/notifications`, { headers });
      const personalAlerts = await parseResponse(resNotifications);

      // Load notice board global circulars
      const resComp = await fetch(`${API_URL}/api/academic/notices`, { headers });
      const list = await parseResponse(resComp);

      // Combine notices and alerts, sorted by createdAt descending
      const combined = [...personalAlerts, ...list].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setMyNotifications(combined);

    } catch (err) {
      console.error(err);
    }
  };

  if (!childData) {
    return <div className="text-center py-12">Loading child academic profile...</div>;
  }

  const { student, attendancePercentage, calendarView, marks } = childData;

  const getLatestAttendanceSession = () => {
    if (!calendarView || calendarView.length === 0) return null;
    const sorted = [...calendarView].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0];
  };

  const latestSession = getLatestAttendanceSession();
  const periodsToday = [1, 2, 3, 4, 5, 6, 7].map(pNum => {
    const detail = latestSession ? latestSession.details.find(d => d.period === pNum) : null;
    return {
      period: pNum,
      status: detail ? detail.status : 'PENDING'
    };
  });

  const presentToday = periodsToday.reduce((acc, p) => {
    if (p.status === 'PRESENT') return acc + 1;
    return acc;
  }, 0);

  // Generate calendar days for visual grid (June 2026)
  const generateCalendarDays = () => {
    const days = [];
    const totalDays = 30;
    
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `2026-06-${day.toString().padStart(2, '0')}`;
      const record = calendarView.find(c => c.date === dateStr);
      
      let dayStatus = 'NO_RECORD';
      const d = new Date(dateStr);
      const dayOfWeek = d.getDay();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayStatus = 'WEEKEND';
      } else if (record) {
        dayStatus = record.status;
      }
      
      days.push({
        day,
        dateStr,
        status: dayStatus,
        record
      });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col lg:w-64 md:w-20 bg-[#004D20] text-white p-4 lg:p-6 shadow-xl z-20 border-r border-[#D4AF37]/20 shrink-0 transition-all duration-300">
        <div className="flex items-center space-x-3 mb-8 justify-center lg:justify-start">
          <img
            className="h-10 w-auto shrink-0"
            src={apLogo}
            alt="Emblem"
          />
          <div className="hidden lg:block">
            <h1 className="font-extrabold text-sm tracking-wider">AP PARENT</h1>
            <span className="text-xs text-[#D4AF37] font-semibold uppercase">{user.role}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 lg:px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer justify-center lg:justify-start ${
              activeTab === 'DASHBOARD' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
            }`}
            title="Child Progress"
          >
            <User size={18} className="shrink-0" />
            <span className="hidden lg:inline">Child Progress</span>
          </button>

          <button 
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 lg:px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer justify-center lg:justify-start ${
              activeTab === 'ATTENDANCE' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
            }`}
            title="Attendance Calendar"
          >
            <Calendar size={18} className="shrink-0" />
            <span className="hidden lg:inline">Attendance Calendar</span>
          </button>

          <button 
            onClick={() => setActiveTab('MARKS')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 lg:px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer justify-center lg:justify-start ${
              activeTab === 'MARKS' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
            }`}
            title="Academic Performance"
          >
            <GraduationCap size={18} className="shrink-0" />
            <span className="hidden lg:inline">Academic Performance</span>
          </button>

          <button 
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 lg:px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer justify-center lg:justify-start ${
              activeTab === 'NOTIFICATIONS' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
            }`}
            title="Notices & Alerts"
          >
            <BellRing size={18} className="shrink-0" />
            <span className="hidden lg:inline">Notices & Alerts</span>
          </button>
        </nav>

        <div className="pt-6 border-t border-emerald-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center lg:space-x-3 px-3 py-2 lg:px-4 rounded-lg text-sm font-semibold text-rose-300 hover:bg-rose-950/30 cursor-pointer justify-center lg:justify-start"
            title="Sign Out"
          >
            <LogOut size={18} className="shrink-0" />
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* HEADER BAR */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center shadow-xs">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-[#006B2D] hover:bg-slate-100 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#006B2D]">
                Parent View: {student.name}
              </h2>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Child Roll No: {student.rollNumber} • Class {student.class.grade}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs border border-emerald-200">
              Overall Attendance: {attendancePercentage}%
            </span>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6 text-left">

          {/* ========================================================================= */}
          {/* TAB: DASHBOARD */}
          {/* ========================================================================= */}
          {activeTab === 'DASHBOARD' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Progress summary card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:col-span-2 space-y-6">
                <h3 className="text-lg font-bold text-slate-700 border-b border-slate-100 pb-2">Academic Overview Dashboard</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-[#E8F5E9] border border-emerald-100 flex flex-col justify-between">
                    <span className="text-[10px] text-[#004D20] font-bold uppercase">Attendance Rate</span>
                    <h2 className="text-xl font-extrabold text-[#006B2D] mt-1">{student.attendancePercentage}%</h2>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col justify-between">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase">Present Periods</span>
                    <h2 className="text-xl font-extrabold text-emerald-700 mt-1">{student.presentPeriods}</h2>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex flex-col justify-between">
                    <span className="text-[10px] text-rose-800 font-bold uppercase">Absent Periods</span>
                    <h2 className="text-xl font-extrabold text-rose-700 mt-1">{student.absentPeriods}</h2>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-600 font-bold uppercase">Total Conducted</span>
                    <h2 className="text-xl font-extrabold text-slate-700 mt-1">{student.totalConductedPeriods}</h2>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F6FBF6] border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Class Level</span>
                    <h2 className="text-base font-extrabold text-slate-800 mt-1">Class {student.class.grade}</h2>
                  </div>
                </div>

                {/* Teacher remarks / details */}
                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Teacher Remarks & Recommendations</p>
                  <div className="p-4 rounded-xl border border-slate-100 bg-[#F6FBF6]/40 text-xs">
                    <p className="font-semibold text-slate-700">Remarks:</p>
                    <p className="text-slate-600 mt-1 italic">
                      {student.attendancePercentage < 75 
                        ? "Noticeable absences. Please ensure regular attendance for period tests."
                        : "Consistently attending and participating well in period lessons."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar child details */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 text-sm">
                  <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2">Student Profile Card</h4>
                  <div className="space-y-3">
                    <p><b>Name:</b> {student.name}</p>
                    <p><b>Roll No:</b> {student.rollNumber}</p>
                    <p><b>Admission No:</b> <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{student.admissionNumber}</span></p>
                    <p><b>Gender:</b> {student.gender}</p>
                    <p><b>Address:</b> {student.address}</p>
                  </div>
                </div>

                {/* Today's Attendance by Period */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 text-sm">
                  <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2">Today's Attendance by Period</h4>
                  <div className="space-y-2">
                    {periodsToday.map((p) => {
                      let mark = '○';
                      let markClass = 'text-slate-400';
                      if (p.status === 'PRESENT') {
                        mark = '✓';
                        markClass = 'text-emerald-600 font-extrabold';
                      } else if (p.status === 'ABSENT') {
                        mark = '✗';
                        markClass = 'text-rose-600 font-extrabold';
                      }
                      return (
                        <div key={p.period} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-b-0">
                          <span className="font-semibold text-slate-700">Period {p.period}</span>
                          <span className={`text-base ${markClass}`}>{mark}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600 space-y-1.5">
                    <p className="flex justify-between">
                      <span>Today's Present:</span>
                      <span className="font-bold text-slate-800">{presentToday} / {latestSession ? 7 : 0} Periods</span>
                    </p>
                    {latestSession && (
                      <p className="text-[10px] text-slate-400 italic text-right mt-1">
                        Report Date: {new Date(latestSession.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: ATTENDANCE CALENDAR */}
          {/* ========================================================================= */}
          {activeTab === 'ATTENDANCE' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Calendar Grid panel */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:col-span-2">
                <h4 className="font-bold text-slate-700 mb-2">June 2026 Attendance Grid</h4>
                <p className="text-xs text-gray-500 mb-6">Click on any date cell to view period-wise log reports.</p>
                
                <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-500 uppercase">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => (
                    <button
                      key={day.day}
                      onClick={() => day.record && setSelectedCalendarDate(day)}
                      disabled={day.status === 'WEEKEND' || day.status === 'NO_RECORD'}
                      className={`h-12 border rounded-lg flex flex-col justify-between p-1 transition-all ${
                        day.status === 'PRESENT' ? 'bg-teal-100/50 border-teal-200 text-teal-900 hover:bg-teal-100 cursor-pointer' :
                        day.status === 'ABSENT' ? 'bg-rose-100/50 border-rose-200 text-rose-900 hover:bg-rose-100 cursor-pointer' :
                        day.status === 'WEEKEND' ? 'bg-slate-100 border-transparent text-slate-400 cursor-not-allowed' :
                        'bg-white border-slate-200 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-[10px] font-bold">{day.day}</span>
                      <span className="text-[9px] font-semibold self-end">
                        {day.status === 'PRESENT' ? '✓' : day.status === 'ABSENT' ? '✗' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Day selection details */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
                <h4 className="font-bold text-slate-700 mb-4">Period-Wise Log Details</h4>
                {selectedCalendarDate ? (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-[#006B2D] border-b border-slate-100 pb-2">
                      Date Log: {selectedCalendarDate.dateStr}
                    </p>
                    <div className="space-y-2">
                      {selectedCalendarDate.record.details.map((d, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                          <span className="font-semibold text-slate-700">Period {d.period}</span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            d.status === 'PRESENT' ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {d.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 py-8 text-center">Click a marked date cell on the grid to reveal details.</p>
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: ACADEMIC PERFORMANCE */}
          {/* ========================================================================= */}
          {activeTab === 'MARKS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-3xl mx-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <h4 className="font-bold text-slate-700">Child Semester Report Card</h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#E8F5E9] text-[#004D20] uppercase text-xs font-bold">
                    <tr>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Exam Type</th>
                      <th className="px-4 py-3">Marks Obtained</th>
                      <th className="px-4 py-3">Max Marks</th>
                      <th className="px-4 py-3">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marks.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-800">{m.subject ? m.subject.name : 'Subject'}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{m.examType.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 font-bold text-[#006B2D]">{m.marksObtained}</td>
                        <td className="px-4 py-3 text-slate-500">{m.maxMarks}</td>
                        <td className="px-4 py-3 font-bold text-[#138A36]">
                          {Math.round((m.marksObtained / m.maxMarks) * 100)}%
                        </td>
                      </tr>
                    ))}
                    {marks.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-slate-400 text-xs font-semibold">No academic marks uploaded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: NOTIFICATIONS & ALERTS */}
          {/* ========================================================================= */}
          {activeTab === 'NOTIFICATIONS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-2xl mx-auto space-y-4">
              <h4 className="font-bold text-slate-700 mb-4">Circulars, Notices & Alerts</h4>
              
              <div className="space-y-4">
                {myNotifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 rounded-xl border flex space-x-3 text-xs ${
                      notif.category === 'ATTENDANCE' 
                        ? 'bg-rose-50 border-rose-200 text-rose-900' 
                        : notif.category === 'EXAM' 
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    {notif.category === 'ATTENDANCE' && <ShieldAlert className="text-rose-500 flex-shrink-0" size={18} />}
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{notif.title}</p>
                      <p className="leading-relaxed">{notif.content}</p>
                      <span className="text-[10px] text-gray-500 block">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                {myNotifications.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No recent circulars or notifications found.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
      {/* MOBILE HAMBURGER DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative flex flex-col w-64 max-w-xs bg-[#004D20] text-white p-6 shadow-2xl animate-slide-in">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-350 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="flex items-center space-x-3 mb-8">
              <img className="h-10 w-auto" src={apLogo} alt="Emblem" />
              <div>
                <h1 className="font-extrabold text-sm tracking-wider">AP PARENT</h1>
                <span className="text-xs text-[#D4AF37] font-semibold uppercase">{user.role}</span>
              </div>
            </div>
            <nav className="flex-1 space-y-2">
              <button 
                onClick={() => { setActiveTab('DASHBOARD'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'DASHBOARD' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
                }`}
              >
                <User size={18} />
                <span>Child Progress</span>
              </button>
              <button 
                onClick={() => { setActiveTab('ATTENDANCE'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'ATTENDANCE' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
                }`}
              >
                <Calendar size={18} />
                <span>Attendance Calendar</span>
              </button>
              <button 
                onClick={() => { setActiveTab('MARKS'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'MARKS' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
                }`}
              >
                <GraduationCap size={18} />
                <span>Academic Performance</span>
              </button>
              <button 
                onClick={() => { setActiveTab('NOTIFICATIONS'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'NOTIFICATIONS' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
                }`}
              >
                <BellRing size={18} />
                <span>Notices & Alerts</span>
              </button>
            </nav>
            <div className="pt-6 border-t border-emerald-800">
              <button 
                onClick={onLogout}
                className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-semibold text-rose-300 hover:bg-rose-950/30 cursor-pointer"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
