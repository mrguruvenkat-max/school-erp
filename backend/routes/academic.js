const express = require('express');
const router = express.Router();
const { prisma } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 1. Get classes list
router.get('/classes', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.class.findMany({
      orderBy: { grade: 'asc' }
    });
    res.json(list);
  } catch (error) {
    console.error("Fetch classes error:", error);
    res.status(500).json({ error: "Internal server error fetching classes" });
  }
});

// 2. Get subjects list
router.get('/subjects', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.subject.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(list);
  } catch (error) {
    console.error("Fetch subjects error:", error);
    res.status(500).json({ error: "Internal server error fetching subjects" });
  }
});

// Get teachers list
router.get('/teachers', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.teacher.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(list);
  } catch (error) {
    console.error("Fetch teachers error:", error);
    res.status(500).json({ error: "Internal server error fetching teachers" });
  }
});

// 3. Get timetable for a class
router.get('/timetable/:classId', authenticateToken, async (req, res) => {
  const { classId } = req.params;

  try {
    const classIdInt = parseInt(classId);
    const schedule = await prisma.timetable.findMany({
      where: { classId: classIdInt },
      include: {
        subject: true,
        teacher: true
      },
      orderBy: { period: 'asc' }
    });

    res.json(schedule);
  } catch (error) {
    console.error("Fetch timetable error:", error);
    res.status(500).json({ error: "Internal server error fetching timetable" });
  }
});

// 4. Get Notice Board / Announcements
router.get('/notices', authenticateToken, async (req, res) => {
  try {
    // Notice board entries correspond to notifications with null userId and category NOTICE_BOARD
    const list = await prisma.notification.findMany({
      where: {
        userId: null,
        category: "NOTICE_BOARD"
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(list);
  } catch (error) {
    console.error("Fetch notices error:", error);
    res.status(500).json({ error: "Internal server error fetching notices" });
  }
});

// 5. Post Announcement (Principal / Admin Only)
router.post('/notices', authenticateToken, requireRole(['PRINCIPAL']), async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  try {
    const notice = await prisma.notification.create({
      data: {
        userId: null, // Global broadcast
        title,
        content,
        category: "NOTICE_BOARD"
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "NOTICE_CREATE",
        userRole: req.user.role,
        username: req.user.username,
        details: `Published notice: "${title}"`
      }
    });

    res.json({ success: true, notice });
  } catch (error) {
    console.error("Create notice error:", error);
    res.status(500).json({ error: "Internal server error publishing notice" });
  }
});

// 6. User Specific Notifications Fetch
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.notification.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(list);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ error: "Internal server error fetching notifications" });
  }
});

// 7. Update Class Timetable (Computer Operator Only)
router.post('/timetable/update', authenticateToken, requireRole(['COMPUTER_OPERATOR']), async (req, res) => {
  const { classId, dayOfWeek, period, subjectId, teacherId } = req.body;

  if (!classId || !dayOfWeek || !period || !subjectId || !teacherId) {
    return res.status(400).json({ error: "Missing required timetable fields" });
  }

  try {
    const classIdInt = parseInt(classId);
    const periodInt = parseInt(period);
    const subjectIdInt = parseInt(subjectId);
    const teacherIdInt = parseInt(teacherId);

    // Find if a record exists for classId, dayOfWeek, period
    const existing = await prisma.timetable.findFirst({
      where: {
        classId: classIdInt,
        dayOfWeek: dayOfWeek.toUpperCase(),
        period: periodInt
      }
    });

    let record;
    if (existing) {
      record = await prisma.timetable.update({
        where: { id: existing.id },
        data: {
          subjectId: subjectIdInt,
          teacherId: teacherIdInt
        }
      });
    } else {
      record = await prisma.timetable.create({
        data: {
          classId: classIdInt,
          dayOfWeek: dayOfWeek.toUpperCase(),
          period: periodInt,
          subjectId: subjectIdInt,
          teacherId: teacherIdInt
        }
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "TIMETABLE_UPDATE",
        userRole: req.user.role,
        username: req.user.username,
        details: `Updated timetable for Class ID ${classIdInt}, Day: ${dayOfWeek}, Period: ${periodInt}`
      }
    });

    res.json({ success: true, timetable: record });
  } catch (error) {
    console.error("Update timetable error:", error);
    res.status(500).json({ error: "Internal server error updating timetable" });
  }
});

// 8. Upload Student Marks (Computer Operator & Teacher)
router.post('/marks/upload', authenticateToken, requireRole(['COMPUTER_OPERATOR', 'TEACHER']), async (req, res) => {
  const { studentId, subjectId, examType, marksObtained, maxMarks } = req.body;

  if (!studentId || !subjectId || !examType || marksObtained === undefined || !maxMarks) {
    return res.status(400).json({ error: "Missing required marks fields" });
  }

  try {
    const studentIdInt = parseInt(studentId);
    const subjectIdInt = parseInt(subjectId);
    const marksObtainedFloat = parseFloat(marksObtained);
    const maxMarksFloat = parseFloat(maxMarks);

    // Find if a record exists for studentId, subjectId, examType
    const existing = await prisma.mark.findFirst({
      where: {
        studentId: studentIdInt,
        subjectId: subjectIdInt,
        examType: examType.toUpperCase()
      }
    });

    let record;
    if (existing) {
      record = await prisma.mark.update({
        where: { id: existing.id },
        data: {
          marksObtained: marksObtainedFloat,
          maxMarks: maxMarksFloat
        }
      });
    } else {
      record = await prisma.mark.create({
        data: {
          studentId: studentIdInt,
          subjectId: subjectIdInt,
          examType: examType.toUpperCase(),
          marksObtained: marksObtainedFloat,
          maxMarks: maxMarksFloat
        }
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "MARKS_UPLOAD",
        userRole: req.user.role,
        username: req.user.username,
        details: `Uploaded marks for Student ID ${studentIdInt}, Subject ID ${subjectIdInt}, Exam: ${examType}`
      }
    });

    res.json({ success: true, mark: record });
  } catch (error) {
    console.error("Upload marks error:", error);
    res.status(500).json({ error: "Internal server error uploading marks" });
  }
});

module.exports = router;
