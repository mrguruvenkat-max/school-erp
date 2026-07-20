import { useState, useEffect } from 'react';
import { 
  User, Calendar, GraduationCap, ClipboardList, MessageSquare, BellRing, 
  LogOut, Menu, X, QrCode, BookMarked, Activity, 
  FileText, Home, Newspaper, FileDown, Search, Printer, Download,
  CheckCircle, ArrowUpDown, Award, ShieldAlert
} from 'lucide-react';
import apLogo from '../assets/ap-logo.png';
import { API_URL, parseResponse } from '../config/api';
import LoadingScreen from '../components/LoadingScreen';
import { Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Title, Tooltip, Legend);

export default function StudentPortal({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('HOME'); // HOME, PROFILE, ATTENDANCE, MARKS, TIMETABLE, HOMEWORK, CERTIFICATES, DOWNLOADS, COMPLAINTS, NOTIFICATIONS
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  // Notice board circulars
  const [notices, setNotices] = useState([]);
  
  // Grievance tracking
  const [complaintType, setComplaintType] = useState('FACILITY_ISSUE');
  const [complaintDetails, setComplaintDetails] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);

  // Active selections
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // Homework attachments & submissions states
  const [submittedHomework, setSubmittedHomework] = useState({});
  const [submitText, setSubmitText] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Table sorting, filtering and search states
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('ALL');
  const [attendanceSort, setAttendanceSort] = useState('desc');
  const [attendancePage, setAttendancePage] = useState(1);

  const [marksSearch, setMarksSearch] = useState('');
  const [marksFilter, setMarksFilter] = useState('ALL');

  const fetchStudentData = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const response = await fetch(`${API_URL}/api/students/profile/${user.studentId || 1}`, { headers });
      const data = await parseResponse(response);
      setProfileData(data);

      const resComp = await fetch(`${API_URL}/api/complaints`, { headers });
      const complaints = await parseResponse(resComp);
      setMyComplaints(complaints);

      const resNot = await fetch(`${API_URL}/api/academic/notices`, { headers });
      const noticesData = await parseResponse(resNot);
      setNotices(noticesData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudentData();

    const handleAttendanceChange = () => {
      fetchStudentData();
    };

    window.addEventListener('attendance_changed', handleAttendanceChange);
    return () => {
      window.removeEventListener('attendance_changed', handleAttendanceChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!profileData) {
    return <LoadingScreen portal="Student" />;
  }

  const { student, attendancePercentage, calendarView, marks } = profileData;

  // Mock structures for the newly required homework, remarks and activities
  const homeworkList = [
    { id: 1, subject: "Mathematics", task: "Solve Algebra exercise 4.2 (Quadratic Equations)", dueDate: "2026-07-22", teacher: "Sri K. Rama Rao", status: "PENDING" },
    { id: 2, subject: "General Science", task: "Complete digestive system diagram with labels", dueDate: "2026-07-20", teacher: "Smt. P. Lakshmi", status: "PENDING" },
    { id: 3, subject: "English Literature", task: "Write summary of Chapter 3: 'The Golden Harvest'", dueDate: "2026-07-25", teacher: "Sri J. Prasad", status: "SUBMITTED" }
  ];

  const teacherRemarks = [
    { date: "2026-07-16", remark: "Excellent participation in Chemistry laboratory modules.", teacher: "Smt. P. Lakshmi" },
    { date: "2026-07-10", remark: "Consistently submits Algebra logs on time. Maintain progress.", teacher: "Sri K. Rama Rao" }
  ];

  const recentTimeline = [
    { date: "Today", event: "Attendance marked present for Period 1-7", icon: CheckCircle, color: "text-emerald-600" },
    { date: "Today", event: "Science homework review remarks published", icon: Activity, color: "text-blue-600" },
    { date: "Yesterday", event: "Mathematics Unit Exam results registered", icon: GraduationCap, color: "text-green-600" },
    { date: "Yesterday", event: "Study Certificate download request processed", icon: FileText, color: "text-[#D97706]" },
    { date: "15-Jul-2026", event: "Submitted complaint ticket regarding chemistry lab benches", icon: ShieldAlert, color: "text-red-500" }
  ];

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
      
      const resComp = await fetch(`${API_URL}/api/complaints`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const complaints = await parseResponse(resComp);
      setMyComplaints(complaints);
    } catch (err) {
      console.error(err);
    }
  };

  const handleHomeworkSubmit = (id) => {
    if (!submitText.trim()) return;
    setSubmittedHomework(prev => ({ ...prev, [id]: submitText }));
    setSubmitText('');
    setSuccessToast("Homework submitted successfully!");
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const downloadPrintable = (title) => {
    alert(`Initiating verified PDF print module for: ${title}`);
    window.print();
  };

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

  const weeklyTimetable = [
    { period: 1, time: "09:00 - 09:45", mon: "Math (Room 102)", tue: "Science (Lab A)", wed: "English (Room 102)", thu: "Social (Room 102)", fri: "Math (Room 102)", sat: "Telugu (Room 104)" },
    { period: 2, time: "09:45 - 10:30", mon: "Science (Lab B)", tue: "English (Room 102)", wed: "Math (Room 102)", thu: "Telugu (Room 104)", fri: "Science (Room 102)", sat: "Social (Room 102)" },
    { period: 3, time: "10:30 - 11:15", mon: "English (Room 102)", tue: "Math (Room 102)", wed: "Science (Room 102)", thu: "Social (Room 102)", fri: "Telugu (Room 104)", sat: "Computers (Lab C)" },
    { period: 4, time: "11:15 - 12:00", mon: "Telugu (Room 104)", tue: "Social (Room 102)", wed: "Telugu (Room 104)", thu: "Math (Room 102)", fri: "English (Room 102)", sat: "Science (Lab A)" },
    { period: 5, time: "12:00 - 12:45", mon: "Lunch Break", tue: "Lunch Break", wed: "Lunch Break", thu: "Lunch Break", fri: "Lunch Break", sat: "Lunch Break" },
    { period: 6, time: "12:45 - 01:30", mon: "Math (Room 102)", tue: "Science (Lab B)", wed: "English (Room 102)", thu: "Social (Room 102)", fri: "Math (Room 102)", sat: "Sports (Ground)" },
    { period: 7, time: "01:30 - 02:15", mon: "Science (Room 102)", tue: "English (Room 102)", wed: "Math (Room 102)", thu: "Telugu (Room 104)", fri: "Science (Room 102)", sat: "Library (Hall B)" }
  ];

  const attendanceTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Monthly Attendance %',
      data: [92, 95, 88, 91, 93, Math.round(attendancePercentage)],
      borderColor: '#0F7A3D',
      backgroundColor: 'rgba(15, 122, 61, 0.1)',
      fill: true,
      tension: 0.1,
      pointRadius: 4,
      pointBackgroundColor: '#2563EB'
    }]
  };

  const marksChartData = {
    labels: marks.map(m => m.subject ? m.subject.name : 'Subject'),
    datasets: [{
      label: 'Obtained Marks %',
      data: marks.map(m => Math.round((m.marksObtained / m.maxMarks) * 100)),
      backgroundColor: '#0F7A3D',
      borderWidth: 0,
      borderRadius: 2
    }]
  };

  // Filtered and Sorted Attendance Table History
  const filteredAttendance = calendarView.filter(row => {
    const searchMatch = row.date.includes(attendanceSearch) || row.status.toLowerCase().includes(attendanceSearch.toLowerCase());
    const filterMatch = attendanceFilter === 'ALL' || row.status === attendanceFilter;
    return searchMatch && filterMatch;
  }).sort((a, b) => {
    if (attendanceSort === 'asc') return new Date(a.date) - new Date(b.date);
    return new Date(b.date) - new Date(a.date);
  });

  const attendancePageSize = 5;
  const totalAttendancePages = Math.ceil(filteredAttendance.length / attendancePageSize) || 1;
  const paginatedAttendance = filteredAttendance.slice((attendancePage - 1) * attendancePageSize, attendancePage * attendancePageSize);

  // Filtered Marks
  const filteredMarks = marks.filter(m => {
    const subjectName = m.subject ? m.subject.name : '';
    const searchMatch = subjectName.toLowerCase().includes(marksSearch.toLowerCase()) || m.examType.toLowerCase().includes(marksSearch.toLowerCase());
    const filterMatch = marksFilter === 'ALL' || m.examType === marksFilter;
    return searchMatch && filterMatch;
  });

  return (
    <div className="flex h-screen bg-[#F7F9FC] text-slate-800 font-sans overflow-hidden antialiased">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex flex-col lg:w-64 md:w-20 bg-white border-r border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center space-x-3 p-5 border-b border-slate-200 justify-center lg:justify-start">
          <img className="h-10 w-auto shrink-0" src={apLogo} alt="AP Gov Logo" />
          <div className="hidden lg:block text-left">
            <h2 className="font-bold text-xs text-[#0F7A3D] tracking-wider leading-tight">AP SCHOOL ERP 3.0</h2>
            <span className="text-[9px] text-[#D97706] font-bold uppercase tracking-wider">Student SIS</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-left">
          {/* Group 1: Dashboard */}
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-3">Dashboard</p>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('HOME')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'HOME' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Home size={14} />
                <span className="hidden lg:inline">Home Overview</span>
              </button>
              <button 
                onClick={() => setActiveTab('PROFILE')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'PROFILE' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User size={14} />
                <span className="hidden lg:inline">Detailed Profile</span>
              </button>
            </div>
          </div>

          {/* Group 2: Academics */}
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
                onClick={() => setActiveTab('TIMETABLE')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'TIMETABLE' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ClipboardList size={14} />
                <span className="hidden lg:inline">Timetable Grid</span>
              </button>
              <button 
                onClick={() => setActiveTab('HOMEWORK')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'HOMEWORK' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookMarked size={14} />
                <span className="hidden lg:inline">Homework Tracker</span>
              </button>
            </div>
          </div>

          {/* Group 3: Services */}
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-3">Student Services</p>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('COMPLAINTS')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'COMPLAINTS' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MessageSquare size={14} />
                <span className="hidden lg:inline">Complaints Desk</span>
              </button>
            </div>
          </div>

          {/* Group 4: Communication */}
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-3">Communication</p>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('NOTIFICATIONS')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'NOTIFICATIONS' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Newspaper size={14} />
                <span className="hidden lg:inline">Board Notices</span>
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
                {student.name}
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Student Portal Dashboard
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline bg-emerald-50 text-[#0F7A3D] font-bold px-2.5 py-1 rounded text-[11px] border border-emerald-100">
              Attendance: {Math.round(attendancePercentage)}%
            </span>
            <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded text-[11px] border border-blue-100">
              Grade: Class {student.class.grade}
            </span>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {successToast && (
            <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3 text-xs text-emerald-800 flex items-center justify-between">
              <span>{successToast}</span>
              <button onClick={() => setSuccessToast('')} className="text-emerald-500 font-bold">✕</button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: HOME VIEW */}
          {/* ========================================================================= */}
          {activeTab === 'HOME' && (
            <div className="space-y-6 text-left">
              
              {/* Row 1: Welcome banner and Info summary */}
              <div className="bg-white border border-slate-200 p-6 rounded flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-xl text-[#0F7A3D]">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">Welcome, {student.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Roll Number: <b>{student.rollNumber}</b> | Class: <b>Class {student.class.grade}</b> | Academic Year: <b>2026-27</b>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Student ID: <b>{student.studentId || "AP-S-1095"}</b> | House Group: <span className="font-extrabold text-emerald-700">Emerald</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Badge</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      attendancePercentage >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {attendancePercentage >= 75 ? 'ELIGIBLE' : 'SHORTAGE'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 border border-slate-200 rounded">
                    <QrCode size={40} className="text-slate-700" />
                  </div>
                </div>
              </div>

              {/* Row 2: Secondary summary metrics card deck */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Attendance</span>
                  <p className="text-lg font-extrabold text-[#0F7A3D] mt-1">{Math.round(attendancePercentage)}%</p>
                  <span className="text-[9px] text-slate-400 block mt-1">Target: 75% min</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Avg. Marks</span>
                  <p className="text-lg font-extrabold text-blue-600 mt-1">
                    {marks.length > 0 ? Math.round(marks.reduce((a, b) => a + (b.marksObtained / b.maxMarks * 100), 0) / marks.length) : 0}%
                  </p>
                  <span className="text-[9px] text-slate-400 block mt-1">Based on UT exams</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Homework</span>
                  <p className="text-lg font-extrabold text-[#D97706] mt-1">2 Pending</p>
                  <span className="text-[9px] text-slate-400 block mt-1">Due by tomorrow</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Exams Scheduled</span>
                  <p className="text-lg font-extrabold text-purple-600 mt-1">1 Upcoming</p>
                  <span className="text-[9px] text-slate-400 block mt-1">Unit Test 2</span>
                </div>
              </div>

              {/* Row 3: Calendars & Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded lg:col-span-2 space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                    Academic Marks Distribution
                  </h4>
                  <div className="h-56">
                    <Bar data={marksChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                    Weekly Attendance Trend
                  </h4>
                  <div className="h-56">
                    <Line data={attendanceTrendData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>

              {/* Row 4: Timetables and Homeworks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Today's Timetable */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Today's Class Timetable</h4>
                    <button onClick={() => setActiveTab('TIMETABLE')} className="text-[10px] text-[#0F7A3D] font-bold hover:underline">Full Schedule →</button>
                  </div>
                  <div className="space-y-2">
                    {weeklyTimetable.slice(0, 4).map((slot, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-slate-200 rounded text-xs bg-slate-50">
                        <div>
                          <p className="font-bold text-slate-800">Period {slot.period}: {slot.mon}</p>
                          <span className="text-[10px] text-slate-400">{slot.time}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">Active Room</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Homework */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Assigned Homework & Due Dates</h4>
                    <button onClick={() => setActiveTab('HOMEWORK')} className="text-[10px] text-[#0F7A3D] font-bold hover:underline">Submit Homework →</button>
                  </div>
                  <div className="space-y-3">
                    {homeworkList.map((hw) => (
                      <div key={hw.id} className="p-3 border border-slate-200 rounded text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">{hw.subject}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            hw.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {hw.status}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1 font-semibold">{hw.task}</p>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                          <span>Teacher: {hw.teacher}</span>
                          <span>Due: {hw.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 5: Remarks, Quick Actions, and Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Remarks */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                    Faculty Progress Remarks
                  </h4>
                  <div className="space-y-3 text-xs">
                    {teacherRemarks.map((rem, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded">
                        <p className="text-slate-700 italic">"{rem.remark}"</p>
                        <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-bold">
                          <span>{rem.teacher}</span>
                          <span>{rem.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions & Profile Shortcut */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                    Quick Operations
                  </h4>
                  <div className="flex flex-col gap-2 text-xs">
                    <button 
                      onClick={() => setActiveTab('PROFILE')} 
                      className="w-full text-left font-bold text-[#0F7A3D] bg-[#0F7A3D]/5 hover:bg-[#0F7A3D]/10 p-2.5 rounded border border-[#0F7A3D]/10 cursor-pointer transition"
                    >
                      👤 Detailed SIS Profile
                    </button>
                    <button 
                      onClick={() => setActiveTab('ATTENDANCE')} 
                      className="w-full text-left font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 p-2.5 rounded border border-blue-100 cursor-pointer transition"
                    >
                      📅 View Attendance History
                    </button>
                    <button 
                      onClick={() => setActiveTab('MARKS')} 
                      className="w-full text-left font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 p-2.5 rounded border border-amber-100 cursor-pointer transition"
                    >
                      🎓 View Marks Registry
                    </button>
                    <button 
                      onClick={() => setActiveTab('COMPLAINTS')} 
                      className="w-full text-left font-bold text-red-700 bg-rose-50 hover:bg-rose-100 p-2.5 rounded border border-rose-100 cursor-pointer transition"
                    >
                      💬 Raise Grievance Ticket
                    </button>
                  </div>
                </div>

                {/* Recent Activities Timeline */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                    Portal Activity Logs
                  </h4>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {recentTimeline.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className="relative flex items-start space-x-3 text-xs">
                          <div className={`absolute -left-6 bg-white p-0.5 rounded-full border border-slate-200 ${item.color}`}>
                            <Icon size={12} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800">{item.event}</span>
                            <span className="text-[10px] text-slate-400 ml-2">({item.date})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PROFILE CARD */}
          {/* ========================================================================= */}
          {activeTab === 'PROFILE' && (() => {
            const getStudentCertificates = () => {
              const dbCerts = student.certificates || [];
              const hasTC = dbCerts.find(c => c.type === 'TRANSFER_CERTIFICATE');
              const tcIssueDate = hasTC ? new Date(hasTC.issuedAt).toLocaleDateString('en-GB') : null;
              
              const hasBonafide = dbCerts.find(c => c.type === 'BONAFIDE');
              const bonafideDate = hasBonafide ? new Date(hasBonafide.issuedAt).toLocaleDateString('en-GB') : "12-Jul-2026";
              
              const hasStudy = dbCerts.find(c => c.type === 'STUDY');
              const studyDate = hasStudy ? new Date(hasStudy.issuedAt).toLocaleDateString('en-GB') : "12-Jul-2026";

              return [
                { name: "Bonafide Certificate", status: "Available", date: bonafideDate },
                { name: "Study Certificate", status: "Available", date: studyDate },
                { name: "Conduct Certificate", status: "Available", date: "12-Jul-2026" },
                { name: "Income Certificate", status: "Available", date: "14-Jul-2026" },
                { name: "Caste Certificate", status: "Available", date: "14-Jul-2026" },
                { name: "Transfer Certificate", status: hasTC ? "Available" : "Pending", date: tcIssueDate || "Not Issued Yet" }
              ];
            };

            const getDownloadableFiles = () => {
              return [
                { name: "Official Report Card - UT-1 & Mid-Term", type: "PDF", date: "18-Jul-2026" },
                { name: "Bonafide Enrollment Certificate", type: "PDF", date: "12-Jul-2026" },
                { name: "Timeline Study Standard Certificate", type: "PDF", date: "12-Jul-2026" },
                { name: "Academic Calendar Schedule 2026-27", type: "PDF", date: "01-Jun-2026" },
                { name: "Official State Holiday List 2026-27", type: "PDF", date: "01-Jun-2026" },
                { name: "Annual Academic Term Fee Receipt", type: "PDF", date: "10-Jun-2026" },
                { name: "Mathematics Standard Class Assignment Files", type: "ZIP", date: "15-Jul-2026" },
                { name: "Science Chemistry Laboratory Homework PDF", type: "PDF", date: "16-Jul-2026" }
              ];
            };

            return (
              <div className="space-y-6">
                <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded text-left overflow-hidden">
                  <div className="bg-[#0F7A3D] text-white p-6 border-b-4 border-[#D97706]">
                    <h3 className="text-base font-extrabold uppercase tracking-wider">Government of Andhra Pradesh</h3>
                    <p className="text-[11px] text-emerald-100 uppercase tracking-widest font-bold">Student Identification Registry</p>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Photo & QR Code column */}
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
                          onClick={() => downloadPrintable(`${student.name}_ID_Card`)}
                          className="w-full flex items-center justify-center space-x-2 bg-[#0F7A3D] hover:bg-emerald-800 text-white text-xs font-bold py-2 px-4 rounded border border-emerald-900 cursor-pointer shadow-sm"
                        >
                          <Printer size={13} />
                          <span>Download ID Card</span>
                        </button>
                      </div>
                    </div>

                    {/* Profile detail column */}
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
                        <div>
                          <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Emergency Contact</span>
                          <p className="font-mono font-bold text-slate-800 mt-0.5">{student.parentMobile}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Registered Email Address</span>
                          <p className="font-mono font-bold text-slate-800 mt-0.5">{student.email || `${student.admissionNumber.toLowerCase()}@apgovschools.in`}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Residential Address</span>
                          <p className="font-semibold text-slate-600 mt-0.5 leading-relaxed">{student.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificates and Downloads side-by-side section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Certificates Section */}
                  <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-4">
                    <h4 className="font-extrabold text-xs text-[#0F7A3D] uppercase tracking-wider pb-2 border-b border-slate-100">
                      Certificates Registry
                    </h4>
                    <div className="space-y-3">
                      {getStudentCertificates().map((cert, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 border border-slate-200 rounded bg-slate-50/50 hover:bg-slate-50 transition text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{cert.name}</p>
                            <p className="text-[10px] text-slate-450 font-bold mt-0.5">
                              Status: <span className={cert.status === 'Available' ? 'text-emerald-700' : 'text-amber-600'}>{cert.status}</span> | Issued: {cert.date}
                            </p>
                          </div>
                          <div className="flex space-x-1 shrink-0">
                            {cert.status === 'Available' ? (
                              <>
                                <button 
                                  onClick={() => downloadPrintable(cert.name)}
                                  className="px-2 py-1 bg-[#0F7A3D] hover:bg-emerald-800 text-white rounded text-[10px] font-bold cursor-pointer transition shadow-2xs border border-emerald-950"
                                >
                                  Download PDF
                                </button>
                                <button 
                                  onClick={() => downloadPrintable(cert.name)}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-[10px] font-bold cursor-pointer transition"
                                >
                                  View
                                </button>
                              </>
                            ) : (
                              <span className="px-2 py-1 bg-slate-100 text-slate-400 rounded text-[10px] font-bold cursor-not-allowed border border-slate-200">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Downloads Section */}
                  <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-4">
                    <h4 className="font-extrabold text-xs text-[#0F7A3D] uppercase tracking-wider pb-2 border-b border-slate-100">
                      Academic Download Center
                    </h4>
                    <div className="space-y-3">
                      {getDownloadableFiles().map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 border border-slate-200 rounded bg-slate-50/50 hover:bg-slate-50 transition text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{file.name}</p>
                            <p className="text-[10px] text-slate-450 font-bold mt-0.5">
                              Type: <span className="text-blue-600 uppercase">{file.type}</span> | Uploaded: {file.date}
                            </p>
                          </div>
                          <button 
                            onClick={() => downloadPrintable(file.name)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded text-[10px] font-bold cursor-pointer transition shadow-2xs shrink-0"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB: ATTENDANCE */}
          {/* ========================================================================= */}
          {activeTab === 'ATTENDANCE' && (
            <div className="space-y-6 text-left">
              
              {/* Row 1: Badges */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border border-slate-200 p-4 rounded">
                <div className="p-3 border-r border-slate-100 last:border-0 text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Attendance Percentage</span>
                  <p className="text-xl font-extrabold text-[#0F7A3D] mt-1">{Math.round(attendancePercentage)}%</p>
                </div>
                <div className="p-3 border-r border-slate-100 last:border-0 text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Total Present Days</span>
                  <p className="text-xl font-extrabold text-blue-600 mt-1">
                    {calendarView.filter(c => c.status === 'PRESENT').length} Days
                  </p>
                </div>
                <div className="p-3 border-r border-slate-100 last:border-0 text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Total Absent Days</span>
                  <p className="text-xl font-extrabold text-red-600 mt-1">
                    {calendarView.filter(c => c.status === 'ABSENT').length} Days
                  </p>
                </div>
                <div className="p-3 last:border-0 flex items-center justify-end">
                  <button 
                    onClick={() => downloadPrintable("June_Attendance_Report")}
                    className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded border border-slate-300 cursor-pointer transition shadow-xs"
                  >
                    <Download size={13} />
                    <span>Download Report</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Grid and log report */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Grid */}
                <div className="bg-white border border-slate-200 p-6 rounded lg:col-span-2">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 mb-4">
                    June 2026 Monthly Attendance Calendar Grid
                  </h4>
                  
                  <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-500 uppercase">
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

                {/* Details pane */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                    Period-wise Attendance log
                  </h4>
                  {selectedCalendarDate ? (
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Date Log</span>
                        <p className="text-xs font-extrabold text-[#0F7A3D] mt-0.5">{selectedCalendarDate.dateStr}</p>
                      </div>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {selectedCalendarDate.record.details.map((d, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2.5 rounded border border-slate-100 text-xs bg-slate-50">
                            <span className="font-bold text-slate-700">Period {d.period}</span>
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              d.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {d.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-12 text-center">Click a marked calendar cell to show period logs.</p>
                  )}
                </div>
              </div>

              {/* Row 3: Filterable attendance table history */}
              <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Historical Attendance Log Tables</h4>
                  
                  {/* Search, Filter, Sort, Print tools */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search logs..."
                        value={attendanceSearch}
                        onChange={(e) => { setAttendanceSearch(e.target.value); setAttendancePage(1); }}
                        className="pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0F7A3D]"
                      />
                    </div>
                    <select 
                      value={attendanceFilter} 
                      onChange={(e) => { setAttendanceFilter(e.target.value); setAttendancePage(1); }}
                      className="px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    >
                      <option value="ALL">All Attendance</option>
                      <option value="PRESENT">Present Logs Only</option>
                      <option value="ABSENT">Absent Logs Only</option>
                    </select>
                    <button 
                      onClick={() => setAttendanceSort(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-1.5 border border-slate-300 rounded text-xs bg-white flex items-center space-x-1 hover:bg-slate-50 cursor-pointer"
                    >
                      <ArrowUpDown size={12} />
                      <span>Date ({attendanceSort.toUpperCase()})</span>
                    </button>
                    <button 
                      onClick={() => downloadPrintable("Attendance_Logs_Grid")}
                      className="px-3 py-1.5 border border-[#0F7A3D] text-[#0F7A3D] rounded text-xs font-bold bg-white flex items-center space-x-1 hover:bg-emerald-50 cursor-pointer"
                    >
                      <Printer size={12} />
                      <span>Print Grid</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                        <th className="px-4 py-3 border border-slate-200">Date Log</th>
                        <th className="px-4 py-3 border border-slate-200">Status</th>
                        <th className="px-4 py-3 border border-slate-200">Period breakdown</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedAttendance.map((row) => (
                        <tr key={row.date} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 border border-slate-200 font-mono font-bold text-slate-800">{row.date}</td>
                          <td className="px-4 py-3 border border-slate-200 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              row.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-slate-500 font-semibold">
                            {row.details ? `${row.details.filter(d => d.status === 'PRESENT').length} Present / ${row.details.filter(d => d.status === 'ABSENT').length} Absent` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                      {paginatedAttendance.length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center py-8 text-slate-400 font-bold">No verified attendance records match search criteria.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 font-bold">Page {attendancePage} of {totalAttendancePages}</span>
                  <div className="flex space-x-1">
                    <button 
                      disabled={attendancePage === 1}
                      onClick={() => setAttendancePage(prev => prev - 1)}
                      className="px-2 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button 
                      disabled={attendancePage === totalAttendancePages}
                      onClick={() => setAttendancePage(prev => prev + 1)}
                      className="px-2 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: MARKS */}
          {/* ========================================================================= */}
          {activeTab === 'MARKS' && (
            <div className="space-y-6 text-left">
              
              {/* Row 1: Actions */}
              <div className="bg-white border border-slate-200 p-4 rounded flex justify-between items-center">
                <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Student Academic Record Sheets</h4>
                <button 
                  onClick={() => downloadPrintable(`${student.name}_Report_Card`)}
                  className="flex items-center space-x-2 bg-[#0F7A3D] hover:bg-emerald-800 text-white text-xs font-bold py-2 px-4 rounded border border-emerald-900 cursor-pointer shadow-sm"
                >
                  <Printer size={13} />
                  <span>Download Report Card</span>
                </button>
              </div>

              {/* Row 2: Grid view */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Marks table */}
                <div className="bg-white border border-slate-200 p-6 rounded lg:col-span-2 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Obtained Marks Registry</h5>
                    
                    {/* Filters */}
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        placeholder="Search subject..."
                        value={marksSearch}
                        onChange={(e) => setMarksSearch(e.target.value)}
                        className="px-2.5 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0F7A3D]"
                      />
                      <select 
                        value={marksFilter} 
                        onChange={(e) => setMarksFilter(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="ALL">All Exam Types</option>
                        <option value="UNIT_TEST_1">Unit Test 1</option>
                        <option value="HALF_YEARLY">Half Yearly</option>
                      </select>
                    </div>
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
                        {filteredMarks.map((m) => {
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
                              <td className="px-4 py-3 border border-slate-200 font-extrabold text-blue-700">{percent}%</td>
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
                        {filteredMarks.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center py-8 text-slate-400 font-bold">No academic performance records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Performance chart */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">Subject-wise Performance</h5>
                  <div className="h-56">
                    <Bar data={marksChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: TIMETABLE */}
          {/* ========================================================================= */}
          {activeTab === 'TIMETABLE' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase">Weekly Class Timetable Planner</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Assigned classrooms, period-timings, and faculty allocation grid.</p>
                </div>
                <button 
                  onClick={() => downloadPrintable("Weekly_Timetable_Grid")}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Print Grid
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                      <th className="px-3 py-3 border border-slate-200 w-16">Period</th>
                      <th className="px-3 py-3 border border-slate-200 w-32">Time Slot</th>
                      <th className="px-3 py-3 border border-slate-200">Monday</th>
                      <th className="px-3 py-3 border border-slate-200">Tuesday</th>
                      <th className="px-3 py-3 border border-slate-200">Wednesday</th>
                      <th className="px-3 py-3 border border-slate-200">Thursday</th>
                      <th className="px-3 py-3 border border-slate-200">Friday</th>
                      <th className="px-3 py-3 border border-slate-200">Saturday</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-bold">
                    {weeklyTimetable.map((slot) => {
                      const isLunch = slot.mon === "Lunch Break";
                      return (
                        <tr key={slot.period} className={isLunch ? "bg-amber-50/50 text-slate-500 font-semibold" : "hover:bg-slate-50/50"}>
                          <td className="px-3 py-3 border border-slate-200 text-[#0F7A3D] font-extrabold">P{slot.period}</td>
                          <td className="px-3 py-3 border border-slate-200 text-slate-400 font-semibold">{slot.time}</td>
                          <td className={`px-3 py-3 border border-slate-200 ${isLunch ? 'italic font-semibold' : 'text-slate-700'}`}>
                            {slot.mon}
                          </td>
                          <td className={`px-3 py-3 border border-slate-200 ${isLunch ? 'italic font-semibold' : 'text-slate-700'}`}>
                            {slot.tue}
                          </td>
                          <td className={`px-3 py-3 border border-slate-200 ${isLunch ? 'italic font-semibold' : 'text-slate-700'}`}>
                            {slot.wed}
                          </td>
                          <td className={`px-3 py-3 border border-slate-200 ${isLunch ? 'italic font-semibold' : 'text-slate-700'}`}>
                            {slot.thu}
                          </td>
                          <td className={`px-3 py-3 border border-slate-200 ${isLunch ? 'italic font-semibold' : 'text-slate-700'}`}>
                            {slot.fri}
                          </td>
                          <td className={`px-3 py-3 border border-slate-200 ${isLunch ? 'italic font-semibold' : 'text-slate-700'}`}>
                            {slot.sat}
                          </td>
                        </tr>
                      );
                    })}
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
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Homework Assignment Submission Desk</h4>
                <p className="text-xs text-slate-400 mt-0.5">Submit homework tasks directly to verified subject teachers.</p>
              </div>

              <div className="space-y-4">
                {homeworkList.map((hw) => {
                  const isSubmitted = submittedHomework[hw.id] || hw.status === 'SUBMITTED';
                  return (
                    <div key={hw.id} className="p-4 border border-slate-200 rounded space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-xs text-[#0F7A3D] uppercase tracking-wider block">{hw.subject}</span>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Teacher: {hw.teacher}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isSubmitted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {isSubmitted ? 'SUBMITTED' : 'PENDING SUBMISSION'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded border border-slate-100 text-xs font-semibold text-slate-600">
                        {hw.task}
                      </div>

                      {isSubmitted ? (
                        <div className="bg-emerald-50/50 p-3 rounded border border-emerald-100 text-[11px] text-emerald-950 font-bold">
                          ✓ Submissions logs: {submittedHomework[hw.id] || "Completed and verified on teacher registry."}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea 
                            value={submitText}
                            onChange={(e) => setSubmitText(e.target.value)}
                            placeholder="Enter your answers or submission text details..."
                            className="w-full p-2.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0F7A3D]"
                            rows={3}
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-bold">Due Date: {hw.dueDate}</span>
                            <button 
                              onClick={() => handleHomeworkSubmit(hw.id)}
                              className="bg-[#0F7A3D] hover:bg-emerald-800 text-white font-bold text-xs py-1.5 px-4 rounded cursor-pointer transition shadow-xs"
                            >
                              Submit Assignment
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: COMPLAINTS */}
          {/* ========================================================================= */}
          {activeTab === 'COMPLAINTS' && (
            <div className="space-y-6 text-left">
              
              {/* Row 1: grievance form and logs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                    File feedback or grievances
                  </h4>

                  {complaintSuccess && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3 text-xs text-emerald-800 font-bold">
                      Grievance submitted successfully! Track status in the history log table.
                    </div>
                  )}

                  <form onSubmit={handlePostComplaint} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Issue Category</label>
                      <select 
                        value={complaintType}
                        onChange={(e) => setComplaintType(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded bg-white font-bold"
                      >
                        <option value="TEACHER_ISSUE">Teacher / Lecture Progress Concern</option>
                        <option value="FACILITY_ISSUE">Infrastructure & Laboratory Facilities</option>
                        <option value="MIDDAY_MEALS">Midday Meals (Nutritional standard)</option>
                        <option value="HARASSMENT_BULLYING">Harassment or General Bullying Incident</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Detailed Description</label>
                      <textarea 
                        required
                        value={complaintDetails}
                        onChange={(e) => setComplaintDetails(e.target.value)}
                        placeholder="Provide details of the incident, naming classes, dates or rooms if relevant..."
                        className="w-full p-2.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0F7A3D]"
                        rows={4}
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#0F7A3D] hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded border border-emerald-900 cursor-pointer shadow-sm transition"
                    >
                      Submit Ticket
                    </button>
                  </form>
                </div>

                {/* History */}
                <div className="bg-white border border-slate-200 p-6 rounded lg:col-span-2 space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                    Grievance Log History
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                          <th className="px-3 py-3 border border-slate-200">Category</th>
                          <th className="px-3 py-3 border border-slate-200">Details</th>
                          <th className="px-3 py-3 border border-slate-200">Status</th>
                          <th className="px-3 py-3 border border-slate-200">Response</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {myComplaints.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50">
                            <td className="px-3 py-3 border border-slate-200 font-bold text-slate-700">{c.type.replace(/_/g, ' ')}</td>
                            <td className="px-3 py-3 border border-slate-200 text-slate-500 font-semibold max-w-xs truncate" title={c.details}>{c.details}</td>
                            <td className="px-3 py-3 border border-slate-200">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 border border-slate-200 text-slate-600 font-bold italic">
                              {c.response || 'Pending investigation.'}
                            </td>
                          </tr>
                        ))}
                        {myComplaints.length === 0 && (
                          <tr>
                            <td colSpan="4" className="text-center py-6 text-slate-400 font-bold">No grievances submitted.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: NOTIFICATIONS */}
          {/* ========================================================================= */}
          {activeTab === 'NOTIFICATIONS' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Official Board Circulars and Notices</h4>
                <p className="text-xs text-slate-400 mt-0.5">Critical notifications distributed from the School Education Department.</p>
              </div>

              <div className="divide-y divide-slate-200">
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const activeNotices = notices.filter(n => !n.expiryDate || n.expiryDate >= todayStr);
                  if (activeNotices.length === 0) {
                    return <p className="text-xs text-slate-400 text-center py-6 font-bold">No active announcements registered on the notice board.</p>;
                  }
                  return activeNotices.map((n) => (
                    <div key={n.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5 border-b last:border-0 border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-[#0F7A3D] uppercase tracking-wider">{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed">{n.content}</p>
                      <span className="inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-400">AP Board Directives</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MOBILE MENU MODAL DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex md:hidden justify-start">
          <div className="w-64 bg-white h-full flex flex-col p-4 space-y-6 shadow-2xl relative text-left">
            
            {/* Close button */}
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
                <span className="text-[9px] text-[#D97706] font-bold uppercase">SIS Desk</span>
              </div>
            </div>

            <nav className="flex-1 space-y-1">
              {[
                { id: 'HOME', name: 'Home Overview', icon: Home },
                { id: 'PROFILE', name: 'Detailed Profile', icon: User },
                { id: 'ATTENDANCE', name: 'Attendance Log', icon: Calendar },
                { id: 'MARKS', name: 'Marks Registry', icon: GraduationCap },
                { id: 'TIMETABLE', name: 'Timetable Grid', icon: ClipboardList },
                { id: 'HOMEWORK', name: 'Homework Tracker', icon: BookMarked },
                { id: 'COMPLAINTS', name: 'Complaints Desk', icon: MessageSquare },
                { id: 'NOTIFICATIONS', name: 'Board Notices', icon: BellRing }
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
