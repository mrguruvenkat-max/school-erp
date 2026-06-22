import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Users, Award, Building2, BookOpen, Clock, AlertCircle, CheckCircle,
  MapPin, ShieldCheck, Newspaper, ArrowRight,
  Shield, X, Lock, Sparkles, User, Phone, Mail, Leaf, Laptop, Heart,
  Star, Target, Globe, Droplet, Trees
} from 'lucide-react';
import apLogo from '../assets/ap-logo.png';

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

  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const heroSlides = [
    {
      title: "Government Smart Classrooms",
      image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1600"
    },
    {
      title: "Advanced Computer Centers",
      image: "https://images.unsplash.com/photo-1562774053-f5a02f6a7c93?auto=format&fit=crop&q=80&w=1600"
    },
    {
      title: "Modern School Libraries",
      image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1600"
    },
    {
      title: "Mid-Day Meal Kitchens",
      image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=1600"
    }
  ];

  // 8 Facilities & Benefits gallery items
  const facilities = [
    {
      title: "Smart Classrooms",
      desc: "Equipped with interactive flat panels, digital resources, and multimedia capability for interactive visual learning.",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800",
      icon: Laptop
    },
    {
      title: "Computer Labs",
      desc: "State-of-the-art computers with broadband connectivity, teaching coding, basic computations, and digital literacy.",
      image: "https://images.unsplash.com/photo-1562774053-f5a02f6a7c93?auto=format&fit=crop&q=80&w=800",
      icon: Laptop
    },
    {
      title: "Science Laboratories",
      desc: "Fully equipped Physics, Chemistry, and Biology labs enabling practical experiments and inquiry-based research.",
      image: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=800",
      icon: Star
    },
    {
      title: "School Libraries",
      desc: "A rich repository of academic textbooks, reference materials, children's literature, and quiet study areas.",
      image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800",
      icon: BookOpen
    },
    {
      title: "Sports Grounds",
      desc: "Dedicated sports courts and fields fostering physical fitness, regular athletic training, and team development.",
      image: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&q=80&w=800",
      icon: Award
    },
    {
      title: "Mid-Day Meal Program",
      desc: "Serving daily hot, hygienic, and nutritionally balanced lunches confirming to state welfare dietary standards.",
      image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=800",
      icon: Heart
    },
    {
      title: "Clean Drinking Water",
      desc: "Safe and chilled drinking water supply powered by modern RO filtration units located across the school campus.",
      image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=800",
      icon: Droplet
    },
    {
      title: "Green School Campus",
      desc: "Eco-friendly landscaping, solar panels, and organic plantations fostering conservation awareness among students.",
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800",
      icon: Trees
    }
  ];

  // Handle Login Credential Submission
  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: forgotRole, identifier: forgotIdentifier })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed. Please verify identifier.');
      }

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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: forgotRole,
          identifier: forgotIdentifier,
          newPassword: resetNewPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }

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

  // Hidden Route Portals
  if (isPrincipalRoute || isOperatorRoute) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 w-full max-w-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <img className="h-16 w-auto animate-float" src={apLogo} alt="AP Government Logo" />
            <div>
              <h2 className="text-sm font-black text-[#006B2D] uppercase tracking-wide">
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

          <form onSubmit={handleCredentialSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold text-[#004D20] uppercase mb-1">
                {isPrincipalRoute ? 'Principal Username' : 'Operator Username'}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-[#006B2D] focus:border-[#006B2D] text-xs font-semibold"
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
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-[#006B2D] focus:border-[#006B2D] text-xs"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 text-xs font-extrabold rounded-lg text-white bg-[#006B2D] hover:bg-[#138A36] focus:outline-none transition-all disabled:opacity-50 cursor-pointer shadow-md mt-6"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button 
              onClick={() => window.location.href = '/'}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ← Back to Public Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6FBF6] text-slate-800 font-sans relative antialiased scroll-behavior-smooth">

      {/* 1. HEADER */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs z-45 px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center rounded-b-xl">
        <div className="flex items-center space-x-3">
          <img
            className="h-12 w-auto filter drop-shadow-xs transition duration-300 hover:scale-105"
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
            <p className="text-[9px] font-semibold text-slate-500 leading-none mt-0.5">
              ఆంధ్రప్రదేశ్ ప్రభుత్వం | విద్యా శాఖ
            </p>
          </div>
        </div>

        {/* Center Navigation */}
        <nav className="hidden lg:flex items-center space-x-6 text-xs font-extrabold text-slate-700">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#006B2D] transition cursor-pointer">Home</button>
          <button onClick={() => scrollToSection('benefits')} className="hover:text-[#006B2D] transition cursor-pointer">Facilities & Benefits</button>
          <button onClick={() => openLoginForRole('STUDENT')} className="hover:text-[#006B2D] transition cursor-pointer text-[#006B2D] font-black bg-[#E8F5E9] px-3 py-1 rounded-full border border-[#E8F5E9]">Portal Access</button>
        </nav>

        {/* Right Side Login Trigger */}
        <button
          onClick={() => openLoginForRole('STUDENT')}
          className="bg-[#006B2D] hover:bg-[#138A36] text-white text-xs font-bold py-2.5 px-4.5 rounded-lg flex items-center space-x-2 transition-all duration-300 shadow-sm cursor-pointer hover:shadow transform active:scale-95 border border-[#004D20]"
        >
          <Lock size={13} className="text-[#D4AF37]" />
          <span>PORTAL LOGIN</span>
        </button>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden min-h-[70vh] flex items-center px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
        
        {/* Full-screen Background Slideshow */}
        <div className="absolute inset-0 z-0">
          {heroSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === heroSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                className="w-full h-full object-cover"
                src={slide.image}
                alt={slide.title}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#004D20]/95 via-[#004D20]/80 to-transparent"></div>
            </div>
          ))}
        </div>

        <div className="absolute top-12 left-10 text-white/5 pointer-events-none z-10 animate-float">
          <Leaf size={120} />
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="max-w-2xl text-left py-12 space-y-6 text-white">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-white drop-shadow-md">
              Empowering Education,<br />
              Building the Future of<br />
              <span className="text-[#D4AF37]">Andhra Pradesh.</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 font-semibold leading-relaxed max-w-lg drop-shadow-sm">
              Real-time Period Attendance Management, Examination Performance Portals, and Transparent Administration for Government Schools.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-6 border-t border-white/15">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-sm transition duration-300 hover:scale-105 hover:bg-white/15">
                <div className="text-[#D4AF37] bg-white/10 w-6 h-6 rounded-md flex items-center justify-center mb-1.5">
                  <Star size={13} />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white">Academic Focus</h4>
                <p className="text-[10px] text-slate-300 font-bold leading-tight mt-0.5">Empowering Students</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-sm transition duration-300 hover:scale-105 hover:bg-white/15">
                <div className="text-[#D4AF37] bg-white/10 w-6 h-6 rounded-md flex items-center justify-center mb-1.5">
                  <Target size={13} />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white">Biometric Audits</h4>
                <p className="text-[10px] text-slate-300 font-bold leading-tight mt-0.5">Standardized Operations</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-sm transition duration-300 hover:scale-105 hover:bg-white/15">
                <div className="text-[#D4AF37] bg-white/10 w-6 h-6 rounded-md flex items-center justify-center mb-1.5">
                  <Award size={13} />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white">Quality Metrics</h4>
                <p className="text-[10px] text-slate-300 font-bold leading-tight mt-0.5">Structured Assessment</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-sm transition duration-300 hover:scale-105 hover:bg-white/15">
                <div className="text-[#D4AF37] bg-white/10 w-6 h-6 rounded-md flex items-center justify-center mb-1.5">
                  <Globe size={13} />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white">State-Wide ERP</h4>
                <p className="text-[10px] text-slate-300 font-bold leading-tight mt-0.5">Andhra Pradesh System</p>
              </div>
            </div>

          </div>
        </div>

        {/* Carousel slide label indicator */}
        <div className="absolute top-6 right-6 bg-black/45 backdrop-blur-md text-white border border-white/15 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase z-20 flex items-center space-x-2">
          <Sparkles size={11} className="text-[#D4AF37]" />
          <span>{heroSlides[heroSlide].title}</span>
        </div>

        {/* Slide Indicator Dots */}
        <div className="absolute bottom-6 right-6 z-20 flex space-x-2 bg-black/40 px-3.5 py-2 rounded-full backdrop-blur-md border border-white/10">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setHeroSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === heroSlide ? 'bg-[#D4AF37] w-6' : 'bg-white/40 hover:bg-white/70'
              }`}
            ></button>
          ))}
        </div>

      </section>

      {/* 3. LATEST UPDATES BAR */}
      <div className="bg-[#004D20] text-white overflow-hidden py-2 px-4 relative z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center">
          <div className="bg-[#D4AF37] text-[#004D20] font-black text-xs px-3 py-1 rounded-l-md uppercase tracking-wider flex items-center space-x-1.5 shrink-0 z-10 shadow-sm">
            <Newspaper size={12} />
            <span>Latest Board Updates</span>
          </div>

          <div className="relative w-full overflow-hidden h-6 flex items-center bg-[#004D20] px-4">
            <div className="animate-marquee whitespace-nowrap flex items-center space-x-10 text-xs font-semibold select-none">
              <span className="flex items-center space-x-2">
                <span>Admissions open for 2026-27 Academic Cycle. Contact school operator.</span>
                <span className="bg-rose-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">NEW</span>
              </span>
              <span className="flex items-center space-x-2">
                <span>Prisma PostgreSQL integration completed for real-time period logs.</span>
                <span className="bg-rose-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">NEW</span>
              </span>
              <span className="flex items-center space-x-2">
                <span>All parent profiles linked directly via verified mobile configurations.</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FACILITIES & BENEFITS SECTION */}
      <section id="benefits" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-10">
          <div className="inline-flex items-center space-x-2 bg-[#E8F5E9] text-[#138A36] px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
            <Leaf size={12} className="text-[#006B2D]" />
            <span>Welfare & Infrastructure Standards</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#004D20]">Government School Facilities & Benefits</h3>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-xl mx-auto">
            Providing quality education through modern infrastructure, digital learning, sports development, and student welfare initiatives.
          </p>
        </div>

        {/* Benefits Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {facilities.map((fac, idx) => {
            const Icon = fac.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-[#006B2D]/40 hover:-translate-y-1 transition duration-300 flex flex-col justify-between group"
              >
                {/* Image Section */}
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={fac.image}
                    alt={fac.title}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 bg-[#E8F5E9]/90 backdrop-blur-xs p-2 rounded-lg text-[#006B2D] border border-emerald-200/50">
                    <Icon size={16} />
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2 bg-[#F6FBF6]/30">
                  <h4 className="font-black text-[#004D20] text-sm group-hover:text-[#138A36] transition">{fac.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{fac.desc}</p>
                  <div className="w-full border-t border-[#006B2D]/10 pt-2 flex justify-between items-center text-[10px] font-black text-[#006B2D]">
                    <span>AP GOVT WELFARE</span>
                    <span className="text-[#D4AF37]">★ Standard</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="py-6 text-center text-xs text-slate-500 font-semibold relative z-30 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3 text-left">
            <img className="h-6 w-auto opacity-75" src={apLogo} alt="Gov Emblem" />
            <p>© Andhra Pradesh School Education Department | Departmental Standards Platform</p>
          </div>
          <div className="inline-flex items-center space-x-1.5 text-[#006B2D] font-bold">
            <Leaf size={12} />
            <span>GO GREEN SAVE NATURE</span>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL POPUP */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 max-h-[95vh] md:max-h-none overflow-y-auto">
            
            {/* Left Side */}
            <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-[#006B2D] to-[#004D20] p-8 flex-col justify-between text-left text-white relative">
              <div className="space-y-4">
                <img className="h-16 w-auto filter brightness-0 invert animate-float" src={apLogo} alt="Gov Emblem" />
                <h4 className="text-lg font-black leading-tight">AP Education Department Secure Entrance</h4>
                <p className="text-xs text-slate-200">
                  Authentication requires registered credentials. Unauthorized access attempts are monitored and logged.
                </p>
              </div>
              <div className="my-8 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-white text-4xl border border-white/10">
                  🔑
                </div>
              </div>
              <div className="space-y-2 border-t border-white/10 pt-4">
                <blockquote className="text-[10px] italic text-slate-200 font-serif leading-relaxed">
                  "Providing quality education through modern infrastructure and student welfare initiatives."
                </blockquote>
              </div>
            </div>

            {/* Right Side */}
            <div className="col-span-1 md:col-span-7 p-6 sm:p-8 flex flex-col justify-between text-left bg-white relative">
              <button
                onClick={() => {
                  if (isPrincipalRoute || isOperatorRoute) {
                    window.location.href = '/';
                  } else {
                    setShowLoginModal(false);
                  }
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-black text-[#006B2D] flex items-center space-x-2">
                    <Lock size={18} className="text-[#D4AF37]" />
                    <span>Secure Portal Login</span>
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
                          className={`py-2 px-1 text-xs sm:text-sm font-extrabold border-b-2 transition-all duration-300 cursor-pointer ${
                            activeTab === tab
                              ? 'border-[#006B2D] text-[#006B2D]'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
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

                    <form onSubmit={handleCredentialSubmit} className="space-y-4">
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
                            className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-[#006B2D] focus:border-[#006B2D] text-xs font-semibold"
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
                            className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-[#006B2D] focus:border-[#006B2D] text-xs font-semibold"
                            placeholder={activeTab === 'STUDENT' ? "e.g. 06062007" : "••••••••"}
                          />
                        </div>
                      </div>

                      {/* Parent / Staff Password recovery link */}
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
                        className="w-full flex justify-center py-2.5 px-4 text-xs font-extrabold rounded-lg text-white bg-[#006B2D] hover:bg-[#138A36] focus:outline-none transition-all disabled:opacity-50 cursor-pointer shadow-md mt-6 border border-[#004D20]"
                      >
                        {loading ? 'Authenticating...' : 'Sign In'}
                      </button>
                    </form>
                  </>
                ) : (
                  /* Forgot Screen / Reset Password Flow */
                  <div className="space-y-4">
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
                            className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:outline-none focus:ring-[#006B2D] focus:border-[#006B2D] font-semibold"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-[#006B2D] hover:bg-[#138A36] text-white text-xs font-bold py-2.5 rounded-lg shadow-md transition disabled:opacity-50 cursor-pointer border border-[#004D20]"
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
                            className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:outline-none focus:ring-[#006B2D] focus:border-[#006B2D]"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading || resetSuccess}
                          className="w-full bg-[#006B2D] hover:bg-[#138A36] text-white text-xs font-bold py-2.5 rounded-lg shadow-md transition disabled:opacity-50 cursor-pointer border border-[#004D20]"
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

    </div>
  );
}
