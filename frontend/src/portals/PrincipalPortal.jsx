import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, UserCog, Calendar, FileText, 
  Brain, BellRing, LogOut, CheckCircle, XCircle, 
  Download, PlusCircle, Check, X, ShieldAlert, Award, Coffee, Menu
} from 'lucide-react';
import apLogo from '../assets/ap-logo.png';
import { API_URL, parseResponse } from '../config/api';

export default function PrincipalPortal({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classList, setClassList] = useState([]);
  const [notices, setNotices] = useState([]);
  const [aiPredictions, setAiPredictions] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Notice form
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeSuccess, setNoticeSuccess] = useState(false);

  // Certificate form
  const [certStudentId, setCertStudentId] = useState('');
  const [certType, setCertType] = useState('BONAFIDE');
  const [certResult, setCertResult] = useState(null);

  // Reports form
  const [reportType, setReportType] = useState('daily-attendance');
  const [reportClass, setReportClass] = useState('1');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportFormat, setReportFormat] = useState('pdf');

  // Load dashboard data
  useEffect(() => {
    fetchDashboardData();

    const handleAttendanceChange = () => {
      fetchDashboardData();
    };

    window.addEventListener('attendance_changed', handleAttendanceChange);
    return () => {
      window.removeEventListener('attendance_changed', handleAttendanceChange);
    };
  }, [token]);

  const fetchDashboardData = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      // 1. Fetch Students
      const resStud = await fetch(`${API_URL}/api/students/list`, { headers });
      const studentsData = await parseResponse(resStud);
      setStudents(studentsData);

      // 2. Fetch Teachers
      const resTeach = await fetch(`${API_URL}/api/academic/teachers`, { headers });
      const teachersData = await parseResponse(resTeach);
      setTeachers(teachersData);

      // 3. Fetch Classes
      const resClasses = await fetch(`${API_URL}/api/academic/classes`, { headers });
      const classes = await parseResponse(resClasses);
      const sortedClasses = [...classes].sort((a, b) => a.id - b.id);
      setClassList(sortedClasses);
      if (sortedClasses.length > 0) {
        setReportClass(sortedClasses[0].id.toString());
      }

      // 4. Fetch Notices
      const resNotices = await fetch(`${API_URL}/api/academic/notices`, { headers });
      const noticesData = await parseResponse(resNotices);
      setNotices(noticesData);

      // 5. Fetch AI Predictions
      const resAiPred = await fetch(`${API_URL}/api/ai/predictions`, { headers });
      const aiPredictionsData = await parseResponse(resAiPred);
      setAiPredictions(aiPredictionsData);

      // 6. Fetch AI Suggestions
      const resAiSug = await fetch(`${API_URL}/api/ai/suggestions`, { headers });
      const aiSuggestionsData = await parseResponse(resAiSug);
      setAiSuggestions(aiSuggestionsData);

      // Mock Audit Logs (Principal View)
      setAuditLogs([
        { id: 1, action: "USER_LOGIN", userRole: user.role, username: user.username, details: "Principal logged in successfully.", timestamp: new Date().toLocaleString() },
        { id: 2, action: "ATTENDANCE_SAVE", userRole: "TEACHER", username: "teacher2", details: "Saved attendance for Class 10, P3 Science. 41 Present, 1 Absent.", timestamp: new Date(Date.now() - 3600000).toLocaleString() },
        { id: 3, action: "REPORT_DOWNLOAD", userRole: "PRINCIPAL", username: "principal1", details: "Exported Monthly Attendance Excel Report.", timestamp: new Date(Date.now() - 7200000).toLocaleString() }
      ]);

    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  // Publish Notice
  const handlePublishNotice = async (e) => {
    e.preventDefault();
    setNoticeSuccess(false);

    try {
      const response = await fetch(`${API_URL}/api/academic/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: noticeTitle, content: noticeContent })
      });

      await parseResponse(response);
      setNoticeTitle('');
      setNoticeContent('');
      setNoticeSuccess(true);
      // refresh notice list
      const resNotices = await fetch(`${API_URL}/api/academic/notices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const noticesData = await parseResponse(resNotices);
      setNotices(noticesData);
    } catch (err) {
      console.error(err);
    }
  };

  // Generate Certificate
  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    setCertResult(null);

    try {
      const response = await fetch(`${API_URL}/api/students/certificate/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentId: certStudentId, type: certType })
      });

      const data = await parseResponse(response);
      setCertResult(data.certificate);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to generate certificate");
    }
  };

  // Generate Reports
  const handleDownloadReport = () => {
    let url = `${API_URL}/api/reports/${reportType}?format=${reportFormat}`;
    if (reportType === 'daily-attendance' || reportType === 'monthly-attendance' || reportType === 'student-performance') {
      url += `&classId=${reportClass}`;
    }
    if (reportType === 'daily-attendance') {
      url += `&date=${reportDate}`;
    }

    // Direct browser redirect to trigger Express file streaming
    window.open(url, '_blank');
  };

  const avgAttendance = students.length > 0 
    ? (students.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / students.length).toFixed(1) 
    : '91.4';

  const sortedClasses = [...classList].sort((a, b) => a.id - b.id);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex flex-col lg:w-64 md:w-20 bg-brand-dark text-white p-4 lg:p-6 shadow-xl z-20 shrink-0 transition-all duration-300">
        <div className="flex items-center space-x-3 mb-8 justify-center lg:justify-start">
          <img
            className="h-10 w-auto shrink-0"
            src={apLogo}
            alt="Emblem"
          />
          <div className="hidden lg:block">
            <h1 className="font-extrabold text-xs tracking-wider">AP EDU PRINCIPAL</h1>
            <span className="text-[10px] text-brand-gold font-semibold uppercase">{user.role}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 lg:px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer justify-center lg:justify-start ${
              activeTab === 'DASHBOARD' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Dashboard"
          >
            <LayoutDashboard size={18} className="shrink-0" />
            <span className="hidden lg:inline">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('STUDENTS')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 lg:px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer justify-center lg:justify-start ${
              activeTab === 'STUDENTS' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Students SIS"
          >
            <Users size={18} className="shrink-0" />
            <span className="hidden lg:inline">Students SIS</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('TEACHERS')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 lg:px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer justify-center lg:justify-start ${
              activeTab === 'TEACHERS' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Teacher Performance"
          >
            <UserCog size={18} className="shrink-0" />
            <span className="hidden lg:inline">Teacher Performance</span>
          </button>

          <button 
            onClick={() => setActiveTab('NOTICES')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 lg:px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer justify-center lg:justify-start ${
              activeTab === 'NOTICES' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Notice Board"
          >
            <BellRing size={18} className="shrink-0" />
            <span className="hidden lg:inline">Notice Board</span>
          </button>

          <button 
            onClick={() => setActiveTab('REPORTS')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 lg:px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer justify-center lg:justify-start ${
              activeTab === 'REPORTS' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Reports & Exports"
          >
            <FileText size={18} className="shrink-0" />
            <span className="hidden lg:inline">Reports & Exports</span>
          </button>

          <button 
            onClick={() => setActiveTab('AI_INSIGHTS')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 lg:px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer justify-center lg:justify-start ${
              activeTab === 'AI_INSIGHTS' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="AI Risk Predictions"
          >
            <Brain size={18} className="shrink-0" />
            <span className="hidden lg:inline">AI Risk Predictions</span>
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-700">
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
              className="md:hidden p-1.5 rounded-lg text-brand-blue hover:bg-slate-100 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-brand-blue">
                {activeTab.charAt(0) + activeTab.slice(1).toLowerCase().replace(/_/g, ' ')}
              </h2>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                {user.name} • Principal Portal
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="bg-brand-gold/15 text-brand-gold font-bold px-3 py-1 rounded-full text-xs border border-brand-gold/30">
              District: Guntur
            </span>
            <button 
              onClick={onLogout} 
              className="md:hidden p-2 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {/* ========================================================================= */}
          {/* TAB: DASHBOARD OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'DASHBOARD' && (
            <div className="space-y-6">
              
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Total Students</span>
                    <h3 className="text-3xl font-extrabold mt-1">{students.length > 0 ? students.length : 154}</h3>
                    <p className="text-xs text-brand-teal font-semibold mt-1">AP High School, Guntur</p>
                  </div>
                  <div className="bg-brand-blue/10 p-3 rounded-lg text-brand-blue">
                    <Users size={24} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Total Teachers</span>
                    <h3 className="text-3xl font-extrabold mt-1">{teachers.length}</h3>
                    <p className="text-xs text-brand-teal font-semibold mt-1">100% Biometric Registered</p>
                  </div>
                  <div className="bg-brand-blue/10 p-3 rounded-lg text-brand-blue">
                    <UserCog size={24} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Present Students Today</span>
                    <h3 className="text-3xl font-extrabold mt-1">142</h3>
                    <p className="text-xs text-rose-500 font-semibold mt-1">12 Absentees Notified</p>
                  </div>
                  <div className="bg-brand-teal/10 p-3 rounded-lg text-brand-teal">
                    <CheckCircle size={24} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Average Attendance</span>
                    <h3 className="text-3xl font-extrabold mt-1">{avgAttendance}%</h3>
                    <p className="text-xs text-brand-gold font-semibold mt-1">Ranked 5th in Guntur District</p>
                  </div>
                  <div className="bg-brand-gold/10 p-3 rounded-lg text-brand-gold">
                    <Award size={24} />
                  </div>
                </div>
              </div>

              {/* AI Alerts Header */}
              {aiSuggestions.length > 0 && (
                <div className="bg-brand-gold/10 border-l-4 border-brand-gold p-4 rounded-r-xl space-y-2">
                  <div className="flex items-center space-x-2 text-brand-gold font-bold text-sm">
                    <Brain size={18} />
                    <span>AI Copilot Alerts & Insights</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiSuggestions.map((sug) => (
                      <div key={sug.id} className="text-xs bg-white p-3 rounded-lg border border-brand-gold/20 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-800">{sug.message}</p>
                          <p className="text-gray-500 mt-1">💡 Action: {sug.action}</p>
                        </div>
                        <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {sug.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Charts grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                  <h4 className="font-bold text-slate-700 mb-4">Class-Wise Attendance Analytics</h4>
                  <div className="h-64 flex items-end justify-between px-4 pt-4 border-b border-l border-slate-200">
                    {[72, 85, 91, 88, 94, 90, 86].map((rate, idx) => (
                      <div key={idx} className="flex flex-col items-center w-8">
                        <div 
                          style={{ height: `${rate}%` }} 
                          className={`w-full rounded-t-xs transition-all duration-500 ${
                            rate < 75 ? 'bg-rose-500' : rate < 88 ? 'bg-brand-gold' : 'bg-brand-blue'
                          }`}
                        ></div>
                        <span className="text-[10px] font-bold text-slate-500 mt-2">
                          {['8A', '8B', '9A', '9B', '10A', '11M', '12B'][idx]}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-600 mt-0.5">{rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                  <h4 className="font-bold text-slate-700 mb-4">Subject-Wise Performance Averages</h4>
                  <div className="h-64 flex items-end justify-between px-4 pt-4 border-b border-l border-slate-200">
                    {[82, 78, 88, 81, 92].map((rate, idx) => (
                      <div key={idx} className="flex flex-col items-center w-12">
                        <div 
                          style={{ height: `${rate}%` }} 
                          className="w-full bg-brand-gold rounded-t-xs transition-all duration-500"
                        ></div>
                        <span className="text-[10px] font-bold text-slate-500 mt-2">
                          {['Maths', 'Science', 'English', 'Social', 'Telugu'][idx]}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-600 mt-0.5">{rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Audit Logs table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
                <h4 className="font-bold text-slate-700 mb-4">System Actions Log</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Actor / User</th>
                        <th className="px-4 py-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-500 text-xs">{log.timestamp}</td>
                          <td className="px-4 py-3">
                            <span className="bg-brand-blue/10 text-brand-blue font-bold px-2 py-0.5 rounded text-[10px]">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-semibold">{log.username} ({log.userRole})</td>
                          <td className="px-4 py-3 text-slate-600 text-xs">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: STUDENTS SIS */}
          {/* ========================================================================= */}
          {activeTab === 'STUDENTS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Students list */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:col-span-2">
                <h4 className="font-bold text-slate-700 mb-4">Student Registry</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10 w-48 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Name</th>
                        <th className="px-4 py-3">Roll No</th>
                        <th className="px-4 py-3">Aadhaar (Masked)</th>
                        <th className="px-4 py-3">GPA</th>
                        <th className="px-4 py-3">Risk Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{student.name}</td>
                          <td className="px-4 py-3 font-mono font-bold text-brand-blue">{student.rollNumber}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{student.aadhaarMasked}</td>
                          <td className="px-4 py-3 font-bold text-brand-teal">{student.gpa || '7.5'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              student.status === 'RISK_HIGH' ? 'bg-red-100 text-red-800' :
                              student.status === 'RISK_MEDIUM' ? 'bg-amber-100 text-amber-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Certificate generator */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
                <h4 className="font-bold text-slate-700 mb-4">Issue Official Certificates</h4>
                <form onSubmit={handleGenerateCertificate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Student</label>
                    <select 
                      value={certStudentId} 
                      onChange={(e) => setCertStudentId(e.target.value)}
                      required
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                    >
                      <option value="">-- Choose Student --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Certificate Type</label>
                    <select 
                      value={certType} 
                      onChange={(e) => setCertType(e.target.value)}
                      required
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                    >
                      <option value="BONAFIDE">Bonafide Study Certificate</option>
                      <option value="TRANSFER_CERTIFICATE">Transfer Certificate (TC)</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                  >
                    <PlusCircle size={16} />
                    <span>Generate Certificate</span>
                  </button>
                </form>

                {certResult && (
                  <div className="mt-6 p-4 border border-brand-teal bg-teal-50/50 rounded-xl space-y-3 font-sans">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-brand-teal text-white font-bold px-2 py-0.5 rounded">
                        GENERATED
                      </span>
                      <span className="font-mono text-xs font-bold text-brand-blue">{certResult.certNo}</span>
                    </div>
                    <div className="text-xs space-y-1 text-slate-600">
                      <p><b>Name:</b> {certResult.studentName}</p>
                      <p><b>Roll No:</b> {certResult.rollNumber}</p>
                      <p><b>Parent:</b> {certResult.parentName}</p>
                      <p><b>School:</b> {certResult.schoolName}</p>
                    </div>
                    <button 
                      onClick={() => window.print()} 
                      className="w-full bg-white border border-brand-teal text-brand-teal hover:bg-teal-50 text-xs font-bold py-1.5 rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Print Document</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: TEACHER MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === 'TEACHERS' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
                <h4 className="font-bold text-slate-700 mb-4">Teacher Performance Directory</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#E8F5E9] text-[#004D20] uppercase text-xs font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Teacher Name</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-800">{teacher.name}</td>
                          <td className="px-4 py-3">
                            <span className="bg-emerald-100 text-[#006B2D] font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                              {teacher.role.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            Active Faculty
                          </td>
                        </tr>
                      ))}
                      {teachers.length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center py-4 text-slate-500 text-xs">No teachers registered in the system.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: NOTICE BOARD */}
          {/* ========================================================================= */}
          {activeTab === 'NOTICES' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form to create notice */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
                <h4 className="font-bold text-slate-700 mb-4">Publish Announcement</h4>
                {noticeSuccess && (
                  <div className="bg-teal-50 border-l-4 border-brand-teal p-3 text-xs text-teal-800 rounded-r-md mb-4 flex items-center justify-between">
                    <span>✅ Notice Published & Broadcasted Successfully!</span>
                    <button onClick={() => setNoticeSuccess(false)}><X size={14} /></button>
                  </div>
                )}
                <form onSubmit={handlePublishNotice} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notice Title</label>
                    <input 
                      type="text" 
                      required
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      placeholder="e.g. Unit Test 2 Schedule Announcement"
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Content Details</label>
                    <textarea 
                      rows="5"
                      required
                      value={noticeContent}
                      onChange={(e) => setNoticeContent(e.target.value)}
                      placeholder="Type details here..."
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                  >
                    <PlusCircle size={16} />
                    <span>Publish & Broadcast</span>
                  </button>
                </form>
              </div>

              {/* Published notices */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:col-span-2 space-y-4">
                <h4 className="font-bold text-slate-700 mb-2">Notice Feed History</h4>
                <div className="space-y-4">
                  {notices.map((notice) => (
                    <div key={notice.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-brand-blue text-sm">{notice.title}</span>
                        <span className="text-[10px] text-gray-500">{new Date(notice.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{notice.content}</p>
                    </div>
                  ))}
                  {notices.length === 0 && (
                    <p className="text-center text-slate-500 text-xs py-8">No notices published yet.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: REPORTS & EXPORTS */}
          {/* ========================================================================= */}
          {activeTab === 'REPORTS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-2xl mx-auto">
              <h4 className="font-bold text-slate-700 mb-6">Government Audit Reports Downloader</h4>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Report Type</label>
                  <select 
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                  >
                    <option value="daily-attendance">Daily Attendance Report</option>
                    <option value="monthly-attendance">Monthly Attendance Report</option>
                    <option value="student-performance">Student Academic Performance</option>
                    <option value="teacher-workload">Teacher Workload Report</option>
                  </select>
                </div>

                {(reportType === 'daily-attendance' || reportType === 'monthly-attendance' || reportType === 'student-performance') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Class</label>
                    <select 
                      value={reportClass}
                      onChange={(e) => setReportClass(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                    >
                      {classList.map(c => (
                        <option key={c.id} value={c.id}>{c.grade}</option>
                      ))}
                    </select>
                  </div>
                )}

                {reportType === 'daily-attendance' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Date</label>
                    <input 
                      type="date" 
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Format</label>
                  <div className="flex space-x-6 mt-1">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-600">
                      <input 
                        type="radio" 
                        name="format" 
                        value="pdf"
                        checked={reportFormat === 'pdf'}
                        onChange={() => setReportFormat('pdf')}
                        className="text-brand-blue focus:ring-brand-blue"
                      />
                      <span>PDF Document (.pdf)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-600">
                      <input 
                        type="radio" 
                        name="format" 
                        value="excel"
                        checked={reportFormat === 'excel'}
                        onChange={() => setReportFormat('excel')}
                        className="text-brand-blue focus:ring-brand-blue"
                      />
                      <span>Excel Spreadsheet (.xlsx)</span>
                    </label>
                  </div>
                </div>

                <button 
                  onClick={handleDownloadReport}
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-bold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 cursor-pointer shadow-md mt-6"
                >
                  <Download size={18} />
                  <span>Download Report File</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: AI RISK PREDICTIONS */}
          {/* ========================================================================= */}
          {activeTab === 'AI_INSIGHTS' && (
            <div className="space-y-6">
              
              <div className="bg-brand-blue text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-center">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold flex items-center space-x-2">
                    <Brain />
                    <span>Predictive Dropout & Failure Risk Modeler</span>
                  </h3>
                  <p className="text-xs text-slate-200 max-w-xl">
                    AP Dept. of School Education Heuristic AI evaluation modeler parses class records against threshold values to target student drop-out preventions.
                  </p>
                </div>
                <span className="bg-white/20 border border-white/30 text-white font-bold px-3 py-1 rounded-full text-xs mt-4 md:mt-0">
                  Model: Heuristic AI Engine v1.0
                </span>
              </div>

              {/* Predictions tables */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
                <h4 className="font-bold text-slate-700 mb-4">Student Risk Classification List</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-bold">
                      <tr>
                        <th className="px-4 py-3">Roll No</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Class</th>
                        <th className="px-4 py-3">Attendance</th>
                        <th className="px-4 py-3">Risk Score</th>
                        <th className="px-4 py-3">Classification</th>
                        <th className="px-4 py-3">Risk Factors</th>
                        <th className="px-4 py-3">Recommended Interventions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {aiPredictions.map((pred) => (
                        <tr key={pred.studentId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-brand-blue">{pred.rollNumber}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{pred.name}</td>
                          <td className="px-4 py-3 text-slate-600">{pred.className}</td>
                          <td className="px-4 py-3 font-bold">{pred.attendanceRate}</td>
                          <td className="px-4 py-3 font-mono text-center font-bold text-brand-gold">{pred.riskScore}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                              pred.dropoutRisk === 'HIGH' ? 'bg-red-100 text-red-800 border border-red-200' :
                              pred.dropoutRisk === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-green-100 text-green-800 border border-green-200'
                            }`}>
                              {pred.dropoutRisk} RISK
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-rose-600 font-semibold max-w-xs">
                            {pred.reasons.length > 0 ? (
                              <ul className="list-disc pl-4 space-y-0.5">
                                {pred.reasons.map((r, i) => <li key={i}>{r}</li>)}
                              </ul>
                            ) : "No risk factors identified."}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-700 max-w-xs">
                            <ul className="list-disc pl-4 space-y-0.5">
                              {pred.recommendations.map((rec, i) => <li key={i} className="font-medium">{rec}</li>)}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
          <div className="relative flex flex-col w-64 max-w-xs bg-brand-dark text-white p-6 shadow-2xl animate-slide-in">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-350 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="flex items-center space-x-3 mb-8">
              <img className="h-10 w-auto" src={apLogo} alt="Emblem" />
              <div>
                <h1 className="font-extrabold text-sm tracking-wider">AP PRINCIPAL</h1>
                <span className="text-xs text-[#D4AF37] font-semibold uppercase">{user.role}</span>
              </div>
            </div>
            <nav className="flex-1 space-y-2">
              <button 
                onClick={() => { setActiveTab('DASHBOARD'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'DASHBOARD' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
              <button 
                onClick={() => { setActiveTab('STUDENTS'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'STUDENTS' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Users size={18} />
                <span>Students SIS</span>
              </button>
              <button 
                onClick={() => { setActiveTab('TEACHERS'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'TEACHERS' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <UserCog size={18} />
                <span>Teacher Performance</span>
              </button>
              <button 
                onClick={() => { setActiveTab('NOTICES'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'NOTICES' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <BellRing size={18} />
                <span>Notice Board</span>
              </button>
              <button 
                onClick={() => { setActiveTab('REPORTS'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'REPORTS' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileText size={18} />
                <span>Reports & Exports</span>
              </button>
              <button 
                onClick={() => { setActiveTab('AI_INSIGHTS'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'AI_INSIGHTS' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Brain size={18} />
                <span>AI Risk Predictions</span>
              </button>
            </nav>
            <div className="pt-6 border-t border-slate-700">
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
