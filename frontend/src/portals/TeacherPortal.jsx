import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, GraduationCap, ClipboardList, 
  Search, Download, Brain, LogOut, CheckCircle, XCircle, Send, X, CheckSquare, Award
} from 'lucide-react';
import apLogo from '../assets/ap-logo.png';

export default function TeacherPortal({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('ATTENDANCE'); // ATTENDANCE, MARKS_ENTRY, MONITORING, REPORTS, ANALYTICS
  const [classList, setClassList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [attendanceSheet, setAttendanceSheet] = useState([]);
  
  // Attendance Selection Parameters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // UI States
  const [error, setError] = useState('');
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isAttendanceUpdated, setIsAttendanceUpdated] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submissionTime, setSubmissionTime] = useState('');

  // Marks Entry parameters
  const [marksClass, setMarksClass] = useState('');
  const [marksSubject, setMarksSubject] = useState('');
  const [marksExamType, setMarksExamType] = useState('MID');
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
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);

  // Notices / Notifications
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  // Load students for attendance when configuration changes
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedPeriod && selectedDate) {
      fetchAttendanceSheet();
    }
  }, [selectedClass, selectedSubject, selectedPeriod, selectedDate]);

  // Load students for marks entry when parameters change
  useEffect(() => {
    if (marksClass) {
      fetchMarksSheet();
    }
  }, [marksClass, marksSubject, marksExamType]);

  // Load student monitoring directory when class changes
  useEffect(() => {
    if (monitoringClass) {
      fetchMonitoringStudents();
    }
  }, [monitoringClass]);

  const fetchInitialData = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      // 1. Classes
      const resClasses = await fetch('/api/academic/classes', { headers });
      if (resClasses.ok) {
        const classes = await resClasses.json();
        setClassList(classes);
        if (classes.length > 0) {
          setSelectedClass(classes[0].id.toString());
          setMarksClass(classes[0].id.toString());
          setMonitoringClass(classes[0].id.toString());
        }
      }

      // 2. Subjects
      const resSubjects = await fetch('/api/academic/subjects', { headers });
      if (resSubjects.ok) {
        const subs = await resSubjects.json();
        setSubjects(subs);
        if (subs.length > 0) {
          setSelectedSubject(subs[0].id.toString());
          setMarksSubject(subs[0].id.toString());
        }
      }

      // 3. Timetable/Schedule
      const resTimetable = await fetch(`/api/academic/timetable/1`, { headers }); // mock Class ID 1 timetable
      if (resTimetable.ok) {
        const schedule = await resTimetable.json();
        const formattedSchedule = schedule.map(s => ({
          period: s.period,
          subject: s.subject.name,
          class: s.class.grade
        }));
        setTimetable(formattedSchedule);
      }

      // 4. Notices
      const resNotices = await fetch('/api/academic/notices', { headers });
      if (resNotices.ok) setNotices(await resNotices.json());

    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceSheet = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    setError('');
    try {
      const res = await fetch(`/api/attendance/list?classId=${selectedClass}&subjectId=${selectedSubject}&period=${selectedPeriod}&date=${selectedDate}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAttendanceSheet(data.students);
        setIsAttendanceUpdated(data.isUpdated);
        setIsLocked(false); // default unlock for edits
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMarksSheet = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    setMarksError('');
    try {
      const res = await fetch(`/api/students/list?classId=${marksClass}`, { headers });
      if (res.ok) {
        const students = await res.json();
        // Setup scores input registry
        const sheet = students.map(s => ({
          studentId: s.id,
          rollNumber: s.rollNumber,
          name: s.name,
          marksObtained: ''
        }));
        setMarksSheet(sheet);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMonitoringStudents = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    setMonitoringLoading(true);
    try {
      const res = await fetch(`/api/students/list?classId=${monitoringClass}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMonitoringStudents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMonitoringLoading(false);
    }
  };

  const handleViewStudentDetails = async (studentId) => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const res = await fetch(`/api/students/profile/${studentId}`, { headers });
      if (res.ok) {
        const details = await res.json();
        setSelectedStudentDetails(details);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Change individual student attendance status
  const handleSetStatus = (studentId, status) => {
    setAttendanceSheet(prev => 
      prev.map(s => s.studentId === studentId ? { ...s, status } : s)
    );
  };

  // Attendance Action Buttons
  const handleSelectAllPresent = () => {
    setAttendanceSheet(prev => prev.map(s => ({ ...s, status: 'PRESENT' })));
  };

  const handleMarkAbsenteesOnly = () => {
    setAttendanceSheet(prev => 
      prev.map(s => s.status === 'ABSENT' ? s : { ...s, status: 'PRESENT' })
    );
  };

  const handleClearAll = () => {
    setAttendanceSheet(prev => prev.map(s => ({ ...s, status: null })));
  };

  // Submit Period Attendance
  const handleSaveAttendance = async () => {
    const unmarkedStudents = attendanceSheet.filter(s => !s.status);
    if (unmarkedStudents.length > 0) {
      setError("Please mark attendance (Present or Absent) for all students.");
      setShowConfirmModal(false);
      return;
    }

    setError('');
    try {
      const response = await fetch('/api/attendance/save', {
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

      if (response.ok) {
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
        
        // Auto reset after successful save: Return all students to PENDING (null)
        setAttendanceSheet(prev => prev.map(s => ({ ...s, status: null })));
        
        setTimeout(() => {
          setSaveSuccessBanner(null);
        }, 8000);

        // Refresh analytics / monitoring states
        fetchInitialData();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save attendance.");
      }
    } catch (err) {
      console.error(err);
      setError("Server connection failure saving attendance.");
    } finally {
      setShowConfirmModal(false);
    }
  };

  // Submit Student Marks
  const handleSaveMarks = async (e) => {
    e.preventDefault();
    setMarksSuccess(false);
    setMarksError('');
    setMarksLoading(true);

    try {
      // Validate that all marks are loaded
      const isAnyEmpty = marksSheet.some(s => s.marksObtained === '');
      if (isAnyEmpty) {
        setMarksError("Please enter exam marks for all students.");
        setMarksLoading(false);
        return;
      }

      // Check max limits
      const isOverLimit = marksSheet.some(s => parseFloat(s.marksObtained) > parseFloat(marksMaxMarks));
      if (isOverLimit) {
        setMarksError(`Scores cannot exceed max marks of ${marksMaxMarks}.`);
        setMarksLoading(false);
        return;
      }

      for (const student of marksSheet) {
        await fetch('/api/academic/marks/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            studentId: student.studentId,
            subjectId: marksSubject,
            examType: marksExamType,
            marksObtained: parseFloat(student.marksObtained),
            maxMarks: parseFloat(marksMaxMarks)
          })
        });
      }

      setMarksSuccess(true);
      // reset sheet
      setMarksSheet(prev => prev.map(s => ({ ...s, marksObtained: '' })));
    } catch (err) {
      console.error(err);
      setMarksError("Internal database error saving student marks.");
    } finally {
      setMarksLoading(false);
    }
  };

  const handleDownloadReport = (type, format) => {
    const filename = `${type}_report_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    const url = `/api/reports/${type}?classId=${selectedClass}&date=${selectedDate}&format=${format}`;
    
    // Download trigger
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-[#004D20] text-white p-6 shadow-xl z-20 border-r border-[#D4AF37]/20">
        <div className="flex items-center space-x-3 mb-8">
          <img
            className="h-10 w-auto"
            src={apLogo}
            alt="Emblem"
          />
          <div>
            <h1 className="font-extrabold text-sm tracking-wider">AP EDU TEACHER</h1>
            <span className="text-xs text-[#D4AF37] font-semibold uppercase">{user.role}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ATTENDANCE' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
            }`}
          >
            <CheckSquare size={16} />
            <span>Smart Attendance</span>
          </button>

          <button 
            onClick={() => setActiveTab('MARKS_ENTRY')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MARKS_ENTRY' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
            }`}
          >
            <Award size={16} />
            <span>Marks Entry</span>
          </button>

          <button 
            onClick={() => setActiveTab('MONITORING')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MONITORING' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
            }`}
          >
            <Search size={16} />
            <span>Student Monitoring</span>
          </button>

          <button 
            onClick={() => setActiveTab('REPORTS')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'REPORTS' ? 'bg-[#006B2D] text-white shadow-md border border-[#D4AF37]/20' : 'text-slate-300 hover:bg-[#138A36]/30'
            }`}
          >
            <Download size={16} />
            <span>Download Reports</span>
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
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* HEADER BAR */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-[#006B2D]">
              {activeTab === 'MARKS_ENTRY' ? 'Marks Registry' : 
               activeTab === 'MONITORING' ? 'Student Performance Monitor' : 
               activeTab === 'REPORTS' ? 'Reports Center' : 
               activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}
            </h2>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              {user.name} • Teacher Portal
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="bg-[#D4AF37]/15 text-[#004D20] font-bold px-3 py-1 rounded-full text-xs border border-[#D4AF37]/35">
              Subject Faculty
            </span>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {/* ========================================================================= */}
          {/* TAB: SMART ATTENDANCE */}
          {/* ========================================================================= */}
          {activeTab === 'ATTENDANCE' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* Form parameters selection */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 h-fit space-y-4">
                <h4 className="font-bold text-slate-700 mb-2">Configure Attendance Sheet</h4>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class</label>
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-[#006B2D]"
                  >
                    {classList.map(c => (
                      <option key={c.id} value={c.id}>{c.grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                  <select 
                    value={selectedSubject} 
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-[#006B2D]"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Period Number</label>
                  <select 
                    value={selectedPeriod} 
                    onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-[#006B2D]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(p => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-[#006B2D]"
                  />
                </div>

                {/* Schedule list */}
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    My Schedule Overview
                  </span>
                  <div className="space-y-2">
                    {timetable.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <span className="font-semibold text-slate-700">Period {t.period}: {t.subject}</span>
                        <span className="bg-[#E8F5E9] text-[#006B2D] font-bold px-2 py-0.5 rounded border border-emerald-100">
                          Class {t.class}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Students sheet check grid */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
                  <div>
                    <h4 className="font-bold text-slate-700">Smart Attendance Roll-Call</h4>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">
                      Class ID: {selectedClass} • Period: {selectedPeriod} • Status: {isAttendanceUpdated ? '✅ Saved / Modifiable' : '⬜ Awaiting Entry (Pending)'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleSelectAllPresent}
                      className="text-xs font-bold py-1.5 px-3 rounded-lg transition bg-[#E8F5E9] hover:bg-emerald-100 text-[#006B2D] border border-emerald-200 cursor-pointer"
                    >
                      Select All Present
                    </button>
                    <button 
                      onClick={handleMarkAbsenteesOnly}
                      className="text-xs font-bold py-1.5 px-3 rounded-lg transition bg-[#E8F5E9] hover:bg-emerald-100 text-[#006B2D] border border-emerald-200 cursor-pointer"
                    >
                      Mark Absentees Only
                    </button>
                    <button 
                      onClick={handleClearAll}
                      className="text-xs font-bold py-1.5 px-3 rounded-lg transition bg-slate-100 hover:bg-slate-250 text-slate-700 border border-slate-200 cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-50 border-l-4 border-rose-500 p-3 text-xs text-rose-800 rounded-r-md">
                    ⚠️ {error}
                  </div>
                )}

                {/* Success Banner */}
                {saveSuccessBanner && (
                  <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-md shadow-sm space-y-1 relative">
                    <button 
                      onClick={() => setSaveSuccessBanner(null)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                    <h5 className="font-extrabold text-[#004D20] text-xs sm:text-sm">✅ Attendance Saved Successfully</h5>
                    <div className="text-[11px] text-emerald-800 space-y-0.5 font-semibold">
                      <p>Class: {saveSuccessBanner.grade}</p>
                      <p>Date: {saveSuccessBanner.date}</p>
                      <p>Present: {saveSuccessBanner.present} | Absent: {saveSuccessBanner.absent}</p>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1">
                  {attendanceSheet.map((student) => (
                    <div 
                      key={student.studentId}
                      className="flex justify-between items-center py-3 hover:bg-slate-50/50 px-2 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="font-mono text-xs font-bold text-[#006B2D] w-12">{student.rollNumber}</span>
                        <span className="font-semibold text-slate-800 text-sm">{student.name}</span>
                      </div>
                      
                      {/* Radios PRESENT / ABSENT */}
                      <div className="flex items-center gap-4">
                        <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                          <input
                            type="radio"
                            name={`attendance-${student.studentId}`}
                            value="PRESENT"
                            checked={student.status === 'PRESENT'}
                            onChange={() => handleSetStatus(student.studentId, 'PRESENT')}
                            className="w-4 h-4 accent-[#006B2D] cursor-pointer"
                          />
                          <span className={`text-xs font-bold transition-all ${
                            student.status === 'PRESENT' ? 'text-emerald-700 font-black' : 'text-slate-500 hover:text-slate-700'
                          }`}>
                            Present
                          </span>
                        </label>

                        <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                          <input
                            type="radio"
                            name={`attendance-${student.studentId}`}
                            value="ABSENT"
                            checked={student.status === 'ABSENT'}
                            onChange={() => handleSetStatus(student.studentId, 'ABSENT')}
                            className="w-4 h-4 accent-rose-600 cursor-pointer"
                          />
                          <span className={`text-xs font-bold transition-all ${
                            student.status === 'ABSENT' ? 'text-rose-700 font-black' : 'text-slate-500 hover:text-slate-700'
                          }`}>
                            Absent
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                  {attendanceSheet.length === 0 && (
                    <p className="text-center py-8 text-slate-500 text-xs">Configure parameters above to load student list.</p>
                  )}
                </div>

                {attendanceSheet.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={() => {
                        const unmarkedStudents = attendanceSheet.filter(s => !s.status);
                        if (unmarkedStudents.length > 0) {
                          setError("Please mark attendance (Present or Absent) for all students.");
                          return;
                        }
                        setError('');
                        setShowConfirmModal(true);
                      }}
                      className="bg-[#006B2D] hover:bg-[#138A36] text-white font-bold text-sm py-2 px-6 rounded-lg shadow-md cursor-pointer transition-all border border-[#004D20]"
                    >
                      Save Attendance Sheet
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: MARKS ENTRY */}
          {/* ========================================================================= */}
          {activeTab === 'MARKS_ENTRY' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              {/* Configurations */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 h-fit space-y-4">
                <h4 className="font-bold text-slate-700 mb-2">Configure Marks Entry</h4>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class</label>
                  <select 
                    value={marksClass} 
                    onChange={(e) => setMarksClass(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-[#006B2D]"
                  >
                    {classList.map(c => (
                      <option key={c.id} value={c.id}>{c.grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                  <select 
                    value={marksSubject} 
                    onChange={(e) => setMarksSubject(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-[#006B2D]"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Exam Type</label>
                  <select 
                    value={marksExamType} 
                    onChange={(e) => setMarksExamType(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-[#006B2D]"
                  >
                    <option value="UNIT_TEST_1">Unit Test 1 (UNIT_TEST_1)</option>
                    <option value="UNIT_TEST_2">Unit Test 2 (UNIT_TEST_2)</option>
                    <option value="QUARTERLY">Quarterly (QUARTERLY)</option>
                    <option value="HALF_YEARLY">Half Yearly (HALF_YEARLY)</option>
                    <option value="ANNUAL">Annual (ANNUAL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Marks</label>
                  <input 
                    type="number" 
                    value={marksMaxMarks}
                    onChange={(e) => setMarksMaxMarks(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-[#006B2D]"
                  />
                </div>
              </div>

              {/* Student Marks Sheet */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:col-span-2 space-y-4">
                <div>
                  <h4 className="font-bold text-slate-700">Enter Student Scores</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Class ID: {marksClass} • Exam: {marksExamType} • Max Marks: {marksMaxMarks}
                  </p>
                </div>

                {marksSuccess && (
                  <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-xs text-emerald-800 rounded-r-md">
                    ✅ Marks uploaded and saved successfully! Audit log created.
                  </div>
                )}

                {marksError && (
                  <div className="bg-rose-50 border-l-4 border-rose-500 p-3 text-xs text-rose-800 rounded-r-md">
                    ⚠️ {marksError}
                  </div>
                )}

                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1">
                  {marksSheet.map((student, idx) => (
                    <div 
                      key={student.studentId}
                      className="flex justify-between items-center py-2.5 hover:bg-slate-50/50 px-2 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="font-mono text-xs font-bold text-[#006B2D] w-12">{student.rollNumber}</span>
                        <span className="font-semibold text-slate-800 text-sm">{student.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={student.marksObtained}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMarksSheet(prev => prev.map((s, sIdx) => sIdx === idx ? { ...s, marksObtained: val } : s));
                          }}
                          placeholder="Marks"
                          min="0"
                          max={marksMaxMarks}
                          className="w-24 text-right rounded-lg border border-slate-300 py-1 px-2.5 text-xs font-semibold focus:outline-none focus:ring-[#006B2D]"
                        />
                        <span className="text-xs text-slate-400 font-bold">/ {marksMaxMarks}</span>
                      </div>
                    </div>
                  ))}
                  {marksSheet.length === 0 && (
                    <p className="text-center py-8 text-slate-500 text-xs">Select Class from configuration panel to load student registry.</p>
                  )}
                </div>

                {marksSheet.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={handleSaveMarks}
                      disabled={marksLoading}
                      className="bg-[#006B2D] hover:bg-[#138A36] text-white font-bold text-sm py-2 px-6 rounded-lg shadow-md cursor-pointer transition-all disabled:opacity-50 border border-[#004D20]"
                    >
                      {marksLoading ? 'Saving Scores...' : 'Save Student Marks'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: STUDENT MONITORING */}
          {/* ========================================================================= */}
          {activeTab === 'MONITORING' && (
            <div className="space-y-6 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#006B2D] flex items-center justify-center border border-emerald-100 shrink-0">
                    <Search size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700">Class Monitoring Dashboard</h4>
                    <p className="text-xs text-slate-500">Track and identify students with high dropout risks.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <select 
                    value={monitoringClass} 
                    onChange={(e) => setMonitoringClass(e.target.value)}
                    className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:outline-none focus:ring-[#006B2D] bg-white font-bold text-slate-700"
                  >
                    {classList.map(c => (
                      <option key={c.id} value={c.id}>{c.grade}</option>
                    ))}
                  </select>

                  <input 
                    type="text"
                    value={monitoringSearch}
                    onChange={(e) => setMonitoringSearch(e.target.value)}
                    placeholder="Search student..."
                    className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:outline-none focus:ring-[#006B2D] bg-white"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#E8F5E9] text-[#004D20] uppercase text-xs font-black border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Roll No</th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Attendance Rate</th>
                        <th className="px-6 py-4">Status / Risk Indicator</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {monitoringStudents
                        .filter(s => s.name.toLowerCase().includes(monitoringSearch.toLowerCase()))
                        .map((student) => {
                          const isRiskHigh = student.status === 'RISK_HIGH';
                          const isRiskMed = student.status === 'RISK_MEDIUM';
                          const isRiskLow = student.status === 'RISK_LOW';
                          
                          return (
                            <tr key={student.id} className="hover:bg-slate-50/50">
                              <td className="px-6 py-4 font-mono text-[#006B2D] font-bold">{student.rollNumber}</td>
                              <td className="px-6 py-4 font-extrabold text-slate-900">{student.name}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-1.5 rounded-full ${
                                        student.attendancePercentage < 75 ? 'bg-rose-500' :
                                        student.attendancePercentage < 85 ? 'bg-amber-500' :
                                        'bg-emerald-600'
                                      }`}
                                      style={{ width: `${student.attendancePercentage}%` }}
                                    ></div>
                                  </div>
                                  <span className={`font-bold ${
                                    student.attendancePercentage < 75 ? 'text-rose-600' : 'text-slate-700'
                                  }`}>{student.attendancePercentage}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                  isRiskHigh ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                  isRiskMed ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                  isRiskLow ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                  'bg-emerald-50 border-emerald-200 text-emerald-700'
                                }`}>
                                  {isRiskHigh ? 'HIGH DROPOUT RISK' :
                                   isRiskMed ? 'MEDIUM DROPOUT RISK' :
                                   isRiskLow ? 'LOW DROPOUT RISK' : 'STABLE / ACTIVE'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    handleViewStudentDetails(student.id);
                                  }}
                                  className="text-xs bg-[#006B2D] hover:bg-[#138A36] text-white px-3 py-1.5 rounded-md font-bold transition cursor-pointer shadow-xs active:scale-95"
                                >
                                  Monitor Profile
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      {monitoringStudents.length === 0 && !monitoringLoading && (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-slate-400 text-xs font-semibold">No students registered in this class.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student Detail Monitor Modal */}
              {selectedStudent && selectedStudentDetails && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
                  <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative">
                    <button 
                      onClick={() => {
                        setSelectedStudent(null);
                        setSelectedStudentDetails(null);
                      }}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                    >
                      <X size={20} />
                    </button>

                    <div className="flex items-center space-x-4 border-b border-slate-100 pb-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#006B2D] flex items-center justify-center text-xl font-bold border border-[#006B2D]/20">
                        {selectedStudent.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-800">{selectedStudent.name}</h4>
                        <p className="text-xs text-slate-500 font-semibold">Roll Number: {selectedStudent.rollNumber} • Admission ID: {selectedStudentDetails.student.admissionNumber}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3 bg-[#F6FBF6]/50 p-4 rounded-xl border border-emerald-100">
                        <p className="text-[10px] font-black text-[#006B2D] uppercase tracking-wider">Attendance Analysis</p>
                        <p><b>Present Periods:</b> {selectedStudentDetails.student.presentPeriods}</p>
                        <p><b>Absent Periods:</b> {selectedStudentDetails.student.absentPeriods}</p>
                        <p><b>Total Conducted:</b> {selectedStudentDetails.student.totalConductedPeriods}</p>
                        <p><b>Overall Percentage:</b> <span className="font-extrabold text-[#006B2D]">{selectedStudentDetails.student.attendancePercentage}%</span></p>
                      </div>

                      <div className="space-y-3 bg-[#F6FBF6]/50 p-4 rounded-xl border border-emerald-100">
                        <p className="text-[10px] font-black text-[#006B2D] uppercase tracking-wider">Academic Marks Overview</p>
                        <div className="max-h-[140px] overflow-y-auto space-y-1">
                          {selectedStudentDetails.marks.map((m) => (
                            <div key={m.id} className="flex justify-between text-xs py-1 border-b border-slate-100 last:border-b-0 font-semibold text-slate-700">
                              <span>{m.subject.name} ({m.examType})</span>
                              <span>{m.marksObtained} / {m.maxMarks}</span>
                            </div>
                          ))}
                          {selectedStudentDetails.marks.length === 0 && (
                            <p className="text-xs text-slate-400">No examination records uploaded yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOWNLOAD REPORTS */}
          {/* ========================================================================= */}
          {activeTab === 'REPORTS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto text-left space-y-6 animate-fade-in">
              <div>
                <h4 className="font-bold text-slate-700">Download Class Performance & Attendance Sheets</h4>
                <p className="text-xs text-slate-500 mt-1">Export daily/monthly school reports directly to Excel or PDF for offsite audits.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between hover:border-[#006B2D] transition">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Daily Report</span>
                    <h5 className="font-bold text-slate-800">Daily Attendance Summary</h5>
                    <p className="text-xs text-slate-500 leading-normal">Period-wise Present/Absent log sheets of all students for the selected calendar date.</p>
                  </div>
                  <div className="flex space-x-2 mt-6">
                    <button 
                      onClick={() => handleDownloadReport('daily-attendance', 'pdf')}
                      className="bg-[#006B2D] hover:bg-[#138A36] text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xs cursor-pointer border border-[#004D20]"
                    >
                      PDF
                    </button>
                    <button 
                      onClick={() => handleDownloadReport('daily-attendance', 'excel')}
                      className="bg-white hover:bg-slate-100 text-[#006B2D] text-xs font-bold py-2 px-3 rounded-lg border border-[#006B2D] cursor-pointer"
                    >
                      EXCEL
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between hover:border-[#006B2D] transition">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Monthly Report</span>
                    <h5 className="font-bold text-slate-800">Monthly Attendance Summaries</h5>
                    <p className="text-xs text-slate-500 leading-normal">Aggregated attendance percentages, present days, and absent days for school records.</p>
                  </div>
                  <div className="flex space-x-2 mt-6">
                    <button 
                      onClick={() => handleDownloadReport('monthly-attendance', 'pdf')}
                      className="bg-[#006B2D] hover:bg-[#138A36] text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xs cursor-pointer border border-[#004D20]"
                    >
                      PDF
                    </button>
                    <button 
                      onClick={() => handleDownloadReport('monthly-attendance', 'excel')}
                      className="bg-white hover:bg-slate-100 text-[#006B2D] text-xs font-bold py-2 px-3 rounded-lg border border-[#006B2D] cursor-pointer"
                    >
                      EXCEL
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between hover:border-[#006B2D] transition">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Marks Report</span>
                    <h5 className="font-bold text-slate-800">Class Performance Sheet</h5>
                    <p className="text-xs text-slate-500 leading-normal">Full listing of student exam grades, overall percentages, class rank, and dropout risk alerts.</p>
                  </div>
                  <div className="flex space-x-2 mt-6">
                    <button 
                      onClick={() => handleDownloadReport('student-performance', 'pdf')}
                      className="bg-[#006B2D] hover:bg-[#138A36] text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xs cursor-pointer border border-[#004D20]"
                    >
                      PDF
                    </button>
                    <button 
                      onClick={() => handleDownloadReport('student-performance', 'excel')}
                      className="bg-white hover:bg-slate-100 text-[#006B2D] text-xs font-bold py-2 px-3 rounded-lg border border-[#006B2D] cursor-pointer"
                    >
                      EXCEL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* CONFIRM SAVE ATTENDANCE MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-left space-y-4 shadow-xl border border-slate-200">
            <h5 className="font-bold text-slate-800 text-sm sm:text-base">Confirm Attendance Submission</h5>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Are you sure you want to save this attendance sheet? Parents of absentees will immediately receive SMS and portal notifications.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAttendance}
                className="bg-[#006B2D] hover:bg-[#138A36] text-white text-xs font-bold py-2 px-4 rounded-lg shadow-md cursor-pointer border border-[#004D20]"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
