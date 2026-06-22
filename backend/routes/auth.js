const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'ap_gov_school_secret_2026_key_9876';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'ap_gov_school_refresh_secret_2026_key_5432';

// Helper to generate access and refresh tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// 1. Portal Login (Supports student roll number + DOB, parent mobile number + password, and staff username + password)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Credentials are required" });
  }

  try {
    // A. Check if it is a student logging in with Roll Number and DOB
    const student = await prisma.student.findUnique({
      where: { rollNumber: username.trim() }
    });

    if (student) {
      // DOB verification (format: e.g. "06062007")
      if (student.dob === password.trim()) {
        let user = await prisma.user.findUnique({
          where: { username: student.rollNumber }
        });
        if (!user) {
          // Lazily create User record to maintain compatibility with complaints/notifications
          user = await prisma.user.create({
            data: {
              username: student.rollNumber,
              passwordHash: bcrypt.hashSync(student.dob, 10),
              role: "STUDENT",
              name: student.name
            }
          });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        await prisma.auditLog.create({
          data: {
            action: "USER_LOGIN",
            userRole: "STUDENT",
            username: user.username,
            details: `Student ${student.name} logged in successfully via Roll Number & DOB.`
          }
        });

        return res.json({
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            username: user.username,
            role: "STUDENT",
            name: user.name,
            studentId: student.id,
            teacherId: null
          }
        });
      } else {
        return res.status(401).json({ error: "Invalid roll number or date of birth" });
      }
    }

    // B. Check if it is a parent logging in with Mobile Number and Password
    const parent = await prisma.parent.findUnique({
      where: { mobile: username.trim() },
      include: { user: true }
    });

    if (parent) {
      const isValid = bcrypt.compareSync(password.trim(), parent.passwordHash);
      if (isValid) {
        let user = parent.user;
        if (!user) {
          user = await prisma.user.create({
            data: {
              username: parent.mobile,
              passwordHash: parent.passwordHash,
              role: "PARENT",
              phone: parent.mobile,
              name: parent.name
            }
          });
          await prisma.parent.update({
            where: { id: parent.id },
            data: { userId: user.id }
          });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        await prisma.auditLog.create({
          data: {
            action: "USER_LOGIN",
            userRole: "PARENT",
            username: user.username,
            details: `Parent of ${parent.name} logged in successfully via Mobile Number.`
          }
        });

        // Find student associated with this parent
        const studentInfo = await prisma.student.findFirst({
          where: { parentId: parent.id }
        });

        return res.json({
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            username: user.username,
            role: "PARENT",
            name: user.name,
            phone: user.phone,
            studentId: studentInfo ? studentInfo.id : null,
            teacherId: null
          }
        });
      } else {
        return res.status(401).json({ error: "Invalid mobile number or password" });
      }
    }

    // C. Regular username/password verification (Principal, Operator, Teacher)
    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
      include: {
        teacherProfile: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const allowedRoles = ['PRINCIPAL', 'TEACHER', 'COMPUTER_OPERATOR'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Access denied. Role not authorized." });
    }

    const isValid = bcrypt.compareSync(password.trim(), user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "USER_LOGIN",
        userRole: user.role,
        username: user.username,
        details: `Successfully logged in staff member: ${user.username} (${user.role}).`
      }
    });

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        phone: user.phone,
        studentId: null,
        teacherId: user.teacherProfile ? user.teacherProfile.id : null
      }
    });

  } catch (error) {
    console.error("Auth login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// 2. Token Refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Refresh token is invalid or expired" });
    }

    const accessToken = jwt.sign(
      { id: decoded.id, username: decoded.username, role: decoded.role, name: decoded.name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ accessToken });
  });
});

// 3. Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { role, identifier } = req.body;

  if (!role || !identifier) {
    return res.status(400).json({ error: "Role and registered identifier are required" });
  }

  try {
    let targetName = "";
    if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { mobile: identifier.trim() }
      });
      if (!parent) return res.status(404).json({ error: "No parent account found with this mobile number" });
      targetName = parent.name;
    } else if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { rollNumber: identifier.trim() }
      });
      if (!student) return res.status(404).json({ error: "No student profile found with this roll number" });
      targetName = student.name;
    } else {
      const user = await prisma.user.findFirst({
        where: { role, username: identifier.trim() }
      });
      if (!user) return res.status(404).json({ error: "No staff profile found with this username" });
      targetName = user.name;
    }

    return res.json({
      success: true,
      message: `Password reset verified for ${targetName}. Enter new credentials to reset.`
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error during forgot password" });
  }
});

// 4. Reset Password
router.post('/reset-password', async (req, res) => {
  const { role, identifier, newPassword } = req.body;

  if (!role || !identifier || !newPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashed = bcrypt.hashSync(newPassword.trim(), 10);

    if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { mobile: identifier.trim() }
      });
      if (!parent) return res.status(404).json({ error: "No parent found matching mobile number" });

      await prisma.parent.update({
        where: { id: parent.id },
        data: { passwordHash: hashed }
      });

      if (parent.userId) {
        await prisma.user.update({
          where: { id: parent.userId },
          data: { passwordHash: hashed }
        });
      }
    } else if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { rollNumber: identifier.trim() }
      });
      if (!student) return res.status(404).json({ error: "No student found matching roll number" });

      await prisma.student.update({
        where: { id: student.id },
        data: { dob: newPassword.trim() } // Student password is their DOB
      });

      if (student.userId) {
        await prisma.user.update({
          where: { id: student.userId },
          data: { passwordHash: bcrypt.hashSync(newPassword.trim(), 10) }
        });
      }
    } else {
      const user = await prisma.user.findFirst({
        where: { role, username: identifier.trim() }
      });
      if (!user) return res.status(404).json({ error: "No user found matching username" });

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashed }
      });
    }

    await prisma.auditLog.create({
      data: {
        action: "PASSWORD_RESET",
        userRole: role,
        username: identifier,
        details: `Password has been reset successfully for role ${role}.`
      }
    });

    return res.json({
      success: true,
      message: "Password has been reset successfully."
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error during password reset" });
  }
});

module.exports = router;
