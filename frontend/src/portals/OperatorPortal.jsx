import React, { useState, useEffect } from 'react';
import { 
  Users, PlusCircle, Edit, Trash2, Calendar, FileText, Award, LogOut, Check, X, ClipboardList, Key, CheckSquare, Upload, Download
} from 'lucide-react';
import apLogo from '../assets/ap-logo.png';
import { API_URL, parseResponse } from '../config/api';

export default function OperatorPortal({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('STUDENTS'); 
  const [students, setStudents] = useState([]);
  const [classList, setClassList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Student Modals
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    id: '', rollNumber: '', name: '', classId: '1', dob: '', gender: 'MALE', parentName: '',
    parentMobile: '', address: '', admissionNumber: ''
  });

  // Parent updates state
  const [lookupRoll, setLookupRoll] = useState('');
  const [foundStudent, setFoundStudent] = useState(null);
  const [parentNameInput, setParentNameInput] = useState('');
  const [parentMobileInput, setParentMobileInput] = useState('');
  const [parentUpdateSuccess, setParentUpdateSuccess] = useState(false);

  // Attendance Correction state
  const [corrRoll, setCorrRoll] = useState('');
  const [corrStudent, setCorrStudent] = useState(null);
  const [corrDate, setCorrDate] = useState(new Date().toISOString().split('T')[0]);
  const [corrPeriod, setCorrPeriod] = useState('1');
  const [corrStatus, setCorrStatus] = useState('PRESENT');
  const [corrSuccess, setCorrSuccess] = useState(false);
  const [corrError, setCorrError] = useState('');

  // Bulk CSV state
  const [csvFile, setCsvFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // Marks upload states
  const [marksStudentId, setMarksStudentId] = useState('');
  const [marksSubjectId, setMarksSubjectId] = useState('1');
  const [marksExamType, setMarksExamType] = useState('UNIT_TEST_1');
  const [marksObtained, setMarksObtained] = useState('');
  const [marksMax, setMarksMax] = useState('100');
  const [marksSuccess, setMarksSuccess] = useState(false);

  // Timetable update states
  const [timeClassId, setTimeClassId] = useState('1');
  const [timeDay, setTimeDay] = useState('MONDAY');
  const [timePeriod, setTimePeriod] = useState('1');
  const [timeSubjectId, setTimeSubjectId] = useState('1');
  const [timeTeacherId, setTimeTeacherId] = useState('1');
  const [timetableSuccess, setTimetableSuccess] = useState(false);

  // Certificate states
  const [certStudentId, setCertStudentId] = useState('');
  const [certType, setCertType] = useState('BONAFIDE');
  const [certResult, setCertResult] = useState(null);

  // Teachers mock list for timetable
  const teachers = [
    { id: 1, name: "K. Ranga Rao", role: "SUBJECT_TEACHER" },
    { id: 2, name: "Smt. P. Lakshmi", role: "CLASS_TEACHER" },
    { id: 3, name: "Ch. Ram Babu", role: "LAB_TEACHER" }
  ];

  useEffect(() => {
    fetchMetadata();
    fetchStudents();
  }, [token]);

  const fetchMetadata = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const resClasses = await fetch(`${API_URL}/api/academic/classes`, { headers });
      const classes = await parseResponse(resClasses);
      setClassList(classes);

      const resSubs = await fetch(`${API_URL}/api/academic/subjects`, { headers });
      const subs = await parseResponse(resSubs);
      setSubjects(subs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const res = await fetch(
        `${API_URL}/api/students/list`,
        { headers }
      );
      const data = await parseResponse(res);
      setStudents(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Student Admissions / Record Submits
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    const endpoint = editingStudent ? `${API_URL}/api/students/update` : `${API_URL}/api/students/create`;
    const body = editingStudent ? { id: editingStudent.id, ...studentForm } : studentForm;
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await parseResponse(res);
      setShowStudentModal(false);
      setStudentForm({
        id: '', rollNumber: '', name: '', classId: '1', dob: '', gender: 'MALE', parentName: '',
        parentMobile: '', address: '', admissionNumber: ''
      });
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert(err.message || "Operation failed");
    }
  };

  // Delete Student Profile
  const handleDeleteStudent = async (id) => {
    if (!confirm("Are you sure you want to delete this student profile?")) return;
    try {
      const res = await fetch(`${API_URL}/api/students/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await parseResponse(res);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete student");
    }
  };

  // Quick lookup of student for parent update
  const handleLookupStudent = () => {
    setParentUpdateSuccess(false);
    const found = students.find(s => s.rollNumber.toLowerCase() === lookupRoll.toLowerCase().trim());
    if (found) {
      setFoundStudent(found);
      setParentNameInput(found.parentName);
      setParentMobileInput(found.parentMobile);
    } else {
      setFoundStudent(null);
      alert("Student roll number not found in registry.");
    }
  };

  // Update Parent Info
  const handleParentUpdate = async (e) => {
    e.preventDefault();
    if (!foundStudent) return;
    setParentUpdateSuccess(false);

    try {
      const res = await fetch(`${API_URL}/api/students/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...foundStudent,
          parentName: parentNameInput,
          parentMobile: parentMobileInput
        })
      });
      await parseResponse(res);
      setParentUpdateSuccess(true);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update parent info.");
    }
  };

  // Look up student for attendance correction
  const handleLookupCorrStudent = () => {
    setCorrError('');
    setCorrSuccess(false);
    const found = students.find(s => s.rollNumber.toLowerCase() === corrRoll.toLowerCase().trim());
    if (found) {
      setCorrStudent(found);
    } else {
      setCorrStudent(null);
      setCorrError("Student roll number not found in registry.");
    }
  };

  // Submit attendance correction
  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!corrStudent) return;
    setCorrSuccess(false);
    setCorrError('');

    try {
      const res = await fetch(`${API_URL}/api/attendance/correct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: corrStudent.id,
          date: corrDate,
          period: parseInt(corrPeriod),
          status: corrStatus
        })
      });

      await parseResponse(res);
      setCorrSuccess(true);
      fetchStudents();
    } catch (err) {
      console.error(err);
      setCorrError(err.message || "Failed to submit attendance correction.");
    }
  };

  // Export students to CSV
  const handleExportStudentsCSV = () => {
    if (students.length === 0) {
      alert("No students to export.");
      return;
    }
    const headers = ["Admission Number", "Roll Number", "Name", "Class ID", "Date of Birth", "Gender", "Parent Name", "Parent Mobile", "Address"];
    const rows = students.map(s => [
      s.admissionNumber,
      s.rollNumber,
      s.name,
      s.classId,
      s.dob,
      s.gender,
      s.parentName,
      s.parentMobile,
      s.address
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `students_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import students from CSV
  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert("Please select a CSV file first.");
      return;
    }

    setImportLoading(true);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/);
      
      if (lines.length < 2) {
        alert("The CSV file is empty or missing data rows.");
        setImportLoading(false);
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ''));
      
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = [];
        let currentVal = '';
        let insideQuote = false;
        for (let charIdx = 0; charIdx < line.length; charIdx++) {
          const char = line[charIdx];
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

        if (values.length < headers.length) {
          failCount++;
          errors.push(`Row ${i + 1}: Column count mismatch`);
          continue;
        }

        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });

        const reqBody = {
          admissionNumber: rowData["Admission Number"] || rowData["admissionNumber"],
          rollNumber: rowData["Roll Number"] || rowData["rollNumber"],
          name: rowData["Name"] || rowData["name"],
          classId: parseInt(rowData["Class ID"] || rowData["classId"]),
          dob: rowData["Date of Birth"] || rowData["dob"],
          gender: rowData["Gender"] || rowData["gender"],
          parentName: rowData["Parent Name"] || rowData["parentName"],
          parentMobile: rowData["Parent Mobile"] || rowData["parentMobile"],
          address: rowData["Address"] || rowData["address"]
        };

        if (!reqBody.admissionNumber || !reqBody.rollNumber || !reqBody.name || !reqBody.classId || !reqBody.dob || !reqBody.gender || !reqBody.parentName || !reqBody.parentMobile || !reqBody.address) {
          failCount++;
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        try {
          const res = await fetch(`${API_URL}/api/students/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reqBody)
          });
          await parseResponse(res);
          successCount++;
        } catch (err) {
          failCount++;
          errors.push(`Row ${i + 1}: ${err.message || "Connection error"}`);
        }
      }

      setImportResults({ successCount, failCount, errors });
      setImportLoading(false);
      setCsvFile(null);
      fetchStudents();
    };

    reader.readAsText(csvFile);
  };

  // Upload Marks
  const handleMarksUpload = async (e) => {
    e.preventDefault();
    setMarksSuccess(false);

    try {
      const res = await fetch(`${API_URL}/api/academic/marks/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: marksStudentId,
          subjectId: marksSubjectId,
          examType: marksExamType,
          marksObtained: marksObtained,
          maxMarks: marksMax
        })
      });

      await parseResponse(res);
      setMarksSuccess(true);
      setMarksObtained('');
    } catch (err) {
      console.error(err);
      alert(err.message || "Marks upload failed.");
    }
  };

  // Timetable update
  const handleTimetableUpdate = async (e) => {
    e.preventDefault();
    setTimetableSuccess(false);

    try {
      const res = await fetch(`${API_URL}/api/academic/timetable/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          classId: timeClassId,
          dayOfWeek: timeDay,
          period: timePeriod,
          subjectId: timeSubjectId,
          teacherId: timeTeacherId
        })
      });

      await parseResponse(res);
      setTimetableSuccess(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "Timetable update failed.");
    }
  };

  // Generate Certificate
  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    setCertResult(null);

    try {
      const res = await fetch(`${API_URL}/api/students/certificate/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentId: certStudentId, type: certType })
      });

      const data = await parseResponse(res);
      setCertResult(data.certificate);
    } catch (err) {
      console.error(err);
      alert(err.message || "Certificate generation failed.");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-dark text-white p-6 shadow-xl z-20">
        <div className="flex items-center space-x-3 mb-8">
          <img className="h-10 w-auto" src={apLogo} alt="Emblem" />
          <div>
            <h1 className="font-extrabold text-sm tracking-wider">AP EDU OPERATOR</h1>
            <span className="text-[10px] text-brand-gold font-semibold uppercase">{user.role}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('STUDENTS')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'STUDENTS' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users size={18} />
            <span>Admissions & Registry</span>
          </button>

          <button 
            onClick={() => setActiveTab('PARENT_UPDATES')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'PARENT_UPDATES' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Edit size={18} />
            <span>Parent Info Updates</span>
          </button>

          <button 
            onClick={() => setActiveTab('CORRECTIONS')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'CORRECTIONS' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CheckSquare size={18} />
            <span>Attendance Corrections</span>
          </button>

          <button 
            onClick={() => setActiveTab('BULK_CSV')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'BULK_CSV' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Upload size={18} />
            <span>Bulk Import / Export</span>
          </button>

          <button 
            onClick={() => setActiveTab('MARKS')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'MARKS' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Award size={18} />
            <span>Upload Marks</span>
          </button>

          <button 
            onClick={() => setActiveTab('TIMETABLE')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'TIMETABLE' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calendar size={18} />
            <span>Timetable Manager</span>
          </button>

          <button 
            onClick={() => setActiveTab('CERTIFICATES')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'CERTIFICATES' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText size={18} />
            <span>Issue Certificates</span>
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
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-brand-blue">
              {activeTab.charAt(0) + activeTab.slice(1).toLowerCase().replace(/_/g, ' ')}
            </h2>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              {user.name} • Computer Operator Portal
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="bg-brand-gold/15 text-brand-gold font-bold px-3 py-1 rounded-full text-xs border border-brand-gold/30">
              Biometric Authenticated
            </span>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {/* ========================================================================= */}
          {/* TAB: ADMISSIONS & STUDENT REGISTRY */}
          {/* ========================================================================= */}
          {activeTab === 'STUDENTS' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Student Profiles Registry</h3>
                  <p className="text-xs text-slate-500 font-semibold">Perform new student admissions, record lookups, or updates.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingStudent(null);
                    setStudentForm({
                      id: '', rollNumber: '', name: '', classId: '1', dob: '', gender: 'MALE', parentName: '',
                      parentMobile: '', address: '', admissionNumber: ''
                    });
                    setShowStudentModal(true);
                  }}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <PlusCircle size={14} />
                  <span>New Admission</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Admission No</th>
                        <th className="px-4 py-3">Roll No</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">DOB</th>
                        <th className="px-4 py-3">Gender</th>
                        <th className="px-4 py-3">Parent Details</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-slate-700">{student.admissionNumber}</td>
                          <td className="px-4 py-3 font-mono font-bold text-brand-blue">{student.rollNumber}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{student.name}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs font-mono">{student.dob}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs">{student.gender}</td>
                          <td className="px-4 py-3 text-slate-700 font-semibold">{student.parentName} ({student.parentMobile})</td>
                          <td className="px-4 py-3 flex space-x-2 font-semibold">
                            <button
                              onClick={() => {
                                setEditingStudent(student);
                                setStudentForm({
                                  id: student.id,
                                  rollNumber: student.rollNumber,
                                  name: student.name,
                                  classId: student.classId.toString(),
                                  dob: student.dob || '',
                                  gender: student.gender || 'MALE',
                                  parentName: student.parentName,
                                  parentMobile: student.parentMobile,
                                  address: student.address || '',
                                  admissionNumber: student.admissionNumber || ''
                                });
                                setShowStudentModal(true);
                              }}
                              className="text-brand-blue hover:text-brand-blue/80 font-bold text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-rose-600 hover:text-rose-700 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center py-6 text-slate-400 text-xs">No students registered yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PARENT INFO QUICK UPDATES */}
          {/* ========================================================================= */}
          {activeTab === 'PARENT_UPDATES' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-xl mx-auto space-y-6">
              <h4 className="font-bold text-slate-700">Quick Parent Details Update</h4>
              
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={lookupRoll}
                  onChange={(e) => setLookupRoll(e.target.value)}
                  placeholder="Enter Student Roll Number (e.g. 8A01)"
                  className="flex-1 rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue"
                />
                <button 
                  onClick={handleLookupStudent}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
                >
                  Lookup
                </button>
              </div>

              {parentUpdateSuccess && (
                <div className="bg-teal-50 border-l-4 border-brand-teal p-3 text-xs text-teal-800 rounded-r-md">
                  ✅ Parent information updated successfully. Saved to database.
                </div>
              )}

              {foundStudent && (
                <form onSubmit={handleParentUpdate} className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in">
                  <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                    <p><b>Student Name:</b> {foundStudent.name}</p>
                    <p><b>Current Class:</b> Class ID {foundStudent.classId}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent / Guardian Name</label>
                    <input 
                      type="text" 
                      required
                      value={parentNameInput}
                      onChange={(e) => setParentNameInput(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent Mobile Number (Registered)</label>
                    <input 
                      type="text" 
                      required
                      value={parentMobileInput}
                      onChange={(e) => setParentMobileInput(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-bold py-2 px-4 rounded-lg cursor-pointer shadow-md"
                  >
                    Save Parent Records
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: ATTENDANCE CORRECTIONS */}
          {/* ========================================================================= */}
          {activeTab === 'CORRECTIONS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-xl mx-auto space-y-6 text-left">
              <h4 className="font-bold text-slate-700">Submit Attendance Correction</h4>
              
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={corrRoll}
                  onChange={(e) => setCorrRoll(e.target.value)}
                  placeholder="Enter Student Roll Number (e.g. 8A01)"
                  className="flex-1 rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue"
                />
                <button 
                  onClick={handleLookupCorrStudent}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
                >
                  Lookup
                </button>
              </div>

              {corrSuccess && (
                <div className="bg-teal-50 border-l-4 border-brand-teal p-3 text-xs text-teal-800 rounded-r-md">
                  ✅ Attendance correction recorded successfully. Saved to database.
                </div>
              )}

              {corrError && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-3 text-xs text-rose-800 rounded-r-md">
                  ⚠️ {corrError}
                </div>
              )}

              {corrStudent && (
                <form onSubmit={handleCorrectionSubmit} className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in">
                  <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                    <p><b>Student Name:</b> {corrStudent.name}</p>
                    <p><b>Roll Number:</b> {corrStudent.rollNumber}</p>
                    <p><b>Class ID:</b> {corrStudent.classId}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Date</label>
                    <input 
                      type="date" 
                      required
                      value={corrDate}
                      onChange={(e) => setCorrDate(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Period</label>
                    <select 
                      value={corrPeriod}
                      onChange={(e) => setCorrPeriod(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map(p => (
                        <option key={p} value={p}>Period {p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Corrected Status</label>
                    <select 
                      value={corrStatus}
                      onChange={(e) => setCorrStatus(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue"
                    >
                      <option value="PRESENT">PRESENT</option>
                      <option value="ABSENT">ABSENT</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-bold py-2 px-4 rounded-lg cursor-pointer shadow-md"
                  >
                    Apply Attendance Correction
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: BULK IMPORT & EXPORT */}
          {/* ========================================================================= */}
          {activeTab === 'BULK_CSV' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-xl mx-auto space-y-6 text-left">
              <div>
                <h4 className="font-bold text-slate-700">Bulk Import & Export Center</h4>
                <p className="text-xs text-slate-500 mt-1">Upload CSV rosters to admit students in bulk or download the complete database register.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-200">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Export Student Registry</h5>
                <p className="text-xs text-slate-500">Download a complete CSV spreadsheet of all registered students in the system.</p>
                <button
                  onClick={handleExportStudentsCSV}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <Download size={14} />
                  <span>Download Students CSV</span>
                </button>
              </div>

              <form onSubmit={handleImportCSV} className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-200">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Import Students (CSV)</h5>
                <p className="text-xs text-slate-500">Upload a CSV file containing: <code>Admission Number, Roll Number, Name, Class ID, Date of Birth, Gender, Parent Name, Parent Mobile, Address</code></p>
                
                <div>
                  <input 
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-light file:text-brand-blue hover:file:bg-brand-light/80 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={importLoading || !csvFile}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={14} />
                  <span>{importLoading ? "Uploading & Parsing..." : "Upload & Parse CSV"}</span>
                </button>

                {importResults && (
                  <div className="mt-4 p-3 bg-white border rounded-lg text-xs space-y-2">
                    <p className="font-bold text-slate-800">Import Job Results:</p>
                    <p className="text-emerald-700">✓ Successfully admitted: <b>{importResults.successCount}</b> students</p>
                    <p className="text-rose-700">✗ Failed records: <b>{importResults.failCount}</b></p>
                    {importResults.errors.length > 0 && (
                      <div className="max-h-24 overflow-y-auto bg-rose-50 p-2 rounded text-[10px] text-rose-800 font-mono space-y-1">
                        {importResults.errors.map((err, idx) => (
                          <p key={idx}>{err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: UPLOAD STUDENT MARKS */}
          {/* ========================================================================= */}
          {activeTab === 'MARKS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-xl mx-auto space-y-6">
              <h4 className="font-bold text-slate-700">Student Marks Registry Form</h4>
              
              {marksSuccess && (
                <div className="bg-teal-50 border-l-4 border-brand-teal p-3 text-xs text-teal-800 rounded-r-md">
                  ✅ Student academic marks recorded successfully!
                </div>
              )}

              <form onSubmit={handleMarksUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Student</label>
                  <select 
                    value={marksStudentId} 
                    onChange={(e) => setMarksStudentId(e.target.value)}
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
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                  <select 
                    value={marksSubjectId} 
                    onChange={(e) => setMarksSubjectId(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
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
                    required
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue"
                  >
                    <option value="UNIT_TEST_1">Unit Test 1 (UT1)</option>
                    <option value="UNIT_TEST_2">Unit Test 2 (UT2)</option>
                    <option value="HALF_YEARLY">Half Yearly Exams</option>
                    <option value="FINAL">Final Exams</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marks Obtained</label>
                    <input 
                      type="number" 
                      step="0.5"
                      required
                      value={marksObtained}
                      onChange={(e) => setMarksObtained(e.target.value)}
                      placeholder="e.g. 78.5"
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Marks</label>
                    <input 
                      type="number" 
                      required
                      value={marksMax}
                      onChange={(e) => setMarksMax(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-bold py-2 px-4 rounded-lg cursor-pointer shadow-md"
                >
                  Upload Marks Entry
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: TIMETABLE MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === 'TIMETABLE' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-xl mx-auto space-y-6">
              <h4 className="font-bold text-slate-700">Adjust Class Timetable Structure</h4>
              
              {timetableSuccess && (
                <div className="bg-teal-50 border-l-4 border-brand-teal p-3 text-xs text-teal-800 rounded-r-md">
                  ✅ Class Timetable adjusted successfully!
                </div>
              )}

              <form onSubmit={handleTimetableUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Class</label>
                  <select 
                    value={timeClassId} 
                    onChange={(e) => setTimeClassId(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                  >
                    {classList.map(c => (
                      <option key={c.id} value={c.id}>Class {c.grade}{c.section || ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Day of Week</label>
                  <select 
                    value={timeDay} 
                    onChange={(e) => setTimeDay(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue"
                  >
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                    <option value="SATURDAY">Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Period Number</label>
                  <select 
                    value={timePeriod} 
                    onChange={(e) => setTimePeriod(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                  <select 
                    value={timeSubjectId} 
                    onChange={(e) => setTimeSubjectId(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Teacher</label>
                  <select 
                    value={timeTeacherId} 
                    onChange={(e) => setTimeTeacherId(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.role.replace(/_/g, ' ')})</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-bold py-2 px-4 rounded-lg cursor-pointer shadow-md"
                >
                  Save Timetable Adjustment
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: CERTIFICATE GENERATION */}
          {/* ========================================================================= */}
          {activeTab === 'CERTIFICATES' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-xl mx-auto space-y-6">
              <h4 className="font-bold text-slate-700">Generate Student Study Certificates</h4>
              
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
                  <span>Generate & Issue Certificate</span>
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
                    <span>Print Certificate Document</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* STUDENT FORM MODAL (ADMISSIONS / RECORD EDIT) */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <header className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 text-sm">
                {editingStudent ? 'Edit Student Profile' : 'New Student Admission'}
              </h3>
              <button 
                onClick={() => setShowStudentModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleStudentSubmit} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Admission Number</label>
                  <input 
                    type="text" 
                    required 
                    value={studentForm.admissionNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, admissionNumber: e.target.value })}
                    placeholder="e.g. ADM-2026-001"
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:outline-none focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Roll Number</label>
                  <input 
                    type="text" 
                    required 
                    value={studentForm.rollNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                    placeholder="e.g. 8A01"
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:outline-none focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Student Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    placeholder="e.g. Mahesh Naidu"
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:outline-none focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class / Grade</label>
                  <select 
                    value={studentForm.classId}
                    onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:outline-none focus:ring-brand-blue"
                  >
                    {classList.map(c => (
                      <option key={c.id} value={c.id}>{c.grade}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date of Birth (dob)</label>
                  <input 
                    type="text" 
                    required 
                    value={studentForm.dob}
                    onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                    placeholder="DDMMYYYY (e.g. 06062007)"
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:outline-none focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gender</label>
                  <select 
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:outline-none focus:ring-brand-blue"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent / Guardian Name</label>
                  <input 
                    type="text" 
                    required 
                    value={studentForm.parentName}
                    onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                    placeholder="e.g. Rama Naidu"
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:outline-none focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent Mobile</label>
                  <input 
                    type="text" 
                    required 
                    value={studentForm.parentMobile}
                    onChange={(e) => setStudentForm({ ...studentForm, parentMobile: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:outline-none focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Home Address</label>
                <textarea 
                  rows="2" 
                  required
                  value={studentForm.address}
                  onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                  placeholder="Enter full home address..."
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:outline-none focus:ring-brand-blue"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setShowStudentModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-1.5 px-4 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold py-1.5 px-4 rounded-lg cursor-pointer shadow-md"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
