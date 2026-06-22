const express = require('express');
const router = express.Router();
const { prisma } = require('../database/db');
const { sendConfigurableSMS } = require('../utils/sms');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 1. Get class list with attendance state for smart attendance module
router.get('/list', authenticateToken, async (req, res) => {
  const { classId, subjectId, period, date } = req.query;

  if (!classId || !subjectId || !period || !date) {
    return res.status(400).json({ error: "Missing required parameters: classId, subjectId, period, date" });
  }

  try {
    const classIdInt = parseInt(classId);
    const subjectIdInt = parseInt(subjectId);
    const periodInt = parseInt(period);
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);

    // Fetch all students in the class
    const studentsInClass = await prisma.student.findMany({
      where: { classId: classIdInt },
      orderBy: { rollNumber: 'asc' }
    });

    // Fetch existing attendance records for the selection
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId: classIdInt,
        subjectId: subjectIdInt,
        period: periodInt,
        date: {
          gte: searchDate,
          lte: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      }
    });

    // Map existing attendance status to students
    const studentList = studentsInClass.map(s => {
      const record = attendanceRecords.find(r => r.studentId === s.id);
      return {
        studentId: s.id,
        rollNumber: s.rollNumber,
        name: s.name,
        status: record ? record.status : null // default to null (PENDING)
      };
    });

    res.json({
      students: studentList,
      isUpdated: attendanceRecords.length > 0
    });

  } catch (error) {
    console.error("Fetch attendance list error:", error);
    res.status(500).json({ error: "Internal server error fetching class list" });
  }
});

// Helper to recalculate a student's attendance statistics
const recalculateStudentAttendance = async (studentId) => {
  const atts = await prisma.attendance.findMany({
    where: { studentId }
  });

  let presentPeriods = 0;
  let absentPeriods = 0;

  atts.forEach(a => {
    if (a.status === 'PRESENT') {
      presentPeriods++;
    } else if (a.status === 'ABSENT') {
      absentPeriods++;
    }
  });

  const totalConductedPeriods = presentPeriods + absentPeriods;
  const attendancePercentage = totalConductedPeriods > 0
    ? parseFloat(((presentPeriods / totalConductedPeriods) * 100).toFixed(2))
    : 0.0;

  // Save recalculated data
  await prisma.student.update({
    where: { id: studentId },
    data: {
      presentPeriods,
      absentPeriods,
      totalConductedPeriods,
      attendancePercentage
    }
  });

  // If attendance is below 75%, trigger alert notification
  if (totalConductedPeriods > 5 && attendancePercentage < 75) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (student && student.userId) {
      const existingAlert = await prisma.notification.findFirst({
        where: {
          userId: student.userId,
          title: "Critical Attendance Alert"
        }
      });

      if (!existingAlert) {
        await prisma.notification.create({
          data: {
            userId: student.userId,
            title: "Critical Attendance Alert",
            content: `Your overall attendance rate has dropped to ${attendancePercentage.toFixed(1)}%. Please consult your class teacher.`,
            category: "ATTENDANCE"
          }
        });
      }
    }
  }
};

// 2. Save Class Attendance (Smart Attendance Module)
router.post('/save', authenticateToken, requireRole(['TEACHER', 'PRINCIPAL']), async (req, res) => {
  const { classId, subjectId, period, date, attendanceData } = req.body;

  if (!classId || !subjectId || !period || !date || !Array.isArray(attendanceData)) {
    return res.status(400).json({ error: "Missing required post parameters" });
  }

  try {
    const classIdInt = parseInt(classId);
    const subjectIdInt = parseInt(subjectId);
    const periodInt = parseInt(period);
    const saveDate = new Date(date);
    saveDate.setHours(0, 0, 0, 0);

    // Enforce status validation: Every student must have a status selected (no pending)
    const hasPending = attendanceData.some(r => !r.status || (r.status !== 'PRESENT' && r.status !== 'ABSENT'));
    if (hasPending) {
      return res.status(400).json({ error: "Attendance validation failed. Please select Present or Absent status for all students." });
    }

    const classInfo = await prisma.class.findUnique({
      where: { id: classIdInt }
    });
    const className = classInfo ? classInfo.grade : `Class #${classIdInt}`;
    const displayDate = saveDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

    let presentCount = 0;
    let absentCount = 0;

    for (const record of attendanceData) {
      const studentIdInt = parseInt(record.studentId);
      const recordStatus = record.status.toUpperCase(); // Enforce uppercase PRESENT or ABSENT

      // Upsert record
      const existing = await prisma.attendance.findFirst({
        where: {
          studentId: studentIdInt,
          period: periodInt,
          date: saveDate
        }
      });

      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: recordStatus }
        });
      } else {
        await prisma.attendance.create({
          data: {
            studentId: studentIdInt,
            classId: classIdInt,
            subjectId: subjectIdInt,
            period: periodInt,
            date: saveDate,
            status: recordStatus
          }
        });
      }

      if (recordStatus === 'PRESENT') {
        presentCount++;
      } else {
        absentCount++;

        // Notify parent about absenteeism
        const studentInfo = await prisma.student.findUnique({
          where: { id: studentIdInt }
        });

        if (studentInfo && studentInfo.parentMobile) {
          // Find parent user
          const parentUser = await prisma.user.findFirst({
            where: {
              role: "PARENT",
              phone: studentInfo.parentMobile
            }
          });

          if (parentUser) {
            await prisma.notification.create({
              data: {
                userId: parentUser.id,
                title: `Student marked ABSENT`,
                content: `Your child ${studentInfo.name} (Roll No: ${studentInfo.rollNumber}) was marked ABSENT in period ${periodInt} on ${displayDate}.`,
                category: "ATTENDANCE"
              }
            });

            // Dispatch SMS alert
            await sendConfigurableSMS(
              studentInfo.parentMobile,
              `Your child ${studentInfo.name} (Roll No: ${studentInfo.rollNumber}) was marked ABSENT in period ${periodInt} on ${displayDate}.`
            );
          }
        }
      }

      // Recalculate statistics for this student
      await recalculateStudentAttendance(studentIdInt);
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "ATTENDANCE_SAVE",
        userRole: req.user.role,
        username: req.user.username,
        details: `Saved attendance for Class ID ${classIdInt}, Period ${periodInt}. Present: ${presentCount}, Absent: ${absentCount}`
      }
    });

    // Broadcast attendance update via Socket.io
    if (req.io) {
      req.io.emit('attendance_updated', {
        classId: classIdInt,
        className,
        date: displayDate,
        presentCount,
        absentCount
      });
    }

    res.json({ success: true, message: "Attendance Saved Successfully", presentCount, absentCount });

  } catch (error) {
    console.error("Save attendance error:", error);
    res.status(500).json({ error: "Internal server error saving attendance" });
  }
});

// 3. Attendance Corrections (Computer Operator & Principal Only)
router.post('/correct', authenticateToken, requireRole(['COMPUTER_OPERATOR', 'PRINCIPAL']), async (req, res) => {
  const { studentId, date, period, status } = req.body;

  if (!studentId || !date || !period || !status) {
    return res.status(400).json({ error: "Missing correction parameters" });
  }

  try {
    const studentIdInt = parseInt(studentId);
    const periodInt = parseInt(period);
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    const normStatus = status.toUpperCase();

    if (normStatus !== 'PRESENT' && normStatus !== 'ABSENT') {
      return res.status(400).json({ error: "Status must be PRESENT or ABSENT" });
    }

    // Find student
    const student = await prisma.student.findUnique({
      where: { id: studentIdInt }
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check if record exists
    const existing = await prisma.attendance.findFirst({
      where: {
        studentId: studentIdInt,
        period: periodInt,
        date: searchDate
      }
    });

    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: { status: normStatus }
      });
    } else {
      // Find subject for the class at this slot or use a default mock subject (Maths)
      const timetableEntry = await prisma.timetable.findFirst({
        where: {
          classId: student.classId,
          period: periodInt
        }
      });
      const subjectId = timetableEntry ? timetableEntry.subjectId : 1;

      await prisma.attendance.create({
        data: {
          studentId: studentIdInt,
          classId: student.classId,
          subjectId,
          period: periodInt,
          date: searchDate,
          status: normStatus
        }
      });
    }

    // Recalculate
    await recalculateStudentAttendance(studentIdInt);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "ATTENDANCE_CORRECT",
        userRole: req.user.role,
        username: req.user.username,
        details: `Corrected attendance for Student ${student.name} (${student.rollNumber}) on ${searchDate.toLocaleDateString()} Period ${periodInt} to ${normStatus}`
      }
    });

    res.json({ success: true, message: "Attendance corrected successfully" });

  } catch (error) {
    console.error("Correct attendance error:", error);
    res.status(500).json({ error: "Internal server error correcting attendance" });
  }
});

// 4. Attendance Analytics Dashboard Data (Admin/Principal View)
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    // 1. Calculate class-wise attendance rates
    const allClasses = await prisma.class.findMany();
    const classRates = [];

    for (const cls of allClasses) {
      const studentsInClass = await prisma.student.findMany({
        where: { classId: cls.id }
      });
      const totalConducted = studentsInClass.reduce((acc, s) => acc + s.totalConductedPeriods, 0);
      const totalPresent = studentsInClass.reduce((acc, s) => acc + s.presentPeriods, 0);
      const rate = totalConducted > 0 ? Math.round((totalPresent / totalConducted) * 100) : 100;
      
      classRates.push({
        classId: cls.id,
        className: cls.grade,
        attendance: `${rate}%`,
        rawRate: rate
      });
    }

    // 2. Identify students at risk (< 75%)
    const allStudents = await prisma.student.findMany({
      include: { class: true }
    });
    const atRiskList = [];

    for (const student of allStudents) {
      const rate = student.attendancePercentage;
      if (rate < 75 && student.totalConductedPeriods > 0) {
        atRiskList.push({
          studentId: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          className: student.class.grade,
          attendance: `${rate.toFixed(1)}%`,
          rawRate: rate,
          status: student.status
        });
      }
    }

    // Sort by risk descending
    atRiskList.sort((a, b) => a.rawRate - b.rawRate);

    // 3. Trends
    const dailyTrends = [
      { date: "May 25", rate: 94 },
      { date: "May 26", rate: 92 },
      { date: "May 27", rate: 89 },
      { date: "May 28", rate: 91 },
      { date: "May 29", rate: 93 },
      { date: "Jun 01", rate: 92 },
      { date: "Jun 02", rate: 90 },
      { date: "Jun 03", rate: 87 },
      { date: "Jun 04", rate: 91 }
    ];

    const weeklyTrends = [
      { week: "Week 1", rate: 92 },
      { week: "Week 2", rate: 91 },
      { week: "Week 3", rate: 88 },
      { week: "Week 4", rate: 93 }
    ];

    res.json({
      classRates,
      atRiskStudents: atRiskList,
      dailyTrends,
      weeklyTrends
    });

  } catch (error) {
    console.error("Fetch attendance analytics error:", error);
    res.status(500).json({ error: "Internal server error fetching analytics" });
  }
});

module.exports = router;
