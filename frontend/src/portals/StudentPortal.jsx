import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, GraduationCap, ClipboardList, 
  MessageSquare, BellRing, LogOut, CheckCircle, XCircle, Send, Menu, X
} from 'lucide-react';
import apLogo from '../assets/ap-logo.png';
import { API_URL, parseResponse } from '../config/api';

export default function StudentPortal({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, ATTENDANCE, MARKS, TIMETABLE, COMPLAINTS
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  // Complaint Form
  const [complaintType, setComplaintType] = useState('TEACHER_ISSUE');
  const [complaintDetails, setComplaintDetails] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);
  
  // Notices
  const [notices, setNotices] = useState([]);
  
  // Calendar active selection details
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  useEffect(() => {
    fetchStudentData();

    const handleAttendanceChange = () => {
      fetchStudentData();
    };

    window.addEventListener('attendance_changed', handleAttendanceChange);
    return () => {
      window.removeEventListener('attendance_changed', handleAttendanceChange);
    };
  }, [token]);

  const fetchStudentData = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const response = await fetch(`${API_URL}/api/students/profile/${user.studentId || 1}`, { headers });
      const data = await parseResponse(response);
      setProfileData(data);

      // Fetch complaints
      const resComp = await fetch(`${API_URL}/api/complaints`, { headers });
      const complaints = await parseResponse(resComp);
      setMyComplaints(complaints);

      // Fetch Notices
      const resNot = await fetch(`${API_URL}/api/academic/notices`, { headers });
      const noticesData = await parseResponse(resNot);
      setNotices(noticesData);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComplaint = async (e) => {
    e.preventDefault();
    setComplaintSuccess(false);

    try {
      const response = await fetch(`${API_URL}/api/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: complaintType, details: complaintDetails })
      });

      await parseResponse(response);
      setComplaintDetails('');
      setComplaintSuccess(true);
      // refresh list
      const resComp = await fetch(`${API_URL}/api/complaints`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const complaints = await parseResponse(resComp);
      setMyComplaints(complaints);
    } catch (err) {
      console.error(err);
    }
  };

  if (!profileData) {
    return <div className="text-center py-12">Loading student profile...</div>;
  }

  const { student, attendancePercentage, calendarView, marks } = profileData;

  // Generate calendar days for visual grid
  // We'll generate dates for June 2026
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
        dayStatus = record.status; // PRESENT or ABSENT
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

  // Weekly Timetable structure
  const weeklyTimetable = [
    { period: 1, mon: "Maths", tue: "Science", wed: "English", thu: "Social", fri: "Maths", sat: "Telugu" },
    { period: 2, mon: "Science", tue: "English", wed: "Maths", thu: "Telugu", fri: "Science", sat: "Social" },
    { period: 3, mon: "English", tue: "Maths", wed: "Science", thu: "Social", fri: "Telugu", sat: "Lab" },
    { period: 4, mon: "Telugu", tue: "Social", wed: "Telugu", thu: "Maths", fri: "English", sat: "Lab" },
    { period: 5, mon: "Lunch", tue: "Lunch", wed: "Lunch", thu: "Lunch", fri: "Lunch", sat: "Lunch" },
    { period: 6, mon: "Maths", tue: "Science", wed: "English", thu: "Social", fri: "Maths", sat: "Telugu" },
    { period: 7, mon: "Science", tue: "English", wed: "Maths", thu: "Telugu", fri: "Science", sat: "Social" }
  ];

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
            <h1 className="font-extrabold text-sm tracking-wider">AP STUDENT SIS</h1>
            <span className="text-xs text-[#D4AF37] font-semibold uppercase">{user.role}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 lg:px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer justify-center lg:justify-start ${
              activeTab === 'DASHBOARD' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
            }`}
            title="My Profile"
          >
            <User size={18} className="shrink-0" />
            <span className="hidden lg:inline">My Profile</span>
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
            onClick={() => setActiveTab('TIMETABLE')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 lg:px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer justify-center lg:justify-start ${
              activeTab === 'TIMETABLE' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
            }`}
            title="Class Timetable"
          >
            <ClipboardList size={18} className="shrink-0" />
            <span className="hidden lg:inline">Class Timetable</span>
          </button>

          <button 
            onClick={() => setActiveTab('COMPLAINTS')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 lg:px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer justify-center lg:justify-start ${
              activeTab === 'COMPLAINTS' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
            }`}
            title="Feedback & Complaints"
          >
            <MessageSquare size={18} className="shrink-0" />
            <span className="hidden lg:inline">Feedback & Complaints</span>
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
                Welcome, {student.name}
              </h2>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Roll No: {student.rollNumber} • Class {student.class.grade}
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
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {/* ========================================================================= */}
          {/* TAB: DASHBOARD / PROFILE DETAILS */}
          {/* ========================================================================= */}
          {activeTab === 'DASHBOARD' && (
            <div className="space-y-6">
              {/* Statistics Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between text-left transition duration-300 hover:border-[#006B2D] hover:shadow-md">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Attendance %</span>
                  <span className="text-xl font-black text-[#006B2D] mt-1">{student.attendancePercentage}%</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between text-left transition duration-300 hover:border-[#006B2D] hover:shadow-md">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Present Periods</span>
                  <span className="text-xl font-black text-emerald-600 mt-1">{student.presentPeriods}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between text-left transition duration-300 hover:border-[#006B2D] hover:shadow-md">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Absent Periods</span>
                  <span className="text-xl font-black text-rose-600 mt-1">{student.absentPeriods}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between text-left transition duration-300 hover:border-[#006B2D] hover:shadow-md">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Conducted Periods</span>
                  <span className="text-xl font-black text-[#138A36] mt-1">{student.totalConductedPeriods}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between text-left transition duration-300 hover:border-[#006B2D] hover:shadow-md">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Class</span>
                  <span className="text-xl font-black text-slate-800 mt-1">Class {student.class.grade}</span>
                </div>
              </div>

              {/* Information Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Profile Details Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:col-span-2 space-y-6 text-left">
                  <h3 className="text-lg font-bold text-slate-700 border-b border-slate-100 pb-2">Student Information Record</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Personal details</p>
                      <p><b>Full Name:</b> {student.name}</p>
                      <p><b>Roll Number:</b> {student.rollNumber}</p>
                      <p><b>Admission No:</b> <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{student.admissionNumber}</span></p>
                      <p><b>Gender:</b> {student.gender}</p>
                      <p><b>Class:</b> Class {student.class.grade}</p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Parent & Contact Details</p>
                      <p><b>Guardian / Parent:</b> {student.parentName}</p>
                      <p><b>Mobile Contact:</b> {student.parentMobile}</p>
                      <p><b>Residential Address:</b> {student.address}</p>
                    </div>
                  </div>
                </div>

                {/* Sidebar Announcements */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 text-left">
                  <h4 className="font-bold text-slate-700 flex items-center space-x-2">
                    <BellRing size={18} className="text-[#D4AF37]" />
                    <span>Circulars Notice Board</span>
                  </h4>
                  
                  <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                    {notices.map((n) => (
                      <div key={n.id} className="py-3 first:pt-0 space-y-1">
                        <p className="text-xs font-bold text-[#006B2D]">{n.title}</p>
                        <p className="text-[11px] text-slate-600 leading-normal">{n.content}</p>
                        <span className="text-[9px] text-gray-400 block">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {notices.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No recent board circulars found.</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
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
          {/* TAB: ACADEMIC MARKS */}
          {/* ========================================================================= */}
          {activeTab === 'MARKS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-3xl mx-auto text-left">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <h4 className="font-bold text-slate-700">Semester Exam Grades</h4>
                <span className="bg-[#006B2D] text-white text-xs font-bold px-3 py-1 rounded-full border border-[#004D20]">
                  Overall Percent Target: 90%
                </span>
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
          {/* TAB: TIMETABLE */}
          {/* ========================================================================= */}
          {activeTab === 'TIMETABLE' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto text-left">
              <h4 className="font-bold text-slate-700 mb-6">Weekly Class Timetable View</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-sm border border-slate-200">
                  <thead className="bg-[#006B2D] text-white uppercase text-xs font-bold border border-[#004D20]">
                    <tr>
                      <th className="px-4 py-3 border border-slate-300">Period</th>
                      <th className="px-4 py-3 border border-slate-300">Monday</th>
                      <th className="px-4 py-3 border border-slate-300">Tuesday</th>
                      <th className="px-4 py-3 border border-slate-300">Wednesday</th>
                      <th className="px-4 py-3 border border-slate-300">Thursday</th>
                      <th className="px-4 py-3 border border-slate-300">Friday</th>
                      <th className="px-4 py-3 border border-slate-300">Saturday</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {weeklyTimetable.map((row) => (
                      <tr key={row.period} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold bg-[#E8F5E9] border border-slate-300 text-xs">P{row.period}</td>
                        <td className="px-4 py-3 border border-slate-200 font-semibold">{row.mon}</td>
                        <td className="px-4 py-3 border border-slate-200 font-semibold">{row.tue}</td>
                        <td className="px-4 py-3 border border-slate-200 font-semibold">{row.wed}</td>
                        <td className="px-4 py-3 border border-slate-200 font-semibold">{row.thu}</td>
                        <td className="px-4 py-3 border border-slate-200 font-semibold">{row.fri}</td>
                        <td className="px-4 py-3 border border-slate-200 font-semibold">{row.sat}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: COMPLAINTS */}
          {/* ========================================================================= */}
          {activeTab === 'COMPLAINTS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* File complaint form */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 h-fit">
                <h4 className="font-bold text-slate-700 mb-4">Submit Feedback / Issue</h4>
                
                {complaintSuccess && (
                  <div className="bg-teal-50 border-l-4 border-[#138A36] p-3 text-xs text-teal-800 rounded-r-md mb-4 font-semibold">
                    ✅ Complaint filed successfully. Escalated for Principal review.
                  </div>
                )}

                <form onSubmit={handlePostComplaint} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Issue Category</label>
                    <select 
                      value={complaintType}
                      onChange={(e) => setComplaintType(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-[#006B2D]"
                    >
                      <option value="TEACHER_ISSUE">Teacher Issue</option>
                      <option value="INFRASTRUCTURE_ISSUE">Infrastructure Issue</option>
                      <option value="HARASSMENT">Harassment Complaint</option>
                      <option value="SUGGESTION">General Suggestion</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Elaborate Details</label>
                    <textarea 
                      rows="4" 
                      required
                      value={complaintDetails}
                      onChange={(e) => setComplaintDetails(e.target.value)}
                      placeholder="Explain your concern..."
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-[#006B2D]"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#006B2D] hover:bg-[#138A36] text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 cursor-pointer shadow-md border border-[#004D20]"
                  >
                    <Send size={16} />
                    <span>File Complaint</span>
                  </button>
                </form>
              </div>

              {/* Complaints History */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:col-span-2">
                <h4 className="font-bold text-slate-700 mb-4">My Submitted Issues</h4>
                <div className="divide-y divide-slate-100">
                  {myComplaints.map((c) => (
                    <div key={c.id} className="py-4 first:pt-0 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="bg-[#E8F5E9] text-[#004D20] font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-100">
                          {c.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                          c.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{c.details}</p>
                      <span className="text-[9px] text-gray-400 block">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {myComplaints.length === 0 && (
                    <p className="text-center py-8 text-slate-500 text-xs">No feedback or issues filed yet.</p>
                  )}
                </div>
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
                <h1 className="font-extrabold text-sm tracking-wider">AP STUDENT SIS</h1>
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
                <span>My Profile</span>
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
                onClick={() => { setActiveTab('TIMETABLE'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'TIMETABLE' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
                }`}
              >
                <ClipboardList size={18} />
                <span>Class Timetable</span>
              </button>
              <button 
                onClick={() => { setActiveTab('COMPLAINTS'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'COMPLAINTS' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
                }`}
              >
                <MessageSquare size={18} />
                <span>Feedback & Complaints</span>
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
