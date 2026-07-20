import React from 'react';

export default function LoadingScreen({ portal }) {
  // portal is "Student" or "Teacher"
  const titleText = portal === "Teacher" ? "Loading Teacher Portal..." : "Loading Student Portal...";
  const subText = portal === "Teacher" ? "Loading Teacher Dashboard..." : "Checking Academic Records...";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-[#F7F9FC]">
      {/* Original loading spinner layout */}
      <div className="w-10 h-10 rounded border-2 border-[#0F7A3D] border-t-transparent animate-spin"></div>
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-slate-650">{titleText}</p>
        <p className="text-[10px] text-slate-450 font-semibold">{subText}</p>
      </div>
    </div>
  );
}
