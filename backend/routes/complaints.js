const express = require('express');
const router = express.Router();
const { prisma } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 1. Get complaints list (filter by studentId if role is STUDENT)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let list;
    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { userId: req.user.id }
      });
      if (!student) return res.json([]);
      
      list = await prisma.complaint.findMany({
        where: { studentId: student.id },
        include: { student: true },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Principal/Operator gets all
      list = await prisma.complaint.findMany({
        include: { student: { include: { class: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }
    res.json(list);
  } catch (error) {
    console.error("Fetch complaints error:", error);
    res.status(500).json({ error: "Internal server error fetching complaints" });
  }
});

// 2. Submit feedback / complaint (Student Only)
router.post('/', authenticateToken, requireRole(['STUDENT']), async (req, res) => {
  const { type, details } = req.body;

  if (!type || !details) {
    return res.status(400).json({ error: "Missing complaint type or details" });
  }

  try {
    const student = await prisma.student.findFirst({
      where: { userId: req.user.id }
    });

    if (!student) {
      return res.status(403).json({ error: "Student profile not found" });
    }

    const complaint = await prisma.complaint.create({
      data: {
        studentId: student.id,
        type,
        details,
        status: "PENDING"
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "COMPLAINT_CREATE",
        userRole: req.user.role,
        username: req.user.username,
        details: `Submitted a ${type} complaint: "${details.substring(0, 50)}..."`
      }
    });

    res.json({ success: true, complaint });

  } catch (error) {
    console.error("Submit complaint error:", error);
    res.status(500).json({ error: "Internal server error submitting complaint" });
  }
});

// 3. Resolve Complaint (Principal Only)
router.post('/resolve', authenticateToken, requireRole(['PRINCIPAL']), async (req, res) => {
  const { complaintId, status } = req.body; // status: "UNDER_REVIEW" or "RESOLVED"

  if (!complaintId || !status) {
    return res.status(400).json({ error: "Missing complaintId or status" });
  }

  try {
    const cId = parseInt(complaintId);
    
    const updated = await prisma.complaint.update({
      where: { id: cId },
      data: { status },
      include: { student: true }
    });

    // Notify student about resolution
    if (updated.student && updated.student.userId) {
      await prisma.notification.create({
        data: {
          userId: updated.student.userId,
          title: "Complaint Status Update",
          content: `Your complaint regarding ${updated.type.replace(/_/g, ' ')} has been marked as ${status}.`,
          category: "GENERAL"
        }
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "COMPLAINT_RESOLVE",
        userRole: req.user.role,
        username: req.user.username,
        details: `Updated complaint ID ${cId} status to ${status}`
      }
    });

    res.json({ success: true, complaint: updated });

  } catch (error) {
    console.error("Resolve complaint error:", error);
    res.status(500).json({ error: "Internal server error resolving complaint" });
  }
});

module.exports = router;
