import { useState, useEffect } from 'react';
import { 
  Users, Calendar, GraduationCap, ClipboardList, LogOut, Menu, X, 
  BellRing, CheckCircle, Search, AlertCircle
} from 'lucide-react';
import apLogo from '../assets/ap-logo.png';
import { API_URL, parseResponse } from '../config/api';
import LoadingScreen from '../components/LoadingScreen';

export default function TeacherPortal({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('HOME'); // HOME, ATTENDANCE, MARKS_ENTRY, MONITORING, NOTICES
  const [classList, setClassList] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [attendanceSheet, setAttendanceSheet] = useState([]);
  
  // Attendance Selection Parameters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // UI States
  const [error, setError] = useState('');
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(null);
  const [isAttendanceUpdated, setIsAttendanceUpdated] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceSearchRoll, setAttendanceSearchRoll] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submissionTime, setSubmissionTime] = useState('');

  // Marks Entry parameters
  const [marksClass, setMarksClass] = useState('');
  const [marksSubject, setMarksSubject] = useState('');
  const [marksExamType, setMarksExamType] = useState('MID_TERM');
  const [marksMaxMarks, setMarksMaxMarks] = useState(100);
  const [marksSheet, setMarksSheet] = useState([]);
  const [marksSuccess, setMarksSuccess] = useState(false);
  const [marksError, setMarksError] = useState('');
  const [marksLoading, setMarksLoading] = useState(false);

  // Student Monitoring
  const [monitoringClass, setMonitoringClass] = useState('');
  const [monitoringSearch, setMonitoringSearch] = useState('');
  const [monitoringStudents, setMonitoringStudents] = useState([]);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);

  // Notices
  const [notices, setNotices] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Fetch initial configuration
  const fetchInitialData = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const resClasses = await fetch(`${API_URL}/api/academic/classes`, { headers });
      const classes = await parseResponse(resClasses);
      const sortedClasses = [...classes].sort((a, b) => a.id - b.id);
      setClassList(sortedClasses);
      if (sortedClasses.length > 0) {
        setSelectedClass(sortedClasses[0].id.toString());
        setMarksClass(sortedClasses[0].id.toString());
        setMonitoringClass(sortedClasses[0].id.toString());
      }

      const resSubjects = await fetch(`${API_URL}/api/academic/subjects`, { headers });
      const subs = await parseResponse(resSubjects);
      setSubjects(subs);
      if (subs.length > 0) {
        setSelectedSubject(subs[0].id.toString());
        setMarksSubject(subs[0].id.toString());
      }

      const resTimetable = await fetch(`${API_URL}/api/academic/timetable/1`, { headers });
      const schedule = await parseResponse(resTimetable);
      const formattedSchedule = schedule.map(s => ({
        period: s.period,
        subject: s.subject.name,
        class: s.class.grade
      }));
      setTimetable(formattedSchedule);

      const resNotices = await fetch(`${API_URL}/api/academic/notices`, { headers });
      const noticesData = await parseResponse(resNotices);
      setNotices(noticesData);
      setIsDataLoaded(true);
    } catch (err) {
      console.error(err);
      setIsDataLoaded(true);
    }
  };

  const fetchAttendanceSheet = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/attendance/list?classId=${selectedClass}&subjectId=${selectedSubject}&period=${selectedPeriod}&date=${selectedDate}`, { headers });
      const data = await parseResponse(res);
      setAttendanceSheet(data.students);
      setIsAttendanceUpdated(data.isUpdated);
      setHasUnsavedChanges(false);
      setAttendanceSearch('');
      setAttendanceSearchRoll('');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMarksSheet = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    setMarksError('');
    try {
      const res = await fetch(`${API_URL}/api/students/list?classId=${marksClass}`, { headers });
      const students = await parseResponse(res);
      const sheet = students.map(s => ({
        studentId: s.id,
        rollNumber: s.rollNumber,
        name: s.name,
        marksObtained: ''
      }));
      setMarksSheet(sheet);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMonitoringStudents = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    setMonitoringLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/students/list?classId=${monitoringClass}`, { headers });
      const data = await parseResponse(res);
      setMonitoringStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setMonitoringLoading(false);
    }
  };

  const handleViewStudentDetails = async (studentId) => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const res = await fetch(`${API_URL}/api/students/profile/${studentId}`, { headers });
      const details = await parseResponse(res);
      setSelectedStudentDetails(details);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);



  // Load students for attendance when params change
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedPeriod && selectedDate) {
      fetchAttendanceSheet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSubject, selectedPeriod, selectedDate]);

  // Load students for marks entry when params change
  useEffect(() => {
    if (marksClass) {
      fetchMarksSheet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marksClass, marksSubject, marksExamType]);

  // Load student monitoring directory when class changes
  useEffect(() => {
    if (monitoringClass) {
      fetchMonitoringStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitoringClass]);

  const setStudentStatus = (studentId, status) => {
    setAttendanceSheet(prev => 
      prev.map(s => s.studentId === studentId ? { ...s, status } : s)
    );
    setHasUnsavedChanges(true);
  };

  const handleSelectAllPresent = () => {
    setAttendanceSheet(prev => prev.map(s => ({ ...s, status: 'PRESENT' })));
    setHasUnsavedChanges(true);
  };

  const handleSelectAllAbsent = () => {
    setAttendanceSheet(prev => prev.map(s => ({ ...s, status: 'ABSENT' })));
    setHasUnsavedChanges(true);
  };

  const handleClearAll = () => {
    setAttendanceSheet(prev => prev.map(s => ({ ...s, status: null })));
    setHasUnsavedChanges(true);
  };

  const handleExportExcel = () => {
    const headers = ['Roll No', 'Student Name', 'Gender', 'Attendance Status'];
    const rows = attendanceSheet.map(s => [
      s.rollNumber,
      s.name,
      s.gender === 'FEMALE' ? 'Girl' : 'Boy',
      s.status || 'UNMARKED'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Register_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveAttendance = async () => {
    const unmarkedStudents = attendanceSheet.filter(s => !s.status);
    if (unmarkedStudents.length > 0) {
      setError("Please mark attendance (Present or Absent) for all students.");
      setShowConfirmModal(false);
      return;
    }

    setError('');
    try {
      const response = await fetch(`${API_URL}/api/attendance/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          classId: selectedClass,
          subjectId: selectedSubject,
          period: selectedPeriod,
          date: selectedDate,
          attendanceData: attendanceSheet.map(s => ({ studentId: s.studentId, status: s.status }))
        })
      });

      await parseResponse(response);
      const presentCount = attendanceSheet.filter(s => s.status === 'PRESENT').length;
      const absentCount = attendanceSheet.filter(s => s.status === 'ABSENT').length;
      const classGrade = classList.find(c => c.id.toString() === selectedClass.toString())?.grade || 'Class';
      const formattedDate = new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      setSaveSuccessBanner({
        grade: classGrade,
        date: formattedDate,
        present: presentCount,
        absent: absentCount
      });
      setSubmissionTime(timeStr);
      setIsAttendanceUpdated(true);
      setHasUnsavedChanges(false);
      setShowConfirmModal(false);

      // Auto dismiss success banner after 8 seconds
      setTimeout(() => {
        setSaveSuccessBanner(null);
      }, 8000);

    } catch (err) {
      setError(err.message || "Failed to submit attendance logs.");
      setShowConfirmModal(false);
    }
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    setMarksSuccess(false);
    setMarksError('');
    setMarksLoading(true);

    try {
      const payload = {
        classId: parseInt(marksClass),
        subjectId: parseInt(marksSubject),
        examType: marksExamType,
        maxMarks: parseInt(marksMaxMarks),
        marksData: marksSheet.map(m => ({
          studentId: m.studentId,
          marksObtained: parseFloat(m.marksObtained) || 0
        }))
      };

      const response = await fetch(`${API_URL}/api/academic/marks/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      await parseResponse(response);
      setMarksSuccess(true);
      fetchMarksSheet();
    } catch (err) {
      setMarksError(err.message || 'Failed to register marks.');
    } finally {
      setMarksLoading(false);
    }
  };

  const updateMarksValue = (studentId, val) => {
    setMarksSheet(prev =>
      prev.map(s => s.studentId === studentId ? { ...s, marksObtained: val } : s)
    );
  };

  const printTable = () => {
    alert("Initiating verified PDF print module for administrative log sheets...");
    window.print();
  };

  // Filtered monitoring students
  const filteredMonitoring = monitoringStudents.filter(s => {
    return s.name.toLowerCase().includes(monitoringSearch.toLowerCase()) || 
           s.rollNumber.toLowerCase().includes(monitoringSearch.toLowerCase()) ||
           s.admissionNumber.toLowerCase().includes(monitoringSearch.toLowerCase());
  });



  if (!isDataLoaded) {
    return <LoadingScreen portal="Teacher" />;
  }

  return (
    <div className="flex h-screen bg-[#F7F9FC] text-slate-800 font-sans overflow-hidden antialiased">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex flex-col lg:w-64 md:w-20 bg-white border-r border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center space-x-3 p-5 border-b border-slate-200 justify-center lg:justify-start">
          <img className="h-10 w-auto shrink-0" src={apLogo} alt="AP Gov Logo" />
          <div className="hidden lg:block text-left">
            <h2 className="font-bold text-xs text-[#0F7A3D] tracking-wider leading-tight">AP SCHOOL ERP 3.0</h2>
            <span className="text-[9px] text-[#D97706] font-bold uppercase tracking-wider">Faculty Portal</span>
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
                <ClipboardList size={14} />
                <span className="hidden lg:inline">Home Overview</span>
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
                <span className="hidden lg:inline">Attendance Roll Call</span>
              </button>
              <button 
                onClick={() => setActiveTab('MARKS_ENTRY')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'MARKS_ENTRY' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <GraduationCap size={14} />
                <span className="hidden lg:inline">Marks Registry</span>
              </button>
              <button 
                onClick={() => setActiveTab('MONITORING')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'MONITORING' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users size={14} />
                <span className="hidden lg:inline">Student SIS Roster</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-3">Communication</p>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('NOTICES')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'NOTICES' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BellRing size={14} />
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
                Welcome, {user.username}
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Faculty Portal Desk
              </p>
            </div>
          </div>

          <span className="bg-emerald-50 text-[#0F7A3D] font-bold px-2.5 py-1 rounded text-[11px] border border-emerald-100">
            Registered School Teacher
          </span>
        </header>

        {/* WORKSPACE */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {saveSuccessBanner && (
            <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded text-left flex items-start space-x-3">
              <CheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={16} />
              <div className="text-xs">
                <h5 className="font-extrabold text-emerald-800">Attendance Log Saved Successfully</h5>
                <p className="text-emerald-700 mt-1">
                  Class: <b>{saveSuccessBanner.grade}</b> | Date: <b>{saveSuccessBanner.date}</b> | Present: <b>{saveSuccessBanner.present}</b> | Absent: <b>{saveSuccessBanner.absent}</b>
                </p>
                <p className="text-slate-400 text-[10px] mt-1">Submitted at {submissionTime} and synced with government biometric servers.</p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: HOME VIEW */}
          {/* ========================================================================= */}
          {activeTab === 'HOME' && (
            <div className="space-y-6 text-left">
              
              {/* Row 1: Welcome and Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border border-slate-200 p-4 rounded">
                <div className="p-3 border-r border-slate-200 last:border-0">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Registered Class Strength</span>
                  <p className="text-lg font-extrabold text-slate-800 mt-1">42 Students</p>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Grade 10 - Section A</span>
                </div>
                <div className="p-3 border-r border-slate-200 last:border-0">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Average Attendance</span>
                  <p className="text-lg font-extrabold text-[#0F7A3D] mt-1">91.4%</p>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Complies with state guidelines</span>
                </div>
                <div className="p-3 border-r border-slate-200 last:border-0">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Pending Mark Registries</span>
                  <p className="text-lg font-extrabold text-[#D97706] mt-1">1 Exam</p>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Unit Test 2 marks due</span>
                </div>
                <div className="p-3">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Homework Submissions</span>
                  <p className="text-lg font-extrabold text-blue-600 mt-1">14 Pending Review</p>
                  <span className="text-[9px] text-slate-400 block mt-0.5">General science task</span>
                </div>
              </div>

              {/* Row 2: Timetables and Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Today's Timetable */}
                <div className="bg-white border border-slate-200 p-6 rounded lg:col-span-2 space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">Today's Class Schedule</h4>
                  <div className="space-y-2">
                    {timetable.map((slot, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-slate-200 rounded text-xs bg-slate-50">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Period {slot.period}</span>
                          <p className="font-bold text-slate-800 mt-0.5">Class {slot.class} - {slot.subject}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-[#0F7A3D] text-[10px] font-bold rounded border border-emerald-100">Primary Allocation</span>
                      </div>
                    ))}
                    {timetable.length === 0 && (
                      <p className="text-xs text-slate-400 py-6 text-center">No schedule allocated for today.</p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">Quick Portal Operations</h4>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <button onClick={() => setActiveTab('ATTENDANCE')} className="p-3 bg-[#0F7A3D] hover:bg-emerald-800 text-white rounded text-left font-bold border border-emerald-900 cursor-pointer shadow-sm">
                      ✓ Take Class Roll Call
                    </button>
                    <button onClick={() => setActiveTab('MARKS_ENTRY')} className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-left font-bold border border-blue-700 cursor-pointer shadow-sm">
                      ✍ Enter Subject Exam Marks
                    </button>
                    <button onClick={() => setActiveTab('MONITORING')} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-left font-bold border border-slate-300 cursor-pointer shadow-sm">
                      🔍 Look Up Student Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3: Alerts and Weak/Top Students list */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Performance Analytics summary */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">Student Progress Roster Metrics</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 border border-slate-200 rounded">
                      <span className="text-[#0F7A3D] font-extrabold block">Top Performers (&gt;90%)</span>
                      <p className="text-base font-extrabold text-slate-800 mt-1">12 Students</p>
                    </div>
                    <div className="p-3 border border-slate-200 rounded">
                      <span className="text-red-600 font-extrabold block">Focus Group Required (&lt;45%)</span>
                      <p className="text-base font-extrabold text-slate-800 mt-1">4 Students</p>
                    </div>
                  </div>
                </div>

                {/* Notices */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">School Notices</h4>
                  <div className="divide-y divide-slate-100 max-h-[160px] overflow-y-auto">
                    {(() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const activeNotices = notices.filter(n => !n.expiryDate || n.expiryDate >= todayStr);
                      return activeNotices.map((n) => (
                        <div key={n.id} className="py-2.5 first:pt-0 last:pb-0">
                          <span className="text-[10px] text-[#0F7A3D] font-bold uppercase">{n.title}</span>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-normal">{n.content}</p>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: ATTENDANCE */}
          {/* ========================================================================= */}
          {activeTab === 'ATTENDANCE' && (() => {
            const totalCount = attendanceSheet.length;
            const presentCount = attendanceSheet.filter(s => s.status === 'PRESENT').length;
            const absentCount = attendanceSheet.filter(s => s.status === 'ABSENT').length;
            const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

            const filteredAttendance = attendanceSheet.filter(s => {
              const nameMatch = s.name.toLowerCase().includes(attendanceSearch.toLowerCase());
              const rollMatch = s.rollNumber.toLowerCase().includes(attendanceSearchRoll.toLowerCase());
              return nameMatch && rollMatch;
            });

            return (
              <div className="bg-white border border-slate-200 p-5 rounded text-left space-y-5 shadow-xs">
                {/* Header Information block */}
                <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 uppercase">Period-Wise Student Attendance Register</h4>
                    <p className="text-xs text-slate-450 mt-0.5">Submit digital attendance logs synced directly to biometric and scholarship databases.</p>
                  </div>
                  
                  {/* Unsaved changes indicator */}
                  {hasUnsavedChanges && (
                    <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded text-[10px] text-amber-800 font-extrabold flex items-center space-x-1.5 animate-pulse uppercase tracking-wider">
                      <AlertCircle size={12} className="shrink-0 text-amber-600" />
                      <span>Unsaved Changes</span>
                    </div>
                  )}
                </div>

                {/* Filter and Parameters Selection */}
                <div className="bg-slate-50/50 p-4 border border-slate-200 rounded grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Class</label>
                    <select 
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-bold text-slate-700"
                    >
                      {classList.map(c => <option key={c.id} value={c.id.toString()}>Class {c.grade.replace('Class ', '')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Section</label>
                    <select 
                      className="w-full p-2 border border-slate-300 rounded bg-white font-bold text-slate-700"
                      defaultValue="A"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Subject</label>
                    <select 
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-bold text-slate-700"
                    >
                      {subjects.map(s => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Period Hour</label>
                    <select 
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-bold text-slate-700"
                    >
                      {[1,2,3,4,5,6,7].map(p => <option key={p} value={p}>Period {p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Calendar Date</label>
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-bold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Teacher</label>
                    <input 
                      type="text"
                      disabled
                      value={user.name}
                      className="w-full p-2 border border-slate-200 rounded bg-slate-100 font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Summarized Top Header Information */}
                <div className="bg-[#E8F5E9]/20 border border-emerald-200/60 p-4 rounded grid grid-cols-2 md:grid-cols-6 gap-4 text-xs font-bold text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Class & Section</span>
                    <span className="text-slate-800 font-black">{classList.find(c => c.id.toString() === selectedClass.toString())?.grade?.replace('Class ', '') || 'Class'}-A</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Subject</span>
                    <span className="text-slate-800 font-black">{subjects.find(s => s.id.toString() === selectedSubject.toString())?.name || 'Subject'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Period Hour</span>
                    <span className="text-[#0F7A3D] font-black">Period {selectedPeriod}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Academic Date</span>
                    <span className="text-slate-800 font-black">{new Date(selectedDate).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Faculty In-Charge</span>
                    <span className="text-slate-800 font-black">{user.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Register Status</span>
                    {isAttendanceUpdated ? (
                      <span className="text-emerald-700 font-extrabold flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5 animate-pulse"></span>
                        Saved Log
                      </span>
                    ) : (
                      <span className="text-amber-600 font-extrabold flex items-center">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
                        Unmarked
                      </span>
                    )}
                  </div>
                </div>

                {/* Top Action Bar & Summary Metrics */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-3 md:w-auto lg:max-w-md w-full">
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-left shrink-0">
                      <span className="text-slate-400 font-extrabold text-[8px] uppercase block tracking-wider">Total</span>
                      <p className="text-sm font-black text-slate-800 mt-0.5">{totalCount}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded text-left shrink-0">
                      <span className="text-emerald-700 font-extrabold text-[8px] uppercase block tracking-wider">Present</span>
                      <p className="text-sm font-black text-emerald-800 mt-0.5">{presentCount}</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-2.5 rounded text-left shrink-0">
                      <span className="text-rose-700 font-extrabold text-[8px] uppercase block tracking-wider">Absent</span>
                      <p className="text-sm font-black text-rose-800 mt-0.5">{absentCount}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-left shrink-0">
                      <span className="text-amber-700 font-extrabold text-[8px] uppercase block tracking-wider">Rate</span>
                      <p className="text-sm font-black text-amber-800 mt-0.5">{attendancePercentage}%</p>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                    <button 
                      onClick={handleSelectAllPresent} 
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded cursor-pointer transition shadow-2xs"
                    >
                      ✓ Mark All Present
                    </button>
                    <button 
                      onClick={handleSelectAllAbsent} 
                      className="px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded cursor-pointer transition shadow-2xs"
                    >
                      ✗ Mark All Absent
                    </button>
                    <button 
                      onClick={handleClearAll} 
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-355 text-slate-700 rounded cursor-pointer transition shadow-2xs"
                    >
                      ⟲ Reset
                    </button>
                    <button 
                      onClick={() => setShowConfirmModal(true)} 
                      className="px-3 py-2 bg-[#0F7A3D] hover:bg-[#0c6633] text-white rounded cursor-pointer transition shadow-2xs"
                    >
                      💾 Save Attendance
                    </button>
                    <button 
                      onClick={printTable} 
                      className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded cursor-pointer transition shadow-2xs"
                    >
                      🖨️ Print Register
                    </button>
                    <button 
                      onClick={handleExportExcel} 
                      className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded cursor-pointer transition shadow-2xs"
                    >
                      📥 Export Excel
                    </button>
                  </div>
                </div>

                {/* Double Search Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Student by name..."
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0F7A3D] font-semibold bg-white"
                    />
                  </div>
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Roll Number..."
                      value={attendanceSearchRoll}
                      onChange={(e) => setAttendanceSearchRoll(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0F7A3D] font-semibold bg-white"
                    />
                  </div>
                </div>

                {/* Register Table grid layout */}
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-600 p-3 text-xs text-red-800 flex items-center space-x-2">
                      <AlertCircle size={14} className="shrink-0 text-red-600" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="overflow-x-auto border border-slate-200 rounded max-h-[50vh]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-650 font-bold uppercase sticky top-0 z-10">
                          <th className="px-4 py-2.5 border border-slate-200 w-24">Roll No</th>
                          <th className="px-4 py-2.5 border border-slate-200">Student Name</th>
                          <th className="px-4 py-2.5 border border-slate-200 w-28">Gender</th>
                          <th className="px-4 py-2.5 border border-slate-200 w-48 text-center">Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-705 font-semibold">
                        {filteredAttendance.map((s, idx) => (
                          <tr key={s.studentId} className={`hover:bg-[#E8F5E9]/30 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                            <td className="px-4 py-2 border border-slate-200 font-mono font-bold text-slate-800">{s.rollNumber}</td>
                            <td className="px-4 py-2 border border-slate-200 text-slate-700">{s.name}</td>
                            <td className="px-4 py-2 border border-slate-200 text-slate-500">
                              {s.gender === 'FEMALE' ? 'Girl' : 'Boy'}
                            </td>
                            <td className="px-4 py-2 border border-slate-200 text-center">
                              <div className="inline-flex items-center space-x-6">
                                <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`att_${s.studentId}`}
                                    checked={s.status === 'PRESENT'}
                                    onChange={() => setStudentStatus(s.studentId, 'PRESENT')}
                                    className="w-4 h-4 text-[#0F7A3D] focus:ring-[#0F7A3D] border-slate-300"
                                  />
                                  <span className={`text-xs font-bold ${s.status === 'PRESENT' ? 'text-emerald-700' : 'text-slate-500'}`}>P</span>
                                </label>
                                <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`att_${s.studentId}`}
                                    checked={s.status === 'ABSENT'}
                                    onChange={() => setStudentStatus(s.studentId, 'ABSENT')}
                                    className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-slate-300"
                                  />
                                  <span className={`text-xs font-bold ${s.status === 'ABSENT' ? 'text-rose-700' : 'text-slate-500'}`}>A</span>
                                </label>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredAttendance.length === 0 && (
                          <tr>
                            <td colSpan="4" className="text-center py-8 text-slate-400 font-bold bg-white">No matching students found in register.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <button 
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full bg-[#0F7A3D] hover:bg-emerald-800 text-white font-extrabold py-2.5 rounded border border-emerald-900 cursor-pointer shadow-sm transition uppercase text-xs tracking-wider"
                  >
                    Save and Sync Attendance Logs
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB: MARKS ENTRY */}
          {/* ========================================================================= */}
          {activeTab === 'MARKS_ENTRY' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Student Subject Examination Marks Entry</h4>
                <p className="text-xs text-slate-400 mt-0.5">Submit semester, quarterly, or midterm exam scores directly into the registry.</p>
              </div>

              <form onSubmit={handleSaveMarks} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Class</label>
                    <select 
                      value={marksClass}
                      onChange={(e) => setMarksClass(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-bold"
                    >
                      {classList.map(c => <option key={c.id} value={c.id.toString()}>Class Grade {c.grade}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject</label>
                    <select 
                      value={marksSubject}
                      onChange={(e) => setMarksSubject(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-bold"
                    >
                      {subjects.map(s => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Exam Type</label>
                    <select 
                      value={marksExamType}
                      onChange={(e) => setMarksExamType(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-bold"
                    >
                      <option value="UNIT_TEST_1">Unit Test 1</option>
                      <option value="UNIT_TEST_2">Unit Test 2</option>
                      <option value="MID_TERM">Mid-Term Exams</option>
                      <option value="FINAL_EXAM">Final Exams</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Max Marks Possible</label>
                    <input 
                      type="number" 
                      value={marksMaxMarks}
                      onChange={(e) => setMarksMaxMarks(parseInt(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-bold"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      type="button" 
                      onClick={() => printTable()}
                      className="w-full py-2 bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded hover:bg-slate-200 cursor-pointer text-xs shadow-xs"
                    >
                      Print Form
                    </button>
                  </div>
                </div>

                {marksSuccess && (
                  <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3 text-xs text-emerald-800 font-bold">
                    Marks registered successfully on state databases!
                  </div>
                )}

                {marksError && (
                  <div className="bg-red-50 border-l-4 border-red-600 p-3 text-xs text-red-800 font-bold">
                    {marksError}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                        <th className="px-4 py-3 border border-slate-200 w-24">Roll Number</th>
                        <th className="px-4 py-3 border border-slate-200">Student Name</th>
                        <th className="px-4 py-3 border border-slate-200 w-44">Marks Obtained</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {marksSheet.map((m) => (
                        <tr key={m.studentId} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 border border-slate-200 font-mono font-bold text-slate-800">{m.rollNumber}</td>
                          <td className="px-4 py-3 border border-slate-200 text-slate-700">{m.name}</td>
                          <td className="px-4 py-3 border border-slate-200">
                            <input 
                              type="number"
                              required
                              min="0"
                              max={marksMaxMarks}
                              value={m.marksObtained}
                              onChange={(e) => updateMarksValue(m.studentId, e.target.value)}
                              placeholder={`Max: ${marksMaxMarks}`}
                              className="px-2 py-1 border border-slate-300 rounded text-xs w-28 focus:outline-none focus:ring-1 focus:ring-[#0F7A3D]"
                            />
                          </td>
                        </tr>
                      ))}
                      {marksSheet.length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center py-6 text-slate-400 font-bold">No active roster students located.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <button 
                  type="submit"
                  disabled={marksLoading}
                  className="w-full bg-[#0F7A3D] hover:bg-emerald-800 text-white font-bold py-2.5 rounded border border-emerald-900 cursor-pointer shadow-sm transition disabled:opacity-50"
                >
                  {marksLoading ? "Registering..." : "Submit Marks Registry"}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: MONITORING */}
          {/* ========================================================================= */}
          {activeTab === 'MONITORING' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Student SIS Directory & Academic Search</h4>
                <p className="text-xs text-slate-400 mt-0.5">Search profiles, contact guardians, and review individual attendance compliance records.</p>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="flex items-center space-x-2">
                  <label className="font-bold text-slate-500 uppercase">Roster Class:</label>
                  <select 
                    value={monitoringClass}
                    onChange={(e) => setMonitoringClass(e.target.value)}
                    className="p-2 border border-slate-300 rounded bg-white font-bold"
                  >
                    {classList.map(c => <option key={c.id} value={c.id.toString()}>Class Grade {c.grade}</option>)}
                  </select>
                </div>

                <div className="relative w-full md:w-64">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name, roll, or admission..."
                    value={monitoringSearch}
                    onChange={(e) => setMonitoringSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0F7A3D]"
                  />
                </div>
              </div>

              {monitoringLoading ? (
                <p className="text-xs text-slate-400 font-bold py-12 text-center">Searching roster sheets...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMonitoring.map((s) => (
                    <div key={s.id} className="p-4 border border-slate-200 rounded space-y-3 bg-slate-50 hover:border-slate-350 transition flex flex-col justify-between">
                      <div className="text-xs">
                        <span className="font-extrabold text-slate-800 block text-sm">{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Roll: {s.rollNumber} | Admission: {s.admissionNumber}</span>
                        <p className="text-slate-500 mt-2 font-semibold">Guardian: <b>{s.parentName}</b></p>
                        <p className="text-slate-500 font-semibold">Mobile: <b>{s.parentMobile}</b></p>
                      </div>

                      <button 
                        onClick={() => handleViewStudentDetails(s.id)}
                        className="w-full mt-2 bg-white hover:bg-slate-100 text-[#0F7A3D] text-[11px] font-bold py-1.5 rounded border border-slate-300 cursor-pointer text-center"
                      >
                        View Full Academic Profile
                      </button>
                    </div>
                  ))}
                  {filteredMonitoring.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center col-span-full font-bold">No students match current search query.</p>
                  )}
                </div>
              )}

              {/* Selected Student profile popup copy */}
              {selectedStudentDetails && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="bg-[#0F7A3D] text-white p-4 border-b border-[#D97706] flex justify-between items-center">
                      <h4 className="font-bold text-xs uppercase tracking-wider">Student Registry Card: {selectedStudentDetails.student.name}</h4>
                      <button onClick={() => setSelectedStudentDetails(null)} className="text-white hover:text-slate-200 cursor-pointer">✕</button>
                    </div>

                    <div className="p-6 space-y-6 text-xs text-left">
                      <div className="grid grid-cols-2 gap-4">
                        <p><b>Name:</b> {selectedStudentDetails.student.name}</p>
                        <p><b>Roll Number:</b> {selectedStudentDetails.student.rollNumber}</p>
                        <p><b>Admission Number:</b> {selectedStudentDetails.student.admissionNumber}</p>
                        <p><b>Class Grade:</b> Class {selectedStudentDetails.student.class.grade}</p>
                        <p><b>Gender:</b> {selectedStudentDetails.student.gender}</p>
                        <p><b>Parent / Guardian Name:</b> {selectedStudentDetails.student.parentName}</p>
                        <p><b>Parent Mobile Number:</b> {selectedStudentDetails.student.parentMobile}</p>
                        <p><b>Registered Address:</b> {selectedStudentDetails.student.address}</p>
                      </div>

                      <div className="border-t pt-4">
                        <h5 className="font-bold text-slate-700 mb-2">Academic Performance Statistics</h5>
                        <p>Overall Attendance Rate: <b>{Math.round(selectedStudentDetails.attendancePercentage)}%</b></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: NOTICES */}
          {/* ========================================================================= */}
          {activeTab === 'NOTICES' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Board Notice Distribution Hub</h4>
                <p className="text-xs text-slate-400 mt-0.5">Critical notifications distributed from the School Education Department.</p>
              </div>

              <div className="divide-y divide-slate-200">
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const activeNotices = notices.filter(n => !n.expiryDate || n.expiryDate >= todayStr);
                  if (activeNotices.length === 0) {
                    return <p className="text-xs text-slate-400 py-6 text-center font-bold">No active board notifications found.</p>;
                  }
                  return activeNotices.map((n) => (
                    <div key={n.id} className="py-4 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-[#0F7A3D] uppercase tracking-wider">{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed">{n.content}</p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* CONFIRMATION ATTENDANCE MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-[#0F7A3D] text-white p-4 border-b border-[#D97706] font-bold text-xs uppercase">
              Confirm Attendance Submission
            </div>
            <div className="p-6 text-xs text-left space-y-3">
              <p>Are you sure you want to save the attendance logs for Class {classList.find(c => c.id.toString() === selectedClass.toString())?.grade || 'Class'}?</p>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <p>Present: <b>{attendanceSheet.filter(s => s.status === 'PRESENT').length} Students</b></p>
                <p>Absent: <b>{attendanceSheet.filter(s => s.status === 'ABSENT').length} Students</b></p>
              </div>
              <p className="text-[10px] text-slate-400">Saving will broadcast notices to student dashboards and trigger parental alert records.</p>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end space-x-2">
              <button onClick={() => setShowConfirmModal(false)} className="px-3 py-1.5 border border-slate-350 rounded text-xs bg-white text-slate-700 hover:bg-slate-100 cursor-pointer">Cancel</button>
              <button onClick={handleSaveAttendance} className="px-4 py-1.5 bg-[#0F7A3D] text-white rounded text-xs font-bold border border-emerald-900 cursor-pointer hover:bg-emerald-800">Confirm & Save</button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE MENU DRAWER */}
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
                <span className="text-[9px] text-[#D97706] font-bold uppercase">Faculty Portal</span>
              </div>
            </div>

            <nav className="flex-1 space-y-1">
              {[
                { id: 'HOME', name: 'Home Overview', icon: ClipboardList },
                { id: 'ATTENDANCE', name: 'Attendance Roll Call', icon: Calendar },
                { id: 'MARKS_ENTRY', name: 'Marks Registry', icon: GraduationCap },
                { id: 'MONITORING', name: 'Student SIS Roster', icon: Users },
                { id: 'NOTICES', name: 'Board Notices', icon: BellRing }
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
