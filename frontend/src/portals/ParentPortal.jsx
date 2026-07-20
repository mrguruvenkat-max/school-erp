import { useState, useEffect } from 'react';
import { 
  User, Calendar, GraduationCap, ClipboardList, LogOut, Menu, X,
  BookMarked, FileDown, BellRing, QrCode, FileText, Download,
  Printer, Award, MessageSquare
} from 'lucide-react';
import apLogo from '../assets/ap-logo.png';
import { API_URL, parseResponse } from '../config/api';

export default function ParentPortal({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('HOME'); // HOME, PROFILE, ATTENDANCE, MARKS, HOMEWORK, TIMETABLE, REMARKS, CERTIFICATES, DOWNLOADS, NOTICES
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [childData, setChildData] = useState(null);
  const [myNotifications, setMyNotifications] = useState([]);
  
  // Active calendar date detail
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  const fetchParentChildData = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const studentId = user.studentId || 1;
      
      const response = await fetch(`${API_URL}/api/students/profile/${studentId}`, { headers });
      const data = await parseResponse(response);
      setChildData(data);

      const resNotifications = await fetch(`${API_URL}/api/academic/notifications`, { headers });
      const personalAlerts = await parseResponse(resNotifications);

      const resComp = await fetch(`${API_URL}/api/academic/notices`, { headers });
      const list = await parseResponse(resComp);

      const combined = [...personalAlerts, ...list].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setMyNotifications(combined);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchParentChildData();

    const handleAttendanceChange = () => {
      fetchParentChildData();
    };

    window.addEventListener('attendance_changed', handleAttendanceChange);
    return () => {
      window.removeEventListener('attendance_changed', handleAttendanceChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!childData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-[#F7F9FC]">
        <div className="w-10 h-10 rounded border-2 border-[#0F7A3D] border-t-transparent animate-spin"></div>
        <p className="text-xs font-bold text-slate-500">Connecting to parent channel databases...</p>
      </div>
    );
  }

  const { student, attendancePercentage, calendarView, marks } = childData;

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
      
      days.push({ day, dateStr, status: dayStatus, record });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Mocked details for student progress
  const homeworkList = [
    { id: 1, subject: "Mathematics", task: "Solve Algebra exercise 4.2 (Quadratic Equations)", dueDate: "2026-07-22", status: "PENDING" },
    { id: 2, subject: "General Science", task: "Complete digestive system diagram with labels", dueDate: "2026-07-20", status: "PENDING" },
    { id: 3, subject: "English Literature", task: "Write summary of Chapter 3: 'The Golden Harvest'", dueDate: "2026-07-25", status: "SUBMITTED" }
  ];

  const teacherRemarks = [
    { date: "2026-07-16", remark: "Excellent participation in Chemistry laboratory modules.", teacher: "Smt. P. Lakshmi" },
    { date: "2026-07-10", remark: "Consistently submits Algebra logs on time. Maintain progress.", teacher: "Sri K. Rama Rao" }
  ];

  const weeklyTimetable = [
    { period: 1, time: "09:00 - 09:45", mon: "Math (Room 102)" },
    { period: 2, time: "09:45 - 10:30", mon: "Science (Lab B)" },
    { period: 3, time: "10:30 - 11:15", mon: "English (Room 102)" },
    { period: 4, time: "11:15 - 12:00", mon: "Telugu (Room 104)" }
  ];

  const printDocument = () => {
    alert("Initiating verified print session...");
    window.print();
  };

  return (
    <div className="flex h-screen bg-[#F7F9FC] text-slate-800 font-sans overflow-hidden antialiased">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex flex-col lg:w-64 md:w-20 bg-white border-r border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center space-x-3 p-5 border-b border-slate-200 justify-center lg:justify-start">
          <img className="h-10 w-auto shrink-0" src={apLogo} alt="AP Gov Logo" />
          <div className="hidden lg:block text-left">
            <h2 className="font-bold text-xs text-[#0F7A3D] tracking-wider leading-tight">AP SCHOOL ERP 3.0</h2>
            <span className="text-[9px] text-[#D97706] font-bold uppercase tracking-wider">Parent monitor</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-left">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-3">Dashboard</p>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('HOME')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'HOME' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User size={14} />
                <span className="hidden lg:inline">Child Overview</span>
              </button>
              <button 
                onClick={() => setActiveTab('PROFILE')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'PROFILE' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User size={14} />
                <span className="hidden lg:inline">Student Profile Card</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-3">Academics</p>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('ATTENDANCE')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'ATTENDANCE' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar size={14} />
                <span className="hidden lg:inline">Attendance Log</span>
              </button>
              <button 
                onClick={() => setActiveTab('MARKS')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'MARKS' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <GraduationCap size={14} />
                <span className="hidden lg:inline">Marks Registry</span>
              </button>
              <button 
                onClick={() => setActiveTab('HOMEWORK')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'HOMEWORK' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookMarked size={14} />
                <span className="hidden lg:inline">Homework log</span>
              </button>
              <button 
                onClick={() => setActiveTab('TIMETABLE')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'TIMETABLE' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ClipboardList size={14} />
                <span className="hidden lg:inline">Class Timetable</span>
              </button>
              <button 
                onClick={() => setActiveTab('REMARKS')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'REMARKS' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MessageSquare size={14} />
                <span className="hidden lg:inline">Teacher Remarks</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-3">Student Services</p>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('CERTIFICATES')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'CERTIFICATES' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Award size={14} />
                <span className="hidden lg:inline">Certificates</span>
              </button>
              <button 
                onClick={() => setActiveTab('DOWNLOADS')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'DOWNLOADS' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileDown size={14} />
                <span className="hidden lg:inline">Downloads</span>
              </button>
              <button 
                onClick={() => setActiveTab('NOTICES')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'NOTICES' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BellRing size={14} />
                <span className="hidden lg:inline">School Notices</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200">
          <button 
            onClick={onLogout}
            className="w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer justify-center lg:justify-start"
          >
            <LogOut size={14} />
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* PORTAL HEADER */}
        <header className="bg-white border-b border-slate-200 py-3.5 px-6 flex justify-between items-center shadow-xs">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1 rounded text-[#0F7A3D] hover:bg-slate-100 cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <div className="text-left">
              <h2 className="text-sm font-extrabold text-slate-800">
                Guardian Monitor: {user.username}
              </h2>
              <p className="text-[10px] text-slate-405 uppercase tracking-wider font-bold">
                Student: {student.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="bg-emerald-50 text-[#0F7A3D] font-bold px-2.5 py-1 rounded text-[11px] border border-emerald-100">
              Child Attendance: {Math.round(attendancePercentage)}%
            </span>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {/* ========================================================================= */}
          {/* TAB: HOME VIEW */}
          {/* ========================================================================= */}
          {activeTab === 'HOME' && (
            <div className="space-y-6 text-left">
              
              {/* Row 1: Profile Summary */}
              <div className="bg-white border border-slate-200 p-6 rounded flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-xl text-[#0F7A3D]">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">Ward Progress Monitor: {student.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Roll Number: <b>{student.rollNumber}</b> | Standard: <b>Class {student.class.grade}</b> | Admission: <b>{student.admissionNumber}</b>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Parent / Guardian Mobile: <b>{student.parentMobile}</b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-slate-50 p-1.5 border border-slate-200 rounded">
                    <QrCode size={40} className="text-slate-700" />
                  </div>
                </div>
              </div>

              {/* Row 2: Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">Cumulative Attendance</span>
                  <p className="text-lg font-extrabold text-[#0F7A3D] mt-1">{Math.round(attendancePercentage)}%</p>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Eligible status verified</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">Report Card Average</span>
                  <p className="text-lg font-extrabold text-blue-600 mt-1">
                    {marks.length > 0 ? Math.round(marks.reduce((a, b) => a + (b.marksObtained / b.maxMarks * 100), 0) / marks.length) : 0}%
                  </p>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Latest Unit Exam grades</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">Active Homework</span>
                  <p className="text-lg font-extrabold text-[#D97706] mt-1">2 Assigned</p>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Due this week</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">Unread Notices</span>
                  <p className="text-lg font-extrabold text-purple-600 mt-1">{myNotifications.length} Active</p>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Circular boards</span>
                </div>
              </div>

              {/* Row 3: Timetable and remarks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Timetable */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">Daily Class Schedule</h4>
                  <div className="space-y-2">
                    {weeklyTimetable.map((slot, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-slate-200 rounded text-xs bg-slate-50">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Period {slot.period}</span>
                          <p className="font-bold text-slate-800 mt-0.5">{slot.mon}</p>
                        </div>
                        <span className="text-slate-400 text-[10px] font-semibold">{slot.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remarks */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">Teacher Conduct Remarks</h4>
                  <div className="space-y-3">
                    {teacherRemarks.map((rem, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                        <p className="text-slate-655 italic">"{rem.remark}"</p>
                        <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 font-bold">
                          <span>{rem.teacher}</span>
                          <span>{rem.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PROFILE CARD */}
          {/* ========================================================================= */}
          {activeTab === 'PROFILE' && (
            <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded text-left overflow-hidden">
              <div className="bg-[#0F7A3D] text-white p-6 border-b-4 border-[#D97706]">
                <h3 className="text-base font-extrabold uppercase tracking-wider">Government of Andhra Pradesh</h3>
                <p className="text-[11px] text-emerald-100 uppercase tracking-widest font-bold">Student Identification Registry</p>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-4 flex flex-col items-center justify-between border-b md:border-b-0 pb-6 md:pb-0 md:border-r border-slate-100 pr-0 md:pr-8 gap-6 text-center">
                  <div className="space-y-4">
                    <div className="w-32 h-32 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-4xl text-[#0F7A3D] shadow-sm">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{student.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Student ID Card</span>
                    </div>
                  </div>

                  <div className="space-y-4 w-full">
                    <div className="bg-slate-50 p-3 border border-slate-200 rounded inline-block">
                      <QrCode size={80} className="text-slate-700" />
                    </div>
                    <button 
                      onClick={printDocument}
                      className="w-full flex items-center justify-center space-x-2 bg-[#0F7A3D] hover:bg-emerald-800 text-white text-xs font-bold py-2 px-4 rounded border border-emerald-900 cursor-pointer shadow-sm"
                    >
                      <Printer size={13} />
                      <span>Download ID Card</span>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-8 space-y-4">
                  <h4 className="text-xs font-extrabold text-[#0F7A3D] uppercase tracking-wider pb-2 border-b border-slate-100">Official SIS Registry Records</h4>
                  
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Admission Number</span>
                      <p className="font-mono font-bold text-slate-800 mt-0.5">{student.admissionNumber}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Roll Number</span>
                      <p className="font-bold text-slate-800 mt-0.5">{student.rollNumber}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Class Grade</span>
                      <p className="font-bold text-slate-800 mt-0.5">Class {student.class.grade}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Date of Birth</span>
                      <p className="font-bold text-slate-800 mt-0.5">{student.dob || "2012-05-15"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Blood Group</span>
                      <p className="font-bold text-slate-800 mt-0.5">{student.bloodGroup || "O+ Positive"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Parent / Guardian Name</span>
                      <p className="font-bold text-slate-800 mt-0.5">{student.parentName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Primary Contact Number</span>
                      <p className="font-mono font-bold text-slate-800 mt-0.5">{student.parentMobile}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Residential Address</span>
                      <p className="font-semibold text-slate-600 mt-0.5 leading-relaxed">{student.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: ATTENDANCE */}
          {/* ========================================================================= */}
          {activeTab === 'ATTENDANCE' && (
            <div className="space-y-6 text-left">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-slate-200 p-4 rounded text-xs">
                <div className="p-2 border-r border-slate-100 last:border-0 text-left">
                  <span className="text-slate-400 font-bold">Attendance Percentage</span>
                  <p className="text-lg font-extrabold text-[#0F7A3D] mt-0.5">{Math.round(attendancePercentage)}%</p>
                </div>
                <div className="p-2 border-r border-slate-100 last:border-0 text-left">
                  <span className="text-slate-400 font-bold">Total Present Days</span>
                  <p className="text-lg font-extrabold text-blue-600 mt-0.5">
                    {calendarView.filter(c => c.status === 'PRESENT').length} Days
                  </p>
                </div>
                <div className="p-2 flex items-center justify-end">
                  <button onClick={printDocument} className="px-3 py-1.5 border border-slate-300 rounded bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold cursor-pointer">
                    Download Attendance Report
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Calendar Grid */}
                <div className="bg-white border border-slate-200 p-6 rounded lg:col-span-2 space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">June 2026 Monthly Calendar Roster</h4>
                  
                  <div className="grid grid-cols-7 gap-2 text-center font-bold text-slate-500 uppercase text-[10px]">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day) => (
                      <button
                        key={day.day}
                        onClick={() => day.record && setSelectedCalendarDate(day)}
                        disabled={day.status === 'WEEKEND' || day.status === 'NO_RECORD'}
                        className={`h-11 border rounded flex flex-col justify-between p-1 transition-all ${
                          day.status === 'PRESENT' ? 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100 cursor-pointer' :
                          day.status === 'ABSENT' ? 'bg-red-50 border-red-200 text-red-950 hover:bg-red-100 cursor-pointer' :
                          day.status === 'WEEKEND' ? 'bg-slate-100 border-transparent text-slate-400 cursor-not-allowed' :
                          'bg-white border-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-[10px] font-bold">{day.day}</span>
                        <span className="text-[9px] font-bold self-end">
                          {day.status === 'PRESENT' ? 'P' : day.status === 'ABSENT' ? 'A' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Log report details */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">Period-wise log details</h4>
                  {selectedCalendarDate ? (
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                        <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Date Log</span>
                        <p className="text-xs font-extrabold text-[#0F7A3D] mt-0.5">{selectedCalendarDate.dateStr}</p>
                      </div>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto">
                        {selectedCalendarDate.record.details.map((d, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 rounded border border-slate-100 text-xs bg-slate-50">
                            <span className="font-bold text-slate-750">Period {d.period}</span>
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              d.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-805' : 'bg-red-100 text-red-805'
                            }`}>
                              {d.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-12 text-center">Click a calendar cell to view daily period status logs.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: MARKS */}
          {/* ========================================================================= */}
          {activeTab === 'MARKS' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Child Examination Marks Registry</h4>
                <button onClick={printDocument} className="px-3.5 py-2 bg-[#0F7A3D] hover:bg-emerald-800 text-white text-[11px] font-bold rounded flex items-center space-x-1.5 cursor-pointer shadow-sm">
                  <Printer size={12} />
                  <span>Print Report Card</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                      <th className="px-4 py-3 border border-slate-200">Subject</th>
                      <th className="px-4 py-3 border border-slate-200">Exam Stage</th>
                      <th className="px-4 py-3 border border-slate-200">Marks Obtained</th>
                      <th className="px-4 py-3 border border-slate-200">Max Marks</th>
                      <th className="px-4 py-3 border border-slate-200">Percent</th>
                      <th className="px-4 py-3 border border-slate-200">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marks.map((m) => {
                      const percent = Math.round((m.marksObtained / m.maxMarks) * 100);
                      let grade = 'F';
                      if (percent >= 90) grade = 'A+';
                      else if (percent >= 75) grade = 'A';
                      else if (percent >= 60) grade = 'B';
                      else if (percent >= 50) grade = 'C';
                      else if (percent >= 35) grade = 'D';

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 border border-slate-200 font-bold text-slate-800">{m.subject ? m.subject.name : 'Subject'}</td>
                          <td className="px-4 py-3 border border-slate-200 font-semibold text-slate-500">{m.examType.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-3 border border-slate-200 font-bold text-[#0F7A3D]">{m.marksObtained}</td>
                          <td className="px-4 py-3 border border-slate-200 text-slate-400 font-semibold">{m.maxMarks}</td>
                          <td className="px-4 py-3 border border-slate-200 font-extrabold text-blue-705">{percent}%</td>
                          <td className="px-4 py-3 border border-slate-200 font-extrabold text-slate-700">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              percent >= 35 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {marks.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-slate-400 font-bold">No academic mark registries uploaded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: HOMEWORK */}
          {/* ========================================================================= */}
          {activeTab === 'HOMEWORK' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Assigned Homework Monitor</h4>
                <p className="text-xs text-slate-400 mt-0.5">Track your child's weekly homework submissions and pending statuses.</p>
              </div>

              <div className="space-y-4">
                {homeworkList.map((hw) => (
                  <div key={hw.id} className="p-4 border border-slate-200 rounded bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-800 uppercase">{hw.subject}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        hw.status === 'SUBMITTED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {hw.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-655 font-semibold leading-relaxed bg-white p-3 rounded border border-slate-150">{hw.task}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                      <span>Due Date: {hw.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: TIMETABLE */}
          {/* ========================================================================= */}
          {activeTab === 'TIMETABLE' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Class Schedule Timetable</h4>
                <p className="text-xs text-slate-400 mt-0.5">Academic periods allocated for the class.</p>
              </div>

              <div className="space-y-3">
                {weeklyTimetable.map((slot, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-slate-200 rounded text-xs bg-slate-50">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Period {slot.period}</span>
                      <p className="font-bold text-slate-800 mt-0.5">{slot.mon}</p>
                    </div>
                    <span className="text-slate-400 text-[10px] font-semibold">{slot.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: REMARKS */}
          {/* ========================================================================= */}
          {activeTab === 'REMARKS' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Faculty Remarks Feed</h4>
                <p className="text-xs text-slate-400 mt-0.5">Notes, warnings, and feedback compiled by classroom teachers.</p>
              </div>

              <div className="space-y-4">
                {teacherRemarks.map((rem, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded bg-slate-50/50 text-xs">
                    <p className="text-slate-700 italic">"{rem.remark}"</p>
                    <div className="flex justify-between items-center mt-3 text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-2">
                      <span>{rem.teacher}</span>
                      <span>{rem.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: CERTIFICATES */}
          {/* ========================================================================= */}
          {activeTab === 'CERTIFICATES' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Child Certificates Download</h4>
                <p className="text-xs text-slate-400 mt-0.5">Download verified copies of active Bonafide, Study, and ID cards.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["Bonafide Certificate", "Study Certificate", "Attendance Certificate", "Progress Report"].map((title, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded bg-slate-50/50 flex justify-between items-center text-xs">
                    <div>
                      <h5 className="font-extrabold text-slate-800 uppercase tracking-wider">{title}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">Verified Principal Approval Copy</p>
                    </div>
                    <button onClick={printDocument} className="px-3.5 py-1.5 bg-[#0F7A3D] text-white text-[11px] font-bold rounded flex items-center space-x-1 hover:bg-emerald-800 cursor-pointer shadow-sm">
                      <Download size={12} />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOWNLOADS */}
          {/* ========================================================================= */}
          {activeTab === 'DOWNLOADS' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Parent Manuals and Guidelines</h4>
                <p className="text-xs text-slate-400 mt-0.5">Guides regarding school timings, attendance mandates, and portal monitoring tools.</p>
              </div>

              <div className="space-y-3">
                {[
                  { title: "Parent SIS Monitoring Guide (PDF)", size: "1.2 MB" },
                  { title: "Academic Session Calendar 2026-27 (PDF)", size: "2.1 MB" },
                  { title: "Mana Badi Infrastructure Quality Standards (PDF)", size: "3.2 MB" }
                ].map((doc, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-slate-200 rounded hover:bg-slate-50 transition text-xs">
                    <div className="flex items-center space-x-2 font-bold text-slate-850">
                      <FileText size={14} className="text-slate-400" />
                      <span>{doc.title}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] text-slate-400 font-bold">{doc.size}</span>
                      <button 
                        onClick={() => alert(`Downloading: ${doc.title}`)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 text-slate-700 font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: NOTICES */}
          {/* ========================================================================= */}
          {activeTab === 'NOTICES' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">School Circular Board Announcements</h4>
                <p className="text-xs text-slate-400 mt-0.5">Critical notifications distributed from the School Education Department.</p>
              </div>

              <div className="divide-y divide-slate-200">
                {myNotifications.map((n) => (
                  <div key={n.id} className="py-4 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-xs text-[#0F7A3D] uppercase tracking-wider">{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-655 font-semibold leading-relaxed">{n.content}</p>
                  </div>
                ))}
                {myNotifications.length === 0 && (
                  <p className="text-xs text-slate-400 py-6 text-center font-bold">No active board notifications found.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex md:hidden justify-start">
          <div className="w-64 bg-white h-full flex flex-col p-4 space-y-6 shadow-2xl relative text-left">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <img className="h-9 w-auto" src={apLogo} alt="AP logo" />
              <div>
                <h3 className="font-bold text-xs text-[#0F7A3D]">AP School ERP 3.0</h3>
                <span className="text-[9px] text-[#D97706] font-bold uppercase">Parent Portal</span>
              </div>
            </div>

            <nav className="flex-1 space-y-1">
              {[
                { id: 'HOME', name: 'Child Overview', icon: User },
                { id: 'PROFILE', name: 'Student Profile Card', icon: User },
                { id: 'ATTENDANCE', name: 'Attendance Log', icon: Calendar },
                { id: 'MARKS', name: 'Marks Registry', icon: GraduationCap },
                { id: 'HOMEWORK', name: 'Homework log', icon: BookMarked },
                { id: 'TIMETABLE', name: 'Class Timetable', icon: ClipboardList },
                { id: 'REMARKS', name: 'Teacher Remarks', icon: MessageSquare },
                { id: 'CERTIFICATES', name: 'Certificates', icon: Award },
                { id: 'DOWNLOADS', name: 'Downloads', icon: FileDown },
                { id: 'NOTICES', name: 'School Notices', icon: BellRing }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer ${
                      activeTab === tab.id ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-150">
              <button 
                onClick={onLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
