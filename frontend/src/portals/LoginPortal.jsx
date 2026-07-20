import { useState, useEffect } from 'react';
import {
  BookOpen, AlertCircle, CheckCircle, ShieldCheck, Newspaper,
  X, Lock, Leaf, Phone, Mail, MapPin, Download, ArrowRight, FileText, Settings, Users, Clock,
  Laptop, FlaskConical, Library, Trophy, Tv, Utensils, Droplet, Bus
} from 'lucide-react';
import apLogo from '../assets/ap-logo.png';
import { API_URL, parseResponse } from '../config/api';

// Facility Gallery Image Assets
import smartClassroom from '../assets/facilities/smart-classroom.jpg';
import computerLab from '../assets/facilities/computer-lab.jpg';
import scienceLab from '../assets/facilities/science-lab.jpg';
import library from '../assets/facilities/library.jpg';
import sportsGround from '../assets/facilities/sports-ground.jpg';
import midDayMeal from '../assets/facilities/mid-day-meal.jpg';
import drinkingWater from '../assets/facilities/drinking-water.jpg';
import digitalLearning from '../assets/facilities/digital-learning.jpg';

export default function LoginPortal({ onLoginSuccess }) {
  const isPrincipalRoute = window.location.pathname === '/principal/login';
  const isOperatorRoute = window.location.pathname === '/operator/login';

  const [showLoginModal, setShowLoginModal] = useState(isPrincipalRoute || isOperatorRoute);
  const [activeTab, setActiveTab] = useState(
    isPrincipalRoute ? 'PRINCIPAL' : isOperatorRoute ? 'COMPUTER_OPERATOR' : 'STUDENT'
  );

  // Login credentials state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot / Reset Password state
  const [showForgotScreen, setShowForgotScreen] = useState(false);
  const [forgotRole, setForgotRole] = useState('STUDENT');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  const [showResetScreen, setShowResetScreen] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Public notices & announcements states
  const [notices, setNotices] = useState([]);
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
  const [isNoticeBarHovered, setIsNoticeBarHovered] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/academic/public/notices`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotices(data);
        }
      })
      .catch(err => console.error("Error loading public notices:", err));
  }, []);

  useEffect(() => {
    if (notices.length <= 1 || isNoticeBarHovered) return;
    const interval = setInterval(() => {
      setCurrentNoticeIndex(prev => (prev + 1) % notices.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [notices, isNoticeBarHovered]);

  // Sync route checks
  useEffect(() => {
    if (isPrincipalRoute) {
      setActiveTab('PRINCIPAL');
      setShowLoginModal(true);
    } else if (isOperatorRoute) {
      setActiveTab('COMPUTER_OPERATOR');
      setShowLoginModal(true);
    }
  }, [isPrincipalRoute, isOperatorRoute]);

  // Handle Login Credential Submission
  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await parseResponse(response);
      onLoginSuccess(data.accessToken, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Form Submission
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setForgotSuccess(false);
    setForgotMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: forgotRole, identifier: forgotIdentifier })
      });

      const data = await parseResponse(response);
      setForgotSuccess(true);
      setForgotMessage(data.message);
      setShowResetScreen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password Form Submission
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: forgotRole,
          identifier: forgotIdentifier,
          newPassword: resetNewPassword
        })
      });

      await parseResponse(response);
      setResetSuccess(true);
      setTimeout(() => {
        setShowForgotScreen(false);
        setShowResetScreen(false);
        setForgotSuccess(false);
        setResetSuccess(false);
        setResetNewPassword('');
        setForgotIdentifier('');
        setActiveTab(forgotRole);
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openLoginForRole = (role) => {
    setActiveTab(role);
    setError('');
    setShowForgotScreen(false);
    setShowResetScreen(false);
    setForgotSuccess(false);
    setResetSuccess(false);
    setShowLoginModal(true);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Hidden Route Portals for Principal/Operator direct access
  if (isPrincipalRoute || isOperatorRoute) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded border border-slate-200 w-full max-w-md p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col items-center text-center space-y-3">
            <img className="h-16 w-auto" src={apLogo} alt="AP Government Logo" />
            <div>
              <h2 className="text-xs font-black text-[#006B2D] uppercase tracking-wide">
                GOVERNMENT OF ANDHRA PRADESH
              </h2>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                {isPrincipalRoute ? 'Principal Secure Portal' : 'Computer Operator Secure Portal'}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-3 text-xs text-rose-800 rounded-r-md flex items-center space-x-2">
              <AlertCircle size={14} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCredentialSubmit} className="space-y-4 text-xs text-left">
            <div>
              <label className="block text-[10px] font-extrabold text-[#004D20] uppercase mb-1">
                {isPrincipalRoute ? 'Principal Username' : 'Operator Username'}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded border border-slate-350 relative block w-full px-3 py-2 placeholder-slate-450 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#006B2D] focus:border-[#006B2D] text-xs font-bold"
                placeholder={isPrincipalRoute ? "e.g. principal" : "e.g. operator"}
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-[#004D20] uppercase mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded border border-slate-350 relative block w-full px-3 py-2 placeholder-slate-450 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#006B2D] focus:border-[#006B2D] text-xs"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 text-xs font-extrabold rounded text-white bg-[#006B2D] hover:bg-[#138A36] focus:outline-none transition-all disabled:opacity-50 cursor-pointer shadow-sm mt-6 border border-emerald-950"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button 
              onClick={() => window.location.href = '/'}
              className="text-[10px] font-bold text-slate-450 hover:text-slate-700 cursor-pointer"
            >
              ← Back to Public Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans relative antialiased scroll-behavior-smooth">

      {/* 1. HEADER */}
      <header className="sticky top-0 bg-white border-b border-slate-200 shadow-xs z-45 px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img
            className="h-12 w-auto transition duration-300 hover:scale-102"
            src={apLogo}
            alt="Emblem of Andhra Pradesh"
          />
          <div className="text-left">
            <h1 className="text-xs sm:text-sm font-black text-[#006B2D] leading-tight tracking-wide">
              GOVERNMENT OF ANDHRA PRADESH
            </h1>
            <p className="text-[11px] font-extrabold text-[#138A36] uppercase leading-tight">
              School Education Department
            </p>
            <p className="text-[9px] font-semibold text-slate-450 leading-none mt-0.5">
              ఆంధ్రప్రదేశ్ ప్రభుత్వం | విద్యా శాఖ
            </p>
          </div>
        </div>

        {/* Center Navigation */}
        <nav className="hidden xl:flex items-center space-x-5 text-[11px] font-extrabold text-slate-650">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#006B2D] transition cursor-pointer">Home</button>
          <button onClick={() => scrollToSection('gallery')} className="hover:text-[#006B2D] transition cursor-pointer">Facilities</button>
          <button onClick={() => scrollToSection('announcements')} className="hover:text-[#006B2D] transition cursor-pointer">Announcements</button>
          <button onClick={() => scrollToSection('contact')} className="hover:text-[#006B2D] transition cursor-pointer">Contact</button>
        </nav>

        {/* Right Side Login Trigger */}
        <button
          onClick={() => openLoginForRole('STUDENT')}
          className="bg-[#006B2D] hover:bg-[#138A36] text-white text-xs font-bold py-2.5 px-4 rounded border border-[#004D20] flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
        >
          <Lock size={13} className="text-[#D4AF37]" />
          <span>PORTAL LOGIN</span>
        </button>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative min-h-[500px] flex items-center px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        
        {/* Hero Background Image with Solid Green overlay */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1600"
            alt="AP Classrooms"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#004D20]/95 via-[#004D20]/90 to-[#004D20]/80"></div>
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto w-full relative z-10 py-10 flex flex-col lg:flex-row justify-between items-start gap-8">
          
          {/* Left Side Info */}
          <div className="max-w-2xl text-left text-white space-y-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              AP Government School ERP
            </h2>
            <p className="text-base sm:text-lg font-bold text-[#D4AF37]">
              Student Information & Academic Management System
            </p>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl">
              A centralized digital platform developed for Andhra Pradesh Government Schools to manage student records, attendance, examinations, academic performance, certificates, communication, and administrative services.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs pt-4 border-t border-white/15">
              {[
                "Student Information System",
                "Attendance Management",
                "Examination Management",
                "Parent Portal",
                "Teacher Portal",
                "Principal Dashboard",
                "Academic Reports",
                "Certificate Services"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="text-[#D4AF37] font-bold">✓</span>
                  <span className="font-semibold text-slate-100">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => openLoginForRole('STUDENT')}
              className="mt-6 bg-[#D4AF37] hover:bg-[#c29f2e] text-[#004D20] font-black py-2.5 px-6 rounded text-xs transition-all cursor-pointer shadow-xs border border-amber-600 inline-flex items-center space-x-2"
            >
              <span>Portal Login</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Right Side Info Card */}
          <div className="bg-white text-slate-800 border border-slate-200 rounded p-5 w-full max-w-sm text-left shadow-md shrink-0">
            <h3 className="text-xs font-black text-[#006B2D] uppercase tracking-wider pb-2 border-b border-slate-150">
              Institutional Information
            </h3>
            <div className="divide-y divide-slate-100 text-[11px] font-semibold">
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">School Timings:</span>
                <span className="font-bold text-slate-700">09:00 AM - 04:00 PM</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Office Hours:</span>
                <span className="font-bold text-slate-700">10:00 AM - 05:00 PM</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Academic Year:</span>
                <span className="font-bold text-slate-700">2026-27</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Current Semester:</span>
                <span className="font-bold text-slate-700">Semester I (July - Dec)</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Support Email:</span>
                <span className="font-mono text-slate-700 font-bold">support-erp.edu@ap.gov.in</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Latest Circular Date:</span>
                <span className="font-bold text-slate-700">18-July-2026</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Last Database Sync:</span>
                <span className="font-bold text-emerald-600">Live (Sync 5m ago)</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="font-bold text-[#006B2D] text-right">Dept of School Education, AP</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. LATEST UPDATES TICKER BAR */}
      <div 
        className="bg-[#004D20] text-white py-2.5 px-4 relative z-30 shadow-sm border-b border-slate-800"
        onMouseEnter={() => setIsNoticeBarHovered(true)}
        onMouseLeave={() => setIsNoticeBarHovered(false)}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3 shrink-0">
            <div className="bg-[#10B981] text-white font-extrabold text-[10px] px-3 py-1 rounded uppercase tracking-wider flex items-center space-x-1.5 shadow-xs border border-emerald-500">
              <span className="text-xs">📢</span>
              <span>Official Announcements</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-between min-w-0 bg-[#003d19] rounded-lg px-4 py-1.5 border border-emerald-900/30">
            {notices.length > 0 ? (
              (() => {
                const activeNotice = notices[currentNoticeIndex];
                const isRecent = new Date() - new Date(activeNotice.createdAt) < 7 * 24 * 60 * 60 * 1000;
                return (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div 
                      onClick={() => setSelectedNotice(activeNotice)}
                      className="flex-1 flex items-center space-x-3 cursor-pointer hover:text-emerald-300 transition truncate text-left pr-4"
                    >
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wide uppercase shrink-0 border ${
                        activeNotice.noticeType === 'EMERGENCY' ? 'bg-red-500 text-white border-red-400 animate-pulse' :
                        activeNotice.noticeType === 'EXAMINATION' ? 'bg-purple-600 text-white border-purple-500' :
                        activeNotice.noticeType === 'HOLIDAY' ? 'bg-rose-600 text-white border-rose-500' :
                        activeNotice.noticeType === 'SCHOLARSHIP' ? 'bg-amber-550 text-[#004D20] border-amber-400' :
                        activeNotice.noticeType === 'ACADEMIC' ? 'bg-blue-600 text-white border-blue-500' :
                        activeNotice.noticeType === 'EVENTS' ? 'bg-indigo-600 text-white border-indigo-500' :
                        'bg-slate-700 text-white border-slate-600'
                      }`}>
                        {activeNotice.noticeType || 'GENERAL'}
                      </span>
                      
                      <span className="text-xs font-semibold truncate hover:underline">
                        {activeNotice.title}
                      </span>

                      {activeNotice.isPinned && (
                        <span className="text-xs shrink-0" title="Pinned Important Notice">📌</span>
                      )}

                      {isRecent && (
                        <span className="bg-rose-600 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full animate-pulse tracking-wide shrink-0">NEW</span>
                      )}

                      <span className="text-[10px] text-emerald-400 font-bold shrink-0 font-mono hidden sm:inline">
                        [{new Date(activeNotice.createdAt).toLocaleDateString()}]
                      </span>
                    </div>

                    {notices.length > 1 && (
                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentNoticeIndex(prev => (prev - 1 + notices.length) % notices.length);
                          }}
                          className="p-1 hover:bg-emerald-800 rounded transition text-emerald-300 hover:text-white cursor-pointer text-xs font-bold font-mono"
                          title="Previous Announcement"
                        >
                          &lt;
                        </button>
                        <span className="text-[9px] font-mono text-emerald-400 select-none">
                          {currentNoticeIndex + 1}/{notices.length}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentNoticeIndex(prev => (prev + 1) % notices.length);
                          }}
                          className="p-1 hover:bg-emerald-800 rounded transition text-emerald-300 hover:text-white cursor-pointer text-xs font-bold font-mono"
                          title="Next Announcement"
                        >
                          &gt;
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <span className="text-xs text-emerald-300/70 italic py-0.5">No active announcements released.</span>
            )}
          </div>
          
        </div>
      </div>

      {/* 4. SCHOOL FACILITIES GALLERY */}
      <section id="gallery" className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-left space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xl font-extrabold text-[#004D20] uppercase tracking-wider">School Facilities</h3>
            <p className="text-xs text-slate-450 mt-0.5">Explore the educational infrastructure and student facilities available on campus.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { title: "Smart Classroom", image: smartClassroom },
              { title: "Computer Laboratory", image: computerLab },
              { title: "Science Laboratory", image: scienceLab },
              { title: "Library", image: library },
              { title: "Sports Ground", image: sportsGround },
              { title: "Digital Classroom", image: digitalLearning },
              { title: "Mid-Day Meal", image: midDayMeal },
              { title: "Safe Drinking Water", image: drinkingWater }
            ].map((fac, idx) => (
              <div key={idx} className="space-y-2 text-center">
                <div className="overflow-hidden rounded-xl shadow-xs border border-slate-200 aspect-video transition-all duration-300 hover:scale-105 hover:shadow-md">
                  <img
                    src={fac.image}
                    alt={fac.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-extrabold text-[11px] sm:text-xs text-[#004D20] uppercase tracking-wide">
                  {fac.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ANNOUNCEMENTS & NOTICE BOARD SECTION */}
      <section id="announcements" className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUMN 1: OFFICIAL ANNOUNCEMENTS */}
            <div className="space-y-6 text-left">
              <div className="border-b border-slate-105 pb-3">
                <h3 className="text-xl font-extrabold text-[#004D20] uppercase tracking-wider flex items-center space-x-2">
                  <span>📢</span>
                  <span>Official Announcements</span>
                </h3>
                <p className="text-xs text-slate-450 mt-0.5">Department of School Education, Andhra Pradesh</p>
              </div>

              <div className="space-y-4">
                {[
                  "Admissions for Academic Year 2026–27 are now open.",
                  "Unit Test–I Examination Time Table has been published.",
                  "Parent–Teacher Meeting scheduled on 28 July 2026.",
                  "Student attendance must be updated daily before 5:00 PM.",
                  "Mid-Day Meal quality inspection will be conducted this week."
                ].map((ann, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start space-x-3 p-3.5 bg-emerald-50/50 border-l-4 border-[#006B2D] border-y border-r border-slate-100 rounded-r hover:bg-emerald-50 transition"
                  >
                    <span className="text-sm shrink-0 mt-0.5">📢</span>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">{ann}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: LATEST ANNOUNCEMENTS */}
            <div className="space-y-6 text-left">
              <div className="border-b border-slate-105 pb-3">
                <h3 className="text-xl font-extrabold text-[#004D20] uppercase tracking-wider flex items-center space-x-2">
                  <span>📄</span>
                  <span>Latest Announcements</span>
                </h3>
                <p className="text-xs text-slate-450 mt-0.5">Recent School Notices & Circulars</p>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const activeNotices = notices.filter(n => !n.expiryDate || n.expiryDate >= todayStr);
                  
                  return activeNotices.map((notice) => {
                    const isRecent = new Date() - new Date(notice.createdAt) < 7 * 24 * 60 * 60 * 1000;
                    return (
                      <div 
                        key={notice.id} 
                        className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex space-x-3">
                            <span className="text-[#006B2D] text-lg shrink-0 mt-0.5">📄</span>
                            <div className="space-y-1">
                              <h4 className="text-slate-800 font-extrabold text-xs sm:text-sm leading-snug">
                                {notice.title}
                              </h4>
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wide uppercase border ${
                                  notice.noticeType?.toUpperCase() === 'EMERGENCY' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                                  notice.noticeType?.toUpperCase() === 'EXAMINATION' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  notice.noticeType?.toUpperCase() === 'HOLIDAY' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  notice.noticeType?.toUpperCase() === 'SCHOLARSHIP' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  notice.noticeType?.toUpperCase() === 'ACADEMIC' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  notice.noticeType?.toUpperCase() === 'EVENTS' || notice.noticeType?.toUpperCase() === 'EVENT' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                  notice.noticeType?.toUpperCase() === 'LIBRARY' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  notice.noticeType?.toUpperCase() === 'SPORTS' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                  'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                  {notice.noticeType || 'GENERAL'}
                                </span>
                                {notice.isPinned && (
                                  <span className="text-[10px] shrink-0" title="Pinned Notice">📌</span>
                                )}
                                {isRecent && (
                                  <span className="bg-rose-600 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full animate-pulse tracking-wide shrink-0">NEW</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 gap-2">
                          <div className="text-[10px] text-slate-450 font-bold font-mono">
                            Published: {new Date(notice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            {notice.pdfUrl && (
                              <a
                                href={notice.pdfUrl}
                                download
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#006B2D] border border-emerald-200 rounded text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
                              >
                                <span>📥</span>
                                <span>Circular</span>
                              </a>
                            )}
                            <button 
                              onClick={() => setSelectedNotice(notice)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[#004D20] border border-slate-350 rounded text-[10px] font-bold transition cursor-pointer"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
                
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const activeCount = notices.filter(n => !n.expiryDate || n.expiryDate >= todayStr).length;
                  if (activeCount === 0) {
                    return <p className="text-slate-400 py-6 text-center font-bold">No active notices published at this moment.</p>;
                  }
                  return null;
                })()}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. CONTACT INFORMATION */}
      <section id="contact" className="py-12 max-w-7xl mx-auto px-4 text-left space-y-8">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xl font-extrabold text-[#004D20] uppercase tracking-wider">Contact Information</h3>
          <p className="text-xs text-slate-450 mt-0.5">Official contact details and departmental support directories.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold">
          {/* School Office */}
          <div className="p-5 border border-slate-200 rounded bg-white space-y-4">
            <h4 className="font-extrabold text-[#004D20] uppercase tracking-wider border-b pb-2">School Office</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin size={14} className="text-[#006B2D] mt-0.5 shrink-0" />
                <p className="text-slate-600">AP Government Model High School,<br />Guntur District, Andhra Pradesh, India</p>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={14} className="text-[#006B2D] shrink-0" />
                <p className="text-slate-600">+91 863 2234123</p>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={14} className="text-[#006B2D] shrink-0" />
                <p className="font-mono text-[#006B2D]">contact-school.edu@ap.gov.in</p>
              </div>
              <div className="flex items-center space-x-2">
                <Clock size={14} className="text-[#006B2D] shrink-0" />
                <p className="text-slate-600">Office Timings: 10:00 AM - 05:00 PM</p>
              </div>
            </div>
          </div>

          {/* District Education Office */}
          <div className="p-5 border border-slate-200 rounded bg-white space-y-4">
            <h4 className="font-extrabold text-[#004D20] uppercase tracking-wider border-b pb-2">District Education Office</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin size={14} className="text-[#006B2D] mt-0.5 shrink-0" />
                <p className="text-slate-600">DEO Office, Guntur,<br />Andhra Pradesh, India</p>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={14} className="text-[#006B2D] shrink-0" />
                <p className="text-slate-600">+91 863 2234100</p>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={14} className="text-[#006B2D] shrink-0" />
                <p className="font-mono text-[#006B2D]">deo-guntur.edu@ap.gov.in</p>
              </div>
            </div>
          </div>

          {/* Mock Map */}
          <div className="border border-slate-200 rounded overflow-hidden bg-slate-100 flex flex-col justify-between p-4 text-center">
            <div className="space-y-2">
              <h5 className="font-extrabold text-[#004D20] uppercase">Location Registry Map</h5>
              <p className="text-slate-500 leading-normal">AP Government Model High School, Guntur District</p>
            </div>
            <div className="h-28 bg-slate-200 border border-dashed border-slate-350 rounded flex items-center justify-center text-slate-400 font-mono select-none">
              [ MOCK MAP LOCATION DESK ]
            </div>
          </div>
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="bg-[#004D20] text-slate-300 py-10 border-t-4 border-[#D4AF37] text-xs font-semibold">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <img className="h-10 w-auto filter brightness-0 invert" src={apLogo} alt="Gov Emblem" />
              <h4 className="font-black text-white leading-tight">AP School ERP 3.0</h4>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Centralized administrative gateway for verified public schools under the Department of School Education, Government of Andhra Pradesh.
            </p>
          </div>

          <div>
            <h5 className="font-black text-white uppercase mb-3 text-[11px] tracking-wider">Important Links</h5>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="https://cse.ap.gov.in" target="_blank" rel="noreferrer" className="hover:text-white">Commissioner of School Education</a></li>
              <li><a href="https://apcfss.in" target="_blank" rel="noreferrer" className="hover:text-white">APCFSS Services Portal</a></li>
              <li><a href="https://epragati.ap.gov.in" target="_blank" rel="noreferrer" className="hover:text-white">e-Pragati Gateway</a></li>
              <li><button onClick={() => openLoginForRole('STUDENT')} className="hover:text-white cursor-pointer text-left">Portal Login</button></li>
            </ul>
          </div>

          <div>
            <h5 className="font-black text-white uppercase mb-3 text-[11px] tracking-wider">Help Desk & Support</h5>
            <ul className="space-y-1.5 text-[11px]">
              <li>Support Contact: <span className="font-mono">+91 863 2234123</span></li>
              <li>Email: <span className="font-mono text-emerald-400">support-erp.edu@ap.gov.in</span></li>
              <li>Hours: Monday - Saturday | 10:00 AM - 05:00 PM</li>
            </ul>
          </div>

          <div>
            <h5 className="font-black text-white uppercase mb-3 text-[11px] tracking-wider">Directives & Privacy</h5>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#privacy" className="hover:text-white">Privacy Policy directives</a></li>
              <li><a href="#terms" className="hover:text-white">Terms of Usage agreements</a></li>
              <li className="flex items-center space-x-1 text-[#D4AF37] font-bold mt-2">
                <ShieldCheck size={12} />
                <span>SSL Secure Database Gateway</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400 text-[11px]">
          <p>© 2026 Andhra Pradesh School Education Department | Departmental Standards Platform. All Rights Reserved.</p>
          <div className="inline-flex items-center space-x-1 text-[#D4AF37] font-bold">
            <Leaf size={11} />
            <span>Mana Badi Program Standards</span>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL POPUP */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-2xl w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 max-h-[95vh] md:max-h-none overflow-y-auto">
            
            {/* Left Side Info Panel */}
            <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-[#006B2D] to-[#004D20] p-8 flex-col justify-between text-left text-white relative">
              <div className="space-y-4">
                <img className="h-16 w-auto filter brightness-0 invert" src={apLogo} alt="Gov Emblem" />
                <h4 className="text-lg font-black leading-tight">AP Education Department Secure Entrance</h4>
                <p className="text-xs text-slate-200">
                  Authentication requires registered credentials. Unauthorized access attempts are monitored and logged.
                </p>
              </div>
              <div className="my-8 flex justify-center">
                <div className="w-20 h-20 rounded bg-white/10 flex items-center justify-center text-white text-3xl border border-white/10">
                  🔑
                </div>
              </div>
              <div className="space-y-2 border-t border-white/10 pt-4">
                <p className="text-[10px] text-slate-300 font-semibold leading-relaxed">
                  State Unified portal authentication. Syncing biometric markers with local school servers.
                </p>
              </div>
            </div>

            {/* Right Side Credentials Forms */}
            <div className="col-span-1 md:col-span-7 p-6 sm:p-8 flex flex-col justify-between text-left bg-white relative">
              <button
                onClick={() => {
                  if (isPrincipalRoute || isOperatorRoute) {
                    window.location.href = '/';
                  } else {
                    setShowLoginModal(false);
                  }
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-black text-[#006B2D] flex items-center space-x-2">
                    <Lock size={16} className="text-[#D4AF37]" />
                    <span>Secure Portal Login Gate</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Select your access role to authenticate credentials.</p>
                </div>

                {!showForgotScreen ? (
                  <>
                    {/* Tab Selectors */}
                    <div className="flex border-b border-slate-200 justify-between">
                      {['STUDENT', 'TEACHER', 'PARENT'].map((tab) => (
                        <button
                          key={tab}
                          disabled={isPrincipalRoute || isOperatorRoute}
                          onClick={() => {
                            setActiveTab(tab);
                            setError('');
                            setUsername('');
                            setPassword('');
                          }}
                          className={`py-2 px-2 text-xs sm:text-sm font-extrabold border-b-2 transition cursor-pointer ${
                            activeTab === tab
                              ? 'border-[#006B2D] text-[#006B2D]'
                              : 'border-transparent text-slate-400 hover:text-slate-650'
                          }`}
                        >
                          {tab === 'TEACHER' ? 'Teacher' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>

                    {error && (
                      <div className="bg-rose-50 border-l-4 border-rose-500 p-3 text-xs text-rose-800 rounded-r-md flex items-center space-x-2">
                        <AlertCircle size={14} className="shrink-0 text-rose-500" />
                        <span>{error}</span>
                      </div>
                    )}

                    <form onSubmit={handleCredentialSubmit} className="space-y-4 text-xs text-left">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-extrabold text-[#004D20] uppercase mb-1">
                            {activeTab === 'STUDENT' ? 'Roll Number' : activeTab === 'PARENT' ? 'Registered Mobile Number' : activeTab === 'TEACHER' ? 'Employee ID' : 'Username'}
                          </label>
                          <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="appearance-none rounded border border-slate-350 relative block w-full px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#006B2D] focus:border-[#006B2D] text-xs font-bold"
                            placeholder={
                              activeTab === 'STUDENT'
                                ? "Enter Roll Number (e.g. 2551)"
                                : activeTab === 'PARENT'
                                ? "Enter Mobile Number (e.g. 9300000101)"
                                : activeTab === 'TEACHER'
                                ? "Enter Employee ID"
                                : "Enter Username"
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-[#004D20] uppercase mb-1">
                            {activeTab === 'STUDENT' ? 'Date of Birth (DDMMYYYY)' : 'Password'}
                          </label>
                          <input
                            type={activeTab === 'STUDENT' ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="appearance-none rounded border border-slate-350 relative block w-full px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#006B2D] focus:border-[#006B2D] text-xs font-bold"
                            placeholder={activeTab === 'STUDENT' ? "e.g. 06062007" : "••••••••"}
                          />
                        </div>
                      </div>

                      {/* Password Recovery link */}
                      {(activeTab === 'PARENT' || activeTab === 'TEACHER') && (
                        <div className="flex justify-between items-center pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgotScreen(true);
                              setForgotRole(activeTab);
                              setForgotIdentifier('');
                              setError('');
                            }}
                            className="text-[10px] font-bold text-[#138A36] hover:text-[#006B2D] cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 text-xs font-extrabold rounded text-white bg-[#006B2D] hover:bg-[#138A36] focus:outline-none transition-all disabled:opacity-50 cursor-pointer shadow-sm mt-6 border border-[#004D20]"
                      >
                        {loading ? 'Authenticating...' : 'Sign In'}
                      </button>
                    </form>
                  </>
                ) : (
                  /* Forgot / Reset password screens */
                  <div className="space-y-4 text-xs text-left">
                    {error && (
                      <div className="bg-rose-50 border-l-4 border-rose-500 p-3 text-xs text-rose-800 rounded-r-md flex items-center space-x-2">
                        <AlertCircle size={14} className="shrink-0 text-rose-500" />
                        <span>{error}</span>
                      </div>
                    )}
                    {forgotSuccess && !resetSuccess && (
                      <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-xs text-emerald-800 rounded-r-md flex items-center space-x-2">
                        <CheckCircle size={14} className="shrink-0 text-emerald-500" />
                        <span>{forgotMessage}</span>
                      </div>
                    )}
                    {resetSuccess && (
                      <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-xs text-emerald-800 rounded-r-md flex items-center space-x-2">
                        <CheckCircle size={14} className="shrink-0 text-emerald-500" />
                        <span>Password has been reset successfully! Returning to login...</span>
                      </div>
                    )}

                    {!showResetScreen ? (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-extrabold text-[#004D20] uppercase mb-1">Registered Identifier</label>
                          <input
                            type="text"
                            required
                            value={forgotIdentifier}
                            onChange={(e) => setForgotIdentifier(e.target.value)}
                            placeholder={forgotRole === 'PARENT' ? "Enter Mobile Number (e.g. 9300000101)" : "Enter Employee ID"}
                            className="block w-full rounded border border-slate-350 py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#006B2D] focus:border-[#006B2D] font-bold"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-[#006B2D] hover:bg-[#138A36] text-white text-xs font-bold py-2.5 rounded shadow-sm transition disabled:opacity-50 cursor-pointer border border-[#004D20]"
                        >
                          {loading ? 'Verifying...' : 'Request Password Reset'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-extrabold text-[#004D20] uppercase mb-1">New Password</label>
                          <input
                            type="password"
                            required
                            value={resetNewPassword}
                            onChange={(e) => setResetNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="block w-full rounded border border-slate-350 py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#006B2D] focus:border-[#006B2D]"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading || resetSuccess}
                          className="w-full bg-[#006B2D] hover:bg-[#138A36] text-white text-xs font-bold py-2.5 rounded shadow-sm transition disabled:opacity-50 cursor-pointer border border-[#004D20]"
                        >
                          {loading ? 'Saving...' : 'Save New Password'}
                        </button>
                      </form>
                    )}

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotScreen(false);
                          setShowResetScreen(false);
                          setForgotSuccess(false);
                          setResetSuccess(false);
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        ← Back to Login
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-6">
                <span className="flex items-center space-x-1 text-emerald-600 font-bold">
                  <ShieldCheck size={12} />
                  <span>SSL Secured Login Portal</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ANNOUNCEMENT DETAILS MODAL */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#004D20] text-white p-4 border-b-2 border-[#D4AF37] font-bold text-xs uppercase tracking-wider flex justify-between items-center">
              <span>Official Circular / Notice</span>
              <button 
                onClick={() => setSelectedNotice(null)} 
                className="text-white hover:text-emerald-300 font-extrabold cursor-pointer transition text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-left text-xs font-semibold text-slate-700">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wide uppercase shrink-0 border ${
                    selectedNotice.noticeType === 'EMERGENCY' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                    selectedNotice.noticeType === 'EXAMINATION' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    selectedNotice.noticeType === 'HOLIDAY' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    selectedNotice.noticeType === 'SCHOLARSHIP' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    selectedNotice.noticeType === 'ACADEMIC' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    selectedNotice.noticeType === 'EVENTS' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {selectedNotice.noticeType || 'GENERAL'}
                  </span>
                  {selectedNotice.isPinned && (
                    <span className="text-[10px] shrink-0" title="Pinned Notice">📌 Pinned</span>
                  )}
                </div>

                <h4 className="text-sm sm:text-base font-extrabold text-[#004D20] leading-snug">
                  {selectedNotice.title}
                </h4>
                
                <div className="text-[10px] text-slate-400 font-bold font-mono">
                  Published Date: {new Date(selectedNotice.createdAt).toLocaleString()}
                  {selectedNotice.expiryDate && ` | Expiry Date: ${new Date(selectedNotice.expiryDate).toLocaleDateString()}`}
                </div>
              </div>

              <hr className="border-slate-100" />

              <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line font-medium">
                {selectedNotice.content}
              </p>

              {selectedNotice.pdfUrl && (
                <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-lg flex items-center justify-between gap-3 mt-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#004D20] uppercase">Official Attachment</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{selectedNotice.pdfUrl}</p>
                  </div>
                  <a 
                    href={selectedNotice.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 bg-[#006B2D] hover:bg-[#138A36] text-white font-bold py-1.5 px-3 rounded border border-[#004D20] text-[10px] shadow-sm transition shrink-0"
                  >
                    <Download size={11} />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 rounded text-xs font-bold transition cursor-pointer"
              >
                Close Circular
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
