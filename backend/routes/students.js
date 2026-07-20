const express = require('express');
const router = express.Router();
const { prisma } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// 1. Get all students (with class filter)
router.get('/list', authenticateToken, async (req, res) => {
  const { classId } = req.query;

  try {
    const filters = {};
    if (classId) filters.classId = parseInt(classId);

    const studentList = await prisma.student.findMany({
      where: filters,
      include: {
        class: true,
        parent: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(studentList);
  } catch (error) {
    console.error("List students error:", error);
    res.status(500).json({ error: "Internal server error listing students" });
  }
});

// 2. Get Single Student Profile and Academic Details
router.get('/profile/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const studentIdInt = parseInt(id);

    const student = await prisma.student.findUnique({
      where: { id: studentIdInt },
      include: {
        class: true,
        parent: true,
        certificates: true
      }
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Fetch marks
    const studentMarks = await prisma.mark.findMany({
      where: { studentId: studentIdInt },
      include: { subject: true }
    });

    // Use precomputed attendance rate from Student model
    const attRecords = await prisma.attendance.findMany({
      where: { studentId: studentIdInt }
    });

    const attendancePercentage = student ? student.attendancePercentage : 0;

    // Group attendance by date for calendar view
    const dateMap = {};
    attRecords.forEach(r => {
      const dateObj = new Date(r.date);
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { present: 0, absent: 0, details: [] };
      }
      if (r.status === 'PRESENT') {
        dateMap[dateStr].present++;
      } else {
        dateMap[dateStr].absent++;
      }
      dateMap[dateStr].details.push({
        period: r.period,
        status: r.status,
        subjectId: r.subjectId
      });
    });

    const calendarView = Object.keys(dateMap).map(date => ({
      date,
      status: dateMap[date].absent > dateMap[date].present ? 'ABSENT' : 'PRESENT',
      presentCount: dateMap[date].present,
      absentCount: dateMap[date].absent,
      details: dateMap[date].details
    }));

    res.json({
      student,
      attendancePercentage,
      calendarView,
      marks: studentMarks
    });

  } catch (error) {
    console.error("Fetch student profile error:", error);
    res.status(500).json({ error: "Internal server error fetching student profile" });
  }
});

// 3. Transfer Certificate (TC) & Bonafide / Study / Attendance Certificate Generation
router.post('/certificate/generate', authenticateToken, requireRole(['PRINCIPAL', 'COMPUTER_OPERATOR']), async (req, res) => {
  const { studentId, type } = req.body; // type: "TRANSFER_CERTIFICATE", "BONAFIDE", "STUDY", "ATTENDANCE"

  if (!studentId || !type) {
    return res.status(400).json({ error: "Missing studentId or certificate type" });
  }

  try {
    const sId = parseInt(studentId);
    const student = await prisma.student.findUnique({
      where: { id: sId },
      include: { class: true }
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Generate unique certificate number
    const prefixes = {
      TRANSFER_CERTIFICATE: "TC",
      BONAFIDE: "BON",
      STUDY: "STU",
      ATTENDANCE: "ATT"
    };
    const prefix = prefixes[type] || "CERT";
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const certNo = `${prefix}/${year}/${rand}`;

    const cert = await prisma.certificate.create({
      data: {
        studentId: sId,
        type,
        certNo
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "CERTIFICATE_GENERATE",
        userRole: req.user.role,
        username: req.user.username,
        details: `Generated ${type} (No: ${certNo}) for student ${student.name} (${student.rollNumber})`
      }
    });

    res.json({
      success: true,
      message: `${type.replace(/_/g, ' ')} generated successfully.`,
      certificate: {
        id: cert.id,
        certNo: cert.certNo,
        type: cert.type,
        issuedAt: cert.issuedAt,
        studentName: student.name,
        rollNumber: student.rollNumber,
        className: student.class.grade,
        parentName: student.parentName,
        parentMobile: student.parentMobile
      }
    });

  } catch (error) {
    console.error("Certificate generation error:", error);
    res.status(500).json({ error: "Internal server error generating certificate" });
  }
});

// 4. Get certificates issued
router.get('/certificates', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.certificate.findMany({
      include: { student: { include: { class: true } } },
      orderBy: { issuedAt: 'desc' }
    });
    res.json(list);
  } catch (error) {
    console.error("Fetch certificates error:", error);
    res.status(500).json({ error: "Internal server error fetching certificates list" });
  }
});

// ==========================================
// ADMINISTRATIVE USER MANAGEMENT ENDPOINTS
// ==========================================

// 5. Get all users (Exclude passwordHash)
router.get('/users', authenticateToken, requireRole(['PRINCIPAL']), async (req, res) => {
  try {
    const usersList = await prisma.user.findMany({
      include: {
        teacherProfile: true,
        parentProfile: true
      },
      orderBy: { id: 'asc' }
    });

    const sanitizedList = usersList.map(u => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    res.json(sanitizedList);
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).json({ error: "Internal server error listing users" });
  }
});

// 6. Create User account
router.post('/users/create', authenticateToken, requireRole(['PRINCIPAL']), async (req, res) => {
  const { username, password, role, name, phone } = req.body;

  if (!username || !password || !role || !name) {
    return res.status(400).json({ error: "Missing required fields (username, password, role, name)" });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
        name,
        phone
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "USER_CREATE",
        userRole: req.user.role,
        username: req.user.username,
        details: `Created user ${username} with role ${role}`
      }
    });

    const { passwordHash: ph, ...sanitized } = newUser;
    res.json({ success: true, user: sanitized });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Internal server error creating user" });
  }
});

// 7. Update User account
router.post('/users/update', authenticateToken, requireRole(['PRINCIPAL']), async (req, res) => {
  const { id, username, password, role, name, phone } = req.body;

  if (!id || !username || !role || !name) {
    return res.status(400).json({ error: "Missing required fields (id, username, role, name)" });
  }

  try {
    const userId = parseInt(id);
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    const data = {
      username,
      role,
      name,
      phone
    };

    if (password) {
      data.passwordHash = bcrypt.hashSync(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "USER_UPDATE",
        userRole: req.user.role,
        username: req.user.username,
        details: `Updated user account ID ${userId} (${username})`
      }
    });

    const { passwordHash: ph, ...sanitized } = updated;
    res.json({ success: true, user: sanitized });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Internal server error updating user" });
  }
});

// 8. Delete User account
router.delete('/users/delete/:id', authenticateToken, requireRole(['PRINCIPAL']), async (req, res) => {
  const { id } = req.params;

  try {
    const userId = parseInt(id);
    const deleted = await prisma.user.delete({
      where: { id: userId }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "USER_DELETE",
        userRole: req.user.role,
        username: req.user.username,
        details: `Deleted user account ID ${userId} (${deleted.username})`
      }
    });

    res.json({ success: true, message: `User deleted successfully` });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error deleting user" });
  }
});

// ==========================================
// ADMINISTRATIVE STUDENT PROFILE ENDPOINTS
// ==========================================

// 9. Create Student Profile (Admission Module)
router.post('/create', authenticateToken, requireRole(['PRINCIPAL', 'COMPUTER_OPERATOR']), async (req, res) => {
  const {
    rollNumber, name, classId, dob, gender, parentName, parentMobile, address, admissionNumber
  } = req.body;

  // Strict required fields verification
  if (!rollNumber || !name || !classId || !dob || !gender || !parentName || !parentMobile || !address || !admissionNumber) {
    return res.status(400).json({ error: "Missing required student admission fields. Student Name, Roll Number, Class, DOB, Gender, Parent Name, Parent Mobile, Address, and Admission Number are all required." });
  }

  try {
    // Unique roll number check
    const existingRoll = await prisma.student.findUnique({ where: { rollNumber: rollNumber.trim() } });
    if (existingRoll) {
      return res.status(400).json({ error: "A student with this roll number already exists." });
    }

    // Unique admission number check
    const existingAdm = await prisma.student.findUnique({ where: { admissionNumber: admissionNumber.trim() } });
    if (existingAdm) {
      return res.status(400).json({ error: "A student with this admission number already exists." });
    }

    // Ensure Parent record exists or create one lazily
    let parent = await prisma.parent.findUnique({
      where: { mobile: parentMobile.trim() }
    });

    if (!parent) {
      parent = await prisma.parent.create({
        data: {
          name: parentName.trim(),
          mobile: parentMobile.trim(),
          passwordHash: bcrypt.hashSync(parentMobile.trim(), 10) // default password set to mobile number
        }
      });
    }

    const data = {
      rollNumber: rollNumber.trim(),
      name: name.trim(),
      classId: parseInt(classId),
      dob: dob.trim(),
      gender: gender.trim(),
      parentName: parentName.trim(),
      parentMobile: parentMobile.trim(),
      address: address.trim(),
      admissionNumber: admissionNumber.trim(),
      parentId: parent.id,
      presentPeriods: 0,
      absentPeriods: 0,
      totalConductedPeriods: 0,
      attendancePercentage: 0
    };

    const newStudent = await prisma.student.create({
      data,
      include: { class: true }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "STUDENT_CREATE",
        userRole: req.user.role,
        username: req.user.username,
        details: `Admitted Student: ${name} (Roll: ${rollNumber}, Class: ${newStudent.class.grade})`
      }
    });

    res.json({ success: true, student: newStudent });
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({ error: "Internal server error creating student profile" });
  }
});

// 10. Update Student Profile
router.post('/update', authenticateToken, requireRole(['PRINCIPAL', 'COMPUTER_OPERATOR']), async (req, res) => {
  const {
    id, rollNumber, name, classId, dob, gender, parentName, parentMobile, address, admissionNumber
  } = req.body;

  if (!id || !rollNumber || !name || !classId || !dob || !gender || !parentName || !parentMobile || !address || !admissionNumber) {
    return res.status(400).json({ error: "Missing required fields to update student profile" });
  }

  try {
    const studentId = parseInt(id);
    const existing = await prisma.student.findUnique({ where: { id: studentId } });
    if (!existing) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    // Ensure Parent record exists
    let parent = await prisma.parent.findUnique({
      where: { mobile: parentMobile.trim() }
    });

    if (!parent) {
      parent = await prisma.parent.create({
        data: {
          name: parentName.trim(),
          mobile: parentMobile.trim(),
          passwordHash: bcrypt.hashSync(parentMobile.trim(), 10)
        }
      });
    }

    const data = {
      rollNumber: rollNumber.trim(),
      name: name.trim(),
      classId: parseInt(classId),
      dob: dob.trim(),
      gender: gender.trim(),
      parentName: parentName.trim(),
      parentMobile: parentMobile.trim(),
      address: address.trim(),
      admissionNumber: admissionNumber.trim(),
      parentId: parent.id
    };

    const updated = await prisma.student.update({
      where: { id: studentId },
      data,
      include: { class: true }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "STUDENT_UPDATE",
        userRole: req.user.role,
        username: req.user.username,
        details: `Updated Student Profile: ${name} (${rollNumber})`
      }
    });

    res.json({ success: true, student: updated });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ error: "Internal server error updating student profile" });
  }
});

// 11. Delete Student Profile
router.delete('/delete/:id', authenticateToken, requireRole(['PRINCIPAL', 'COMPUTER_OPERATOR']), async (req, res) => {
  const { id } = req.params;

  try {
    const studentId = parseInt(id);
    const deleted = await prisma.student.delete({
      where: { id: studentId }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "STUDENT_DELETE",
        userRole: req.user.role,
        username: req.user.username,
        details: `Deleted Student Profile: ${deleted.name} (${deleted.rollNumber})`
      }
    });

    res.json({ success: true, message: `Student profile deleted successfully` });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ error: "Internal server error deleting student profile" });
  }
});

module.exports = router;
