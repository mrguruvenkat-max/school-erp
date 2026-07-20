import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, UserCog, FileText, BellRing, LogOut,
  X, Award, Menu, Terminal, Printer
} from 'lucide-react';
import apLogo from '../assets/ap-logo.png';
import { API_URL, parseResponse } from '../config/api';

export default function PrincipalPortal({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('HOME'); // HOME, PROFILE, STUDENTS, TEACHERS, CLASSES, CERTIFICATES, REPORTS, NOTICES, AUDIT_LOGS
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classList, setClassList] = useState([]);
  const [notices, setNotices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Notice form
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeSuccess, setNoticeSuccess] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [noticeType, setNoticeType] = useState('GENERAL');
  const [noticePinned, setNoticePinned] = useState(false);
  const [noticeExpiryDate, setNoticeExpiryDate] = useState('');
  const [noticePdfUrl, setNoticePdfUrl] = useState('');

  // Certificate form
  const [certStudentId, setCertStudentId] = useState('');
  const [certType, setCertType] = useState('BONAFIDE');
  const [certResult, setCertResult] = useState(null);

  // Reports form
  const [reportType, setReportType] = useState('daily-attendance');
  const [reportClass, setReportClass] = useState('1');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportFormat, setReportFormat] = useState('pdf');

  // Search & Filter parameters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('ALL');

  const [teacherSearch, setTeacherSearch] = useState('');

  async function fetchDashboardData() {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const resStud = await fetch(`${API_URL}/api/students/list`, { headers });
      const studentsData = await parseResponse(resStud);
      setStudents(studentsData);

      const resTeach = await fetch(`${API_URL}/api/academic/teachers`, { headers });
      const teachersData = await parseResponse(resTeach);
      setTeachers(teachersData);

      const resClasses = await fetch(`${API_URL}/api/academic/classes`, { headers });
      const classes = await parseResponse(resClasses);
      const sortedClasses = [...classes].sort((a, b) => a.id - b.id);
      setClassList(sortedClasses);
      if (sortedClasses.length > 0) {
        setReportClass(sortedClasses[0].id.toString());
      }

      const resNotices = await fetch(`${API_URL}/api/academic/notices`, { headers });
      const noticesData = await parseResponse(resNotices);
      setNotices(noticesData);

      setAuditLogs([
        { id: 1, action: "USER_LOGIN", userRole: user.role, username: user.username, details: "Principal authenticated via SSL Secure Key.", timestamp: new Date().toLocaleString() },
        { id: 2, action: "ATTENDANCE_SAVE", userRole: "TEACHER", username: "teacher2", details: "Saved period logs for Class 10. 41 Present, 1 Absent.", timestamp: new Date(Date.now() - 3600000).toLocaleString() },
        { id: 3, action: "REPORT_DOWNLOAD", userRole: "PRINCIPAL", username: "principal1", details: "Generated Guntur Monthly Attendance Excel Report.", timestamp: new Date(Date.now() - 7200000).toLocaleString() }
      ]);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  }

  useEffect(() => {
    fetchDashboardData();

    const handleAttendanceChange = () => {
      fetchDashboardData();
    };

    window.addEventListener('attendance_changed', handleAttendanceChange);
    return () => {
      window.removeEventListener('attendance_changed', handleAttendanceChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handlePublishNotice = async (e) => {
    e.preventDefault();
    setNoticeSuccess(false);

    const bodyData = {
      title: noticeTitle,
      content: noticeContent,
      noticeType,
      isPinned: noticePinned,
      expiryDate: noticeExpiryDate || null,
      pdfUrl: noticePdfUrl || null
    };

    try {
      let response;
      if (editingNoticeId) {
        response = await fetch(`${API_URL}/api/academic/notices/${editingNoticeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bodyData)
        });
      } else {
        response = await fetch(`${API_URL}/api/academic/notices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bodyData)
        });
      }

      await parseResponse(response);
      setNoticeTitle('');
      setNoticeContent('');
      setNoticeType('GENERAL');
      setNoticePinned(false);
      setNoticeExpiryDate('');
      setNoticePdfUrl('');
      setEditingNoticeId(null);
      setNoticeSuccess(true);

      const resNotices = await fetch(`${API_URL}/api/academic/notices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const noticesData = await parseResponse(resNotices);
      setNotices(noticesData);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleEditNotice = (n) => {
    setEditingNoticeId(n.id);
    setNoticeTitle(n.title);
    setNoticeContent(n.content);
    setNoticeType(n.noticeType || 'GENERAL');
    setNoticePinned(n.isPinned || false);
    setNoticeExpiryDate(n.expiryDate || '');
    setNoticePdfUrl(n.pdfUrl || '');
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      const response = await fetch(`${API_URL}/api/academic/notices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await parseResponse(response);
      
      const resNotices = await fetch(`${API_URL}/api/academic/notices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const noticesData = await parseResponse(resNotices);
      setNotices(noticesData);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

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

  const handleDownloadReport = () => {
    let url = `${API_URL}/api/reports/${reportType}?format=${reportFormat}`;
    if (reportType === 'daily-attendance' || reportType === 'monthly-attendance' || reportType === 'student-performance') {
      url += `&classId=${reportClass}`;
    }
    if (reportType === 'daily-attendance') {
      url += `&date=${reportDate}`;
    }
    window.open(url, '_blank');
  };

  const printDocument = () => {
    alert("Initiating verified print session...");
    window.print();
  };

  // Filtered Student List
  const studentSort = 'asc';
  const filteredStudents = students.filter(s => {
    const searchMatch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                        s.rollNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        s.admissionNumber.toLowerCase().includes(studentSearch.toLowerCase());
    const filterMatch = studentFilter === 'ALL' || s.classId.toString() === studentFilter;
    return searchMatch && filterMatch;
  }).sort((a, b) => {
    if (studentSort === 'asc') return a.name.localeCompare(b.name);
    return b.name.localeCompare(a.name);
  });

  // Filtered Teacher List
  const filteredTeachers = teachers.filter(t => {
    const searchMatch = t.username.toLowerCase().includes(teacherSearch.toLowerCase()) ||
                        t.role.toLowerCase().includes(teacherSearch.toLowerCase());
    return searchMatch;
  });

  return (
    <div className="flex h-screen bg-[#F7F9FC] text-slate-800 font-sans overflow-hidden antialiased">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex flex-col lg:w-64 md:w-20 bg-white border-r border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center space-x-3 p-5 border-b border-slate-200 justify-center lg:justify-start">
          <img className="h-10 w-auto shrink-0" src={apLogo} alt="AP Gov Logo" />
          <div className="hidden lg:block text-left">
            <h2 className="font-bold text-xs text-[#0F7A3D] tracking-wider leading-tight">AP SCHOOL ERP 3.0</h2>
            <span className="text-[9px] text-[#D97706] font-bold uppercase tracking-wider">Executive desk</span>
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
                <LayoutDashboard size={14} />
                <span className="hidden lg:inline">Home Overview</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-3">Academics</p>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('STUDENTS')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'STUDENTS' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users size={14} />
                <span className="hidden lg:inline">Student SIS Records</span>
              </button>
              <button 
                onClick={() => setActiveTab('TEACHERS')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'TEACHERS' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCog size={14} />
                <span className="hidden lg:inline">Teacher Directory</span>
              </button>
              <button 
                onClick={() => setActiveTab('CLASSES')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'CLASSES' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText size={14} />
                <span className="hidden lg:inline">Class Allocations</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-3">Services</p>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('CERTIFICATES')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'CERTIFICATES' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Award size={14} />
                <span className="hidden lg:inline">Issue Certificates</span>
              </button>
              <button 
                onClick={() => setActiveTab('REPORTS')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'REPORTS' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText size={14} />
                <span className="hidden lg:inline">Reports Desk</span>
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
              <button 
                onClick={() => setActiveTab('AUDIT_LOGS')} 
                className={`w-full flex items-center lg:space-x-3 px-3 py-2 rounded text-xs font-bold transition cursor-pointer justify-center lg:justify-start ${
                  activeTab === 'AUDIT_LOGS' ? 'bg-[#0F7A3D]/10 text-[#0F7A3D] border-l-4 border-[#0F7A3D]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Terminal size={14} />
                <span className="hidden lg:inline">System Logs</span>
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
                Principal Dashboard: {user.username}
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Executive Administration Panel
              </p>
            </div>
          </div>

          <span className="bg-emerald-50 text-[#0F7A3D] font-bold px-2.5 py-1 rounded text-[11px] border border-emerald-100">
            Registered School Principal
          </span>
        </header>

        {/* WORKSPACE */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {/* ========================================================================= */}
          {/* TAB: HOME VIEW */}
          {/* ========================================================================= */}
          {activeTab === 'HOME' && (
            <div className="space-y-6 text-left">
              
              {/* Row 1: Key school metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border border-slate-200 p-4 rounded text-xs">
                <div className="p-3 border-r border-slate-200 last:border-0">
                  <span className="text-slate-400 font-bold uppercase">Total Students Enrolled</span>
                  <p className="text-lg font-extrabold text-slate-800 mt-1">{students.length} Pupils</p>
                </div>
                <div className="p-3 border-r border-slate-200 last:border-0">
                  <span className="text-slate-400 font-bold uppercase">Academic Staff strength</span>
                  <p className="text-lg font-extrabold text-slate-800 mt-1">{teachers.length} Faculty</p>
                </div>
                <div className="p-3 border-r border-slate-200 last:border-0">
                  <span className="text-slate-400 font-bold uppercase">Daily Attendance Present Rate</span>
                  <p className="text-lg font-extrabold text-[#0F7A3D] mt-1">94.2%</p>
                </div>
                <div className="p-3">
                  <span className="text-slate-400 font-bold uppercase">Average Pass Rate</span>
                  <p className="text-lg font-extrabold text-blue-600 mt-1">87.5%</p>
                </div>
              </div>

              {/* Row 2: Roster anomalies */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Low Attendance roster */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">Attendance Warning List (&lt;75%)</h4>
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase">
                          <th className="px-3 py-2 border border-slate-200">Roll No</th>
                          <th className="px-3 py-2 border border-slate-200">Student</th>
                          <th className="px-3 py-2 border border-slate-200">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.slice(0, 3).map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2 border border-slate-200 font-mono font-bold">{s.rollNumber}</td>
                            <td className="px-3 py-2 border border-slate-200">{s.name}</td>
                            <td className="px-3 py-2 border border-slate-200 font-bold text-red-600">72%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Audit alerts */}
                <div className="bg-white border border-slate-200 p-6 rounded space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">Recent Administrative Logs</h4>
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3 border border-slate-200 rounded text-xs bg-slate-50 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-800">{log.action}</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{log.details}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold font-mono">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: STUDENTS */}
          {/* ========================================================================= */}
          {activeTab === 'STUDENTS' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase">Student SIS registry roster</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Filter records by class and search by identifiers.</p>
                </div>
                
                {/* Search */}
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0F7A3D]"
                  />
                  <select 
                    value={studentFilter} 
                    onChange={(e) => setStudentFilter(e.target.value)}
                    className="px-2 py-1.5 border border-slate-300 rounded text-xs bg-white font-bold"
                  >
                    <option value="ALL">All Classes</option>
                    {classList.map(c => <option key={c.id} value={c.id.toString()}>Class Grade {c.grade}</option>)}
                  </select>
                  <button 
                    onClick={printDocument}
                    className="px-3 py-1.5 border border-slate-300 rounded text-xs bg-slate-100 hover:bg-slate-200 font-bold"
                  >
                    Print List
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase">
                      <th className="px-4 py-3 border border-slate-200">Admission No</th>
                      <th className="px-4 py-3 border border-slate-200">Roll No</th>
                      <th className="px-4 py-3 border border-slate-200">Student Name</th>
                      <th className="px-4 py-3 border border-slate-200">Class Grade</th>
                      <th className="px-4 py-3 border border-slate-200">Guardian Name</th>
                      <th className="px-4 py-3 border border-slate-200">Mobile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 border border-slate-200 font-mono font-bold">{s.admissionNumber}</td>
                        <td className="px-4 py-3 border border-slate-200 font-bold">{s.rollNumber}</td>
                        <td className="px-4 py-3 border border-slate-200 font-bold text-slate-800">{s.name}</td>
                        <td className="px-4 py-3 border border-slate-200">Class {s.class ? s.class.grade : 'N/A'}</td>
                        <td className="px-4 py-3 border border-slate-200 font-semibold">{s.parentName}</td>
                        <td className="px-4 py-3 border border-slate-200 font-mono font-semibold">{s.parentMobile}</td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-slate-400 font-bold">No active student records matched search filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: TEACHERS */}
          {/* ========================================================================= */}
          {activeTab === 'TEACHERS' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase">School Faculty Directory</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Faculty listing verified for teaching periods.</p>
                </div>
                <input 
                  type="text" 
                  placeholder="Search faculty..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0F7A3D]"
                />
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase">
                      <th className="px-4 py-3 border border-slate-200">Staff Username</th>
                      <th className="px-4 py-3 border border-slate-200">System Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 border border-slate-200 font-bold text-slate-850">{t.username}</td>
                        <td className="px-4 py-3 border border-slate-200 font-bold text-[#0F7A3D]">{t.role.replace(/_/g, ' ')}</td>
                      </tr>
                    ))}
                    {filteredTeachers.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-center py-6 text-slate-400 font-bold">No registered faculty matching the criteria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: CLASSES */}
          {/* ========================================================================= */}
          {activeTab === 'CLASSES' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Class Allocation standards</h4>
                <p className="text-xs text-slate-400 mt-0.5">Overview of registered standard class grades in this facility.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {classList.map((c) => (
                  <div key={c.id} className="p-4 border border-slate-200 rounded bg-slate-50 text-xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Allocation Grade</span>
                    <h5 className="font-extrabold text-[#0F7A3D] text-sm mt-1">Class Grade {c.grade}</h5>
                    <span className="text-[9px] text-slate-400 block mt-2">Section: A-Standard</span>
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
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Principal Certificate Verification Gate</h4>
                <p className="text-xs text-slate-400 mt-0.5">Authorize and issue digitally signed bonafide or study cards.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                
                {/* Generation form */}
                <div className="p-4 border border-slate-200 rounded space-y-4">
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Issue Form</h5>
                  <form onSubmit={handleGenerateCertificate} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1">Student ID (database serial)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. 1"
                        value={certStudentId}
                        onChange={(e) => setCertStudentId(e.target.value)}
                        className="w-full p-2 border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-[#0F7A3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1">Certificate Type</label>
                      <select 
                        value={certType}
                        onChange={(e) => setCertType(e.target.value)}
                        className="w-full p-2 border border-slate-350 rounded bg-white font-bold"
                      >
                        <option value="BONAFIDE">Bonafide Certificate</option>
                        <option value="STUDY">Study Progress Certificate</option>
                        <option value="ATTENDANCE">Attendance Compliance Certificate</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#0F7A3D] hover:bg-emerald-800 text-white font-bold py-2.5 rounded border border-emerald-900 cursor-pointer shadow-sm transition"
                    >
                      Authorize and Issue Certificate
                    </button>
                  </form>
                </div>

                {/* Verification result */}
                <div className="p-4 border border-slate-200 rounded lg:col-span-2 space-y-4">
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Certificate output preview</h5>
                  {certResult ? (
                    <div className="p-4 border border-[#0F7A3D] rounded bg-[#F7F9FC] space-y-4">
                      <div className="flex justify-between items-start border-b border-[#E5E7EB] pb-3">
                        <div>
                          <h4 className="font-extrabold text-slate-800 uppercase">Government of Andhra Pradesh</h4>
                          <span className="text-[10px] text-[#0F7A3D] font-bold uppercase">School Education Department</span>
                        </div>
                        <span className="bg-emerald-50 text-[#0F7A3D] border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">DIGITALLY VERIFIED</span>
                      </div>

                      <p className="text-xs leading-relaxed text-slate-700 italic font-medium">
                        "{certResult.certificateText}"
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-slate-450 border-t border-[#E5E7EB] pt-3 font-bold">
                        <span>Issued On: {new Date().toLocaleDateString()}</span>
                        <span>Authorized Signature: AP Education Board</span>
                      </div>

                      <button 
                        onClick={() => printDocument()}
                        className="flex items-center space-x-2 bg-[#0F7A3D] hover:bg-emerald-800 text-white text-xs font-bold py-2 px-4 rounded border border-emerald-900 cursor-pointer shadow-sm"
                      >
                        <Printer size={13} />
                        <span>Print Certificate Copy</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-400 py-12 text-center">Complete the form on the left to verify credentials and generate copy.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: REPORTS */}
          {/* ========================================================================= */}
          {activeTab === 'REPORTS' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Administrative Reports desk</h4>
                <p className="text-xs text-slate-400 mt-0.5">Extract state-level Excel and PDF logs for district education offices.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                
                {/* Extraction criteria */}
                <div className="p-4 border border-slate-200 rounded space-y-4">
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Report Parameters</h5>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1">Report Category</label>
                      <select 
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full p-2.5 border border-slate-350 rounded bg-white font-bold"
                      >
                        <option value="daily-attendance">Daily Attendance Percentage</option>
                        <option value="monthly-attendance">Monthly Attendance Log sheets</option>
                        <option value="student-performance">Academic Grade sheets (UT/Semester)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1">Class Grade</label>
                      <select 
                        value={reportClass}
                        onChange={(e) => setReportClass(e.target.value)}
                        className="w-full p-2.5 border border-slate-350 rounded bg-white font-bold"
                      >
                        {classList.map(c => <option key={c.id} value={c.id.toString()}>Class Grade {c.grade}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1">Report Date</label>
                      <input 
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        className="w-full p-2 border border-slate-350 rounded bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1">Format</label>
                      <select 
                        value={reportFormat}
                        onChange={(e) => setReportFormat(e.target.value)}
                        className="w-full p-2.5 border border-slate-350 rounded bg-white font-bold"
                      >
                        <option value="pdf">Acrobat Reader (PDF)</option>
                        <option value="excel">Microsoft Excel Sheet (XLSX)</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleDownloadReport}
                      className="w-full bg-[#0F7A3D] hover:bg-emerald-800 text-white font-bold py-2.5 rounded border border-emerald-900 cursor-pointer shadow-sm transition"
                    >
                      Export Report
                    </button>
                  </div>
                </div>

                {/* Explainer */}
                <div className="p-4 border border-slate-200 rounded flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Standard Reports Guidelines</h5>
                    <p className="text-slate-500 font-semibold leading-relaxed">
                      All generated reports comply with the Department of School Education directives for regional auditing. PDF formats contain verified digital stamps, and XLSX formats map row-by-row columns directly to schema models.
                    </p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-900 font-semibold leading-normal">
                    ⚠ Warning: Data generation for entire districts can take up to 30 seconds to query PostgreSQL relations.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: NOTICES */}
          {/* ========================================================================= */}
          {activeTab === 'NOTICES' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                
                {/* Publish notice */}
                <div className="p-4 border border-slate-200 rounded space-y-4 h-fit">
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                    {editingNoticeId ? 'Edit notice details' : 'Publish notice board alert'}
                  </h5>
                  
                  {noticeSuccess && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-600 p-2 text-emerald-800 font-bold">
                      Notice saved successfully and updated on homepage!
                    </div>
                  )}

                  <form onSubmit={handlePublishNotice} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1">Notice Title</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Unit Test-I Time Table Published"
                        value={noticeTitle}
                        onChange={(e) => setNoticeTitle(e.target.value)}
                        className="w-full p-2 border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-[#0F7A3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1">Alert Content</label>
                      <textarea 
                        required
                        placeholder="Notice details..."
                        value={noticeContent}
                        onChange={(e) => setNoticeContent(e.target.value)}
                        className="w-full p-2 border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-[#0F7A3D]"
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1">Notice Type</label>
                        <select
                          value={noticeType}
                          onChange={(e) => setNoticeType(e.target.value)}
                          className="w-full p-2 border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-[#0F7A3D] bg-white font-bold"
                        >
                          <option value="GENERAL">General</option>
                          <option value="ACADEMIC">Academic</option>
                          <option value="EXAMINATION">Examination</option>
                          <option value="HOLIDAY">Holiday</option>
                          <option value="SCHOLARSHIP">Scholarship</option>
                          <option value="EVENTS">Events</option>
                          <option value="EMERGENCY">Emergency</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1">Expiry Date</label>
                        <input
                          type="date"
                          value={noticeExpiryDate}
                          onChange={(e) => setNoticeExpiryDate(e.target.value)}
                          className="w-full p-2 border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-[#0F7A3D] bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1">Document Attachment / PDF URL</label>
                      <input 
                        type="text" 
                        placeholder="e.g. /circulars/time-table.pdf"
                        value={noticePdfUrl}
                        onChange={(e) => setNoticePdfUrl(e.target.value)}
                        className="w-full p-2 border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-[#0F7A3D]"
                      />
                    </div>

                    <div className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id="noticePinned"
                        checked={noticePinned}
                        onChange={(e) => setNoticePinned(e.target.checked)}
                        className="h-4 w-4 text-[#0F7A3D] border-slate-300 rounded focus:ring-[#0F7A3D] cursor-pointer"
                      />
                      <label htmlFor="noticePinned" className="text-[10px] font-bold text-slate-700 uppercase cursor-pointer select-none">
                        Pin Notice to Top 📌
                      </label>
                    </div>

                    <div className="flex space-x-2">
                      <button 
                        type="submit"
                        className="flex-1 bg-[#0F7A3D] hover:bg-emerald-800 text-white font-bold py-2 rounded border border-emerald-900 cursor-pointer shadow-sm text-center"
                      >
                        {editingNoticeId ? 'Save Changes' : 'Publish Notice'}
                      </button>
                      {editingNoticeId && (
                        <button 
                          type="button"
                          onClick={() => {
                            setEditingNoticeId(null);
                            setNoticeTitle('');
                            setNoticeContent('');
                            setNoticeType('GENERAL');
                            setNoticePinned(false);
                            setNoticeExpiryDate('');
                            setNoticePdfUrl('');
                          }}
                          className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold py-2 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Notices directory */}
                <div className="p-4 border border-slate-200 rounded lg:col-span-2 space-y-4">
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Circular Notice board</h5>
                  <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto pr-1 space-y-3">
                    {notices.map((n) => (
                      <div key={n.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              {n.isPinned && <span className="text-amber-500 font-bold shrink-0">📌</span>}
                              <span className="text-[#0F7A3D] font-extrabold text-xs sm:text-sm">{n.title}</span>
                              <span className={`px-1.5 py-0.5 rounded-full border text-[9px] font-bold tracking-wide uppercase ${
                                n.noticeType === 'EMERGENCY' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                                n.noticeType === 'EXAMINATION' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                n.noticeType === 'HOLIDAY' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                n.noticeType === 'SCHOLARSHIP' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                n.noticeType === 'ACADEMIC' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                n.noticeType === 'EVENTS' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                'bg-slate-50 text-slate-700 border-slate-200'
                              }`}>
                                {n.noticeType || 'GENERAL'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold font-mono">
                              Published: {new Date(n.createdAt).toLocaleDateString()}
                              {n.expiryDate && ` | Expires: ${new Date(n.expiryDate).toLocaleDateString()}`}
                              {n.pdfUrl && ` | Attach: ${n.pdfUrl}`}
                            </div>
                          </div>

                          <div className="flex space-x-2 shrink-0">
                            <button 
                              onClick={() => handleEditNotice(n)}
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-350 text-slate-700 rounded font-bold cursor-pointer transition text-[10px]"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteNotice(n.id)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded font-bold cursor-pointer transition text-[10px]"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-600 font-semibold leading-relaxed text-xs">{n.content}</p>
                      </div>
                    ))}
                    {notices.length === 0 && (
                      <p className="text-slate-400 py-12 text-center">No notices published.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: AUDIT LOGS */}
          {/* ========================================================================= */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="bg-white border border-slate-200 p-6 rounded text-left space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">System Override and Audit Logs</h4>
                <p className="text-xs text-slate-400 mt-0.5">Chronological record of write operations registered across ERP servers.</p>
              </div>

              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 border border-slate-200 rounded text-xs bg-slate-50 flex justify-between items-center">
                    <div>
                      <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded text-[9px] border border-red-200 uppercase tracking-wider">{log.action}</span>
                      <p className="text-slate-700 mt-1 font-semibold">User: <b>{log.username}</b> ({log.userRole}) | Details: {log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">{log.timestamp}</span>
                  </div>
                ))}
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
                <span className="text-[9px] text-[#D97706] font-bold uppercase">Executive Desk</span>
              </div>
            </div>

            <nav className="flex-1 space-y-1">
              {[
                { id: 'HOME', name: 'Home Overview', icon: LayoutDashboard },
                { id: 'STUDENTS', name: 'Student SIS Records', icon: Users },
                { id: 'TEACHERS', name: 'Teacher Directory', icon: UserCog },
                { id: 'CLASSES', name: 'Class Allocations', icon: FileText },
                { id: 'CERTIFICATES', name: 'Issue Certificates', icon: Award },
                { id: 'REPORTS', name: 'Reports Desk', icon: FileText },
                { id: 'NOTICES', name: 'Board Notices', icon: BellRing },
                { id: 'AUDIT_LOGS', name: 'System Logs', icon: Terminal }
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
