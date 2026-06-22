import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import LoginPortal from './portals/LoginPortal';
import PrincipalPortal from './portals/PrincipalPortal';
import TeacherPortal from './portals/TeacherPortal';
import StudentPortal from './portals/StudentPortal';
import ParentPortal from './portals/ParentPortal';
import OperatorPortal from './portals/OperatorPortal';
import { BellRing, X } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [toast, setToast] = useState(null); // { title, content }

  // Socket.io for notice board broadcasts
  useEffect(() => {
    if (!token) return;

    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      console.log('🔌 Connected to Socket.io broadcast server');
      
      // Join corresponding role room
      if (user) {
        socket.emit('join_room', user.role);
        socket.emit('join_room', `user_${user.id}`);
      }
    });

    // Listen for global notice board posts
    socket.on('notice_broadcast', (notice) => {
      setToast({
        title: "🔔 " + notice.title,
        content: notice.content
      });

      // Auto dismiss after 10 seconds
      setTimeout(() => {
        setToast(null);
      }, 10000);
    });

    // Listen for real-time attendance updates
    socket.on('attendance_updated', (data) => {
      setToast({
        title: "✅ Attendance Saved Successfully",
        content: (
          <div className="space-y-1 mt-1 font-semibold text-xs text-slate-700">
            <p>Class: {data.className}</p>
            <p>Date: {data.date}</p>
            <p className="mt-2 text-slate-900">
              <span className="text-emerald-700 font-extrabold">Present: {data.presentCount}</span>
              {" | "}
              <span className="text-rose-700 font-extrabold">Absent: {data.absentCount}</span>
            </p>
          </div>
        )
      });

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToast(null);
      }, 5000);

      // Dispatch custom DOM event to auto-refresh other portal tabs
      window.dispatchEvent(new CustomEvent('attendance_changed', { detail: data }));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  const handleLoginSuccess = (accessToken, loggedInUser) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setToken(accessToken);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Toast Notification alert
  const renderToast = () => {
    if (!toast) return null;
    return (
      <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-brand-gold/30 p-4 animate-bounce flex items-start space-x-3">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-extrabold text-brand-blue">{toast.title}</p>
          <div className="text-xs text-slate-600 leading-relaxed">{toast.content}</div>
        </div>
        <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
          <X size={16} />
        </button>
      </div>
    );
  };

  // Router based on user role
  const renderPortal = () => {
    if (!user) {
      return <LoginPortal onLoginSuccess={handleLoginSuccess} />;
    }

    switch (user.role) {
      case 'PRINCIPAL':
        return <PrincipalPortal user={user} token={token} onLogout={handleLogout} />;
      case 'COMPUTER_OPERATOR':
        return <OperatorPortal user={user} token={token} onLogout={handleLogout} />;
      case 'TEACHER':
        return <TeacherPortal user={user} token={token} onLogout={handleLogout} />;
      case 'STUDENT':
        return <StudentPortal user={user} token={token} onLogout={handleLogout} />;
      case 'PARENT':
        return <ParentPortal user={user} token={token} onLogout={handleLogout} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-screen bg-slate-50 space-y-4">
            <p className="text-red-500 font-bold">Error: Invalid Portal Role access configuration.</p>
            <button onClick={handleLogout} className="bg-brand-blue text-white px-4 py-2 rounded">
              Logout
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {renderPortal()}
      {renderToast()}
    </div>
  );
}
