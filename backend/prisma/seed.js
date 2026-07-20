const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // 1. Seed Classes
  const grades = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
  ];

  const classes = [];
  for (const grade of grades) {
    const cls = await prisma.class.upsert({
      where: { grade },
      update: {},
      create: { grade }
    });
    classes.push(cls);
  }
  console.log(`Seeded ${classes.length} classes.`);

  // 2. Seed Subjects
  const subjectNames = ['Maths', 'Science', 'English', 'Telugu', 'Social'];
  const subjects = [];
  for (const name of subjectNames) {
    const sub = await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    subjects.push(sub);
  }
  console.log(`Seeded ${subjects.length} subjects.`);

  // Password hash for 'admin'
  const adminPasswordHash = bcrypt.hashSync('admin', 10);

  // 3. Seed Principal User
  const principalUser = await prisma.user.upsert({
    where: { username: 'principal' },
    update: {},
    create: {
      username: 'principal',
      passwordHash: adminPasswordHash,
      role: 'PRINCIPAL',
      name: 'Principal Shanti',
      phone: '9988776655'
    }
  });
  console.log('Seeded Principal user.');

  // 4. Seed Computer Operator User
  const operatorUser = await prisma.user.upsert({
    where: { username: 'operator' },
    update: {},
    create: {
      username: 'operator',
      passwordHash: adminPasswordHash,
      role: 'COMPUTER_OPERATOR',
      name: 'Operator Murthy',
      phone: '8877665544'
    }
  });
  console.log('Seeded Computer Operator user.');

  // 5. Seed Teachers
  const teacherData = [
    { name: 'K. Ranga Rao', username: 'teacher1', role: 'SUBJECT_TEACHER' },
    { name: 'Smt. P. Lakshmi', username: 'teacher2', role: 'CLASS_TEACHER' },
    { name: 'Ch. Ram Babu', username: 'teacher3', role: 'LAB_FACULTY' }
  ];

  for (const t of teacherData) {
    const user = await prisma.user.upsert({
      where: { username: t.username },
      update: {},
      create: {
        username: t.username,
        passwordHash: adminPasswordHash,
        role: 'TEACHER',
        name: t.name
      }
    });

    const teacherProfile = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        name: t.name,
        role: t.role,
        userId: user.id
      }
    });

    console.log(`Seeded Teacher: ${t.name} (profile ID: ${teacherProfile.id})`);
  }

  // 6. Seed some default Timetable schedules for Class 10 (Class ID = last class usually, or let's use the first class)
  const class10 = classes.find(c => c.grade === 'Class 10');
  const class9 = classes.find(c => c.grade === 'Class 9');
  
  if (class10) {
    const maths = subjects.find(s => s.name === 'Maths');
    const science = subjects.find(s => s.name === 'Science');
    const english = subjects.find(s => s.name === 'English');
    const telugu = subjects.find(s => s.name === 'Telugu');
    const social = subjects.find(s => s.name === 'Social');

    const teacherProfiles = await prisma.teacher.findMany();
    const t1 = teacherProfiles[0];
    const t2 = teacherProfiles[1] || t1;
    const t3 = teacherProfiles[2] || t1;

    if (t1 && maths && science && english) {
      const timetableData = [
        { classId: class10.id, dayOfWeek: 'MONDAY', period: 1, subjectId: maths.id, teacherId: t1.id },
        { classId: class10.id, dayOfWeek: 'MONDAY', period: 2, subjectId: science.id, teacherId: t2.id },
        { classId: class10.id, dayOfWeek: 'MONDAY', period: 3, subjectId: english.id, teacherId: t3.id },
        { classId: class10.id, dayOfWeek: 'MONDAY', period: 4, subjectId: telugu.id, teacherId: t2.id },
        { classId: class10.id, dayOfWeek: 'MONDAY', period: 6, subjectId: social.id, teacherId: t1.id },
        { classId: class10.id, dayOfWeek: 'MONDAY', period: 7, subjectId: maths.id, teacherId: t3.id }
      ];

      for (const item of timetableData) {
        await prisma.timetable.upsert({
          where: {
            classId_dayOfWeek_period: {
              classId: item.classId,
              dayOfWeek: item.dayOfWeek,
              period: item.period
            }
          },
          update: {
            subjectId: item.subjectId,
            teacherId: item.teacherId
          },
          create: item
        });
      }
      console.log('Seeded sample Timetable for Class 10.');
    }
  }

  // 7. Seed Bulk Students
  console.log('Clearing old student/parent/attendance/marks tables...');
  await prisma.attendance.deleteMany({});
  await prisma.mark.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      role: {
        in: ['STUDENT', 'PARENT']
      }
    }
  });
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});

  console.log('Seeding new student dataset...');
  const studentNamesByClass = {
    1: [
      "Aarush Reddy", "Sai Pavan", "Vihaan Krishna", "Yash Charan", "Mokshith Kumar",
      "Rithvik Sai", "Abhiram Teja", "Koushik Reddy", "Harshavardhan", "Pranith Kumar",
      "Likhith Sai", "Advaith Reddy", "Nithin Kumar", "Srinith Krishna", "Charvik Teja",
      "Dhanvin Reddy", "Jashwanth Sai", "Reyansh Kumar", "Akshith Reddy", "Tarak Charan"
    ],
    2: [
      "Ananya Sri", "Harshitha Devi", "Keerthana Reddy", "Saanvi Lakshmi", "Meghana Priya",
      "Lasya Sri", "Ishitha Rani", "Navya Tejaswini", "Bhavya Sai", "Sowmya Lakshmi",
      "Nanditha Reddy", "Deepika Kumari", "Pavani Sri", "Chandana Devi", "Akshaya Priya",
      "Sanjana Reddy", "Likhitha Sai", "Madhuri Lakshmi", "Vaishnavi Teja", "Harika Sri"
    ],
    3: [
      "Rohith Kumar", "Naveen Reddy", "Vikas Teja", "Mahesh Babu", "Santosh Kumar",
      "Kiran Kumar", "Manoj Sai", "Sandeep Reddy", "Lokesh Kumar", "Goutham Krishna",
      "Ajay Teja", "Surya Prakash", "Aravind Kumar", "Naresh Reddy", "Vinay Kumar",
      "Rahul Chandra", "Teja Varma", "Vamsi Krishna", "Prudhvi Raj", "Hemant Kumar"
    ],
    4: [
      "Dharani Sri", "Keerthi Lakshmi", "Monika Reddy", "Jyoshna Priya", "Sravya Devi",
      "Sushmitha Rani", "Alekhya Sri", "Bindu Priya", "Kavya Lakshmi", "Shivani Reddy",
      "Sneha Kumari", "Swathi Teja", "Anusha Devi", "Divya Rani", "Prathyusha",
      "Sirisha Lakshmi", "Niharika Sri", "Bhargavi Devi", "Tejaswini Reddy", "Roshini Priya"
    ],
    5: [
      "Pavan Kalyan", "Arjun Varma", "Vivek Anand", "Chaitanya Sai", "Abhinay Kumar",
      "Phanindra Reddy", "Srikar Teja", "Rakesh Varma", "Dheeraj Kumar", "Bhargav Sai",
      "Jagadeesh Reddy", "Rohit Krishna", "Madhav Kumar", "Sharan Teja", "Akhil Varma",
      "Vineeth Sai", "Harinath Kumar", "Sai Nikhil", "Karthikeya", "Yoganand"
    ],
    6: [
      "Nikhitha Reddy", "Pranavi Sri", "Manasa Lakshmi", "Gayathri Devi", "Amulya Rani",
      "Hema Priya", "Pravalika", "Sandhya Lakshmi", "Indu Priya", "Siri Chandana",
      "Reshma Sri", "Akhila Devi", "Shravani Reddy", "Ritika Sai", "Poojitha Lakshmi",
      "Lavanya Sri", "Kusuma Priya", "Srinidhi Devi", "Anjali Rani", "Niveditha Sri"
    ],
    7: [
      "Koushik Varma", "Pranay Kumar", "Jayanth Sai", "Sai Charan", "Bhanu Prakash",
      "Kishore Kumar", "Manideep", "Tarun Teja", "Sai Harsha", "Naveen Chandra",
      "Rohit Varma", "Aditya Krishna", "Uday Kumar", "Siddarth Sai", "Pavan Charan",
      "Sampath Kumar", "Chiranjeevi", "Prashanth Reddy", "Kalyan Teja", "Vinod Kumar"
    ],
    8: [
      "Sai Sushma", "Pooja Reddy", "Bhavana Lakshmi", "Anitha Kumari", "Mounika Devi",
      "Neelima Rani", "Shruthi Priya", "Deepthi Lakshmi", "Anupama Sri", "Varshini Devi",
      "Karuna Priya", "Yamini Reddy", "Sailaja Kumari", "Sahithi Sri", "Aparna Lakshmi",
      "Rupasri Devi", "Nitya Rani", "Pallavi Sri", "Hasini Lakshmi", "Krithika Devi"
    ],
    9: [
      "Venkatesh Kumar", "Siva Prasad", "Ram Charan", "Satish Kumar", "Anil Kumar",
      "Mohan Krishna", "Narasimha Rao", "Raviteja", "Hari Krishna", "Sudheer Kumar",
      "Prasad Reddy", "Vijay Kumar", "Gopi Krishna", "Ravi Chandra", "Murali Krishna",
      "Suresh Babu", "Jagadish", "Nagarjuna", "Ramesh Naidu", "Bharath Kumar"
    ],
    10: [
      "Akash Kumar", "Sai Kiran", "Nithish Reddy", "Rohan Krishna", "Charan Kumar",
      "Vamshi Teja", "Kalyan Krishna", "Srinivas Reddy", "Gokul Sai", "Praveen Kumar",
      "Dinesh Reddy", "Abhishek Sai", "Yashwanth Kumar", "Naveen Krishna", "Ashwin Reddy",
      "Varun Teja", "Prajwal Kumar", "Mithun Sai", "Rithesh Kumar", "Sandeep Kumar"
    ]
  };

  let insertedCount = 0;

  for (let cNum = 1; cNum <= 10; cNum++) {
    const gradeName = `Class ${cNum}`;
    const clsRecord = classes.find(c => c.grade === gradeName);
    if (!clsRecord) continue;

    const birthYear = 2021 - cNum;
    const names = studentNamesByClass[cNum];

    for (let pos = 1; pos <= names.length; pos++) {
      const roll = (cNum * 100 + pos).toString();
      const name = names[pos - 1];
      const dobDay = pos.toString().padStart(2, '0');
      const dobMonth = "06";
      const dob = `${dobDay}${dobMonth}${birthYear}`;
      const parentName = `Parent of ${name}`;
      const parentMobile = `9300000${roll}`;
      const admissionNumber = `ADM${roll}`;
      const gender = (cNum === 2 || cNum === 4 || cNum === 6 || cNum === 8) ? "FEMALE" : "MALE";

      const parentRecord = await prisma.parent.create({
        data: {
          name: parentName,
          mobile: parentMobile,
          passwordHash: bcrypt.hashSync(parentMobile, 10)
        }
      });

      await prisma.student.create({
        data: {
          rollNumber: roll,
          name,
          classId: clsRecord.id,
          dob,
          gender,
          parentName,
          parentMobile,
          address: `AP Govt Housing Colony, Ward ${cNum}`,
          admissionNumber,
          parentId: parentRecord.id,
          presentPeriods: 0,
          absentPeriods: 0,
          totalConductedPeriods: 0,
          attendancePercentage: 0
        }
      });
      insertedCount++;
    }
  }

  // 8. Seed Special Student (Roll: 2551)
  const specialRoll = "2551";
  const class10Record = classes.find(c => c.grade === 'Class 10');
  if (class10Record) {
    const specialParentMobile = "9999999999";
    const specialParent = await prisma.parent.create({
      data: {
        name: "Parent Guruvenkat",
        mobile: specialParentMobile,
        passwordHash: bcrypt.hashSync(specialParentMobile, 10)
      }
    });

    await prisma.student.create({
      data: {
        rollNumber: specialRoll,
        name: "Devarakonda Guruvenkat",
        classId: class10Record.id,
        dob: "06062007",
        gender: "MALE",
        parentName: "Parent Guruvenkat",
        parentMobile: specialParentMobile,
        address: "AP Govt School Campus, Guntur",
        admissionNumber: "ADM2551",
        parentId: specialParent.id,
        presentPeriods: 0,
        absentPeriods: 0,
        totalConductedPeriods: 0,
        attendancePercentage: 0
      }
    });
    insertedCount++;
    console.log('Seeded Special Student: Devarakonda Guruvenkat.');
  }

  // 9. Seed School Notices
  console.log("Seeding school notices/announcements...");
  await prisma.notification.deleteMany({
    where: { category: "NOTICE_BOARD" }
  });
  await prisma.notification.createMany({
    data: [
      {
        userId: null,
        title: "Independence Day Celebration – 15 August 2026",
        content: "Official state flag hoisting ceremony and student cultural events schedule on the main sports ground. Flag hoisting begins at 08:30 AM.",
        category: "NOTICE_BOARD",
        isPinned: false,
        expiryDate: "2026-08-16",
        pdfUrl: "/circulars/independence-day-2026.pdf",
        noticeType: "EVENTS",
        createdAt: new Date("2026-07-20T10:00:00Z")
      },
      {
        userId: null,
        title: "Quarterly Examination Schedule Released",
        content: "The academic schedule for Quarterly Examinations has been finalized for all grades. Detailed tables are available at classrooms.",
        category: "NOTICE_BOARD",
        isPinned: false,
        expiryDate: "2026-09-15",
        pdfUrl: "/circulars/quarterly-exams-schedule.pdf",
        noticeType: "EXAMINATION",
        createdAt: new Date("2026-07-18T10:00:00Z")
      },
      {
        userId: null,
        title: "Scholarship Verification Last Date Extended",
        content: "Verification of documents for welfare scholarship schemes has been extended. Submit caste and income declarations at computer operator office.",
        category: "NOTICE_BOARD",
        isPinned: false,
        expiryDate: "2026-08-16",
        pdfUrl: null,
        noticeType: "SCHOLARSHIP",
        createdAt: new Date("2026-07-17T10:00:00Z")
      },
      {
        userId: null,
        title: "School Reopening After Holidays",
        content: "Regular classes will resume as per standard schedule. All students must present physical notebooks and verify attendance registries.",
        category: "NOTICE_BOARD",
        isPinned: false,
        expiryDate: "2026-08-01",
        pdfUrl: null,
        noticeType: "GENERAL",
        createdAt: new Date("2026-07-16T10:00:00Z")
      },
      {
        userId: null,
        title: "Science Exhibition Registration Started",
        content: "Students from classes 6 to 10 are invited to submit their innovative models and project abstracts before the deadline.",
        category: "NOTICE_BOARD",
        isPinned: false,
        expiryDate: "2026-08-10",
        pdfUrl: null,
        noticeType: "ACADEMIC",
        createdAt: new Date("2026-07-15T10:00:00Z")
      },
      {
        userId: null,
        title: "Library Book Distribution Schedule",
        content: "Annual library textbooks and reference directories are being issued according to class lists. Bring library cards to block registration.",
        category: "NOTICE_BOARD",
        isPinned: false,
        expiryDate: "2026-07-30",
        pdfUrl: null,
        noticeType: "LIBRARY",
        createdAt: new Date("2026-07-14T10:00:00Z")
      },
      {
        userId: null,
        title: "Sports Selection Trials – Football & Volleyball",
        content: "School selection matches for under-14 and under-17 district team nominations are scheduled. Report to the physical training director.",
        category: "NOTICE_BOARD",
        isPinned: false,
        expiryDate: "2026-07-25",
        pdfUrl: null,
        noticeType: "SPORTS",
        createdAt: new Date("2026-07-13T10:00:00Z")
      },
      {
        userId: null,
        title: "Holiday Notification – Raksha Bandhan",
        content: "School administrative desks and classes will remain closed for Raksha Bandhan celebrations as authorized by state welfare orders.",
        category: "NOTICE_BOARD",
        isPinned: false,
        expiryDate: "2026-08-25",
        pdfUrl: null,
        noticeType: "HOLIDAY",
        createdAt: new Date("2026-07-12T10:00:00Z")
      }
    ]
  });
  console.log("Seeded school notices successfully.");

  console.log(`Successfully seeded ${insertedCount} student records.`);
  console.log('Seeding complete successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

