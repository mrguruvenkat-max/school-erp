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
  console.log('Seeding bulk students...');
  const commonNames = [
    "Aarav Kumar", "Sai Teja", "Arjun Reddy", "Vihaan Kumar", "Karthik Sai",
    "Rahul Varma", "Nikhil Kumar", "Charan Teja", "Pranav Reddy", "Akhil Sai",
    "Harsha Kumar", "Rohit Teja", "Manoj Reddy", "Abhinav Kumar", "Vivek Sai",
    "Tarun Kumar", "Naveen Teja", "Lokesh Reddy", "Mahesh Kumar", "Surya Sai"
  ];

  let insertedCount = 0;

  for (let cNum = 1; cNum <= 10; cNum++) {
    const gradeName = `Class ${cNum}`;
    const clsRecord = classes.find(c => c.grade === gradeName);
    if (!clsRecord) continue;

    const birthYear = 2021 - cNum;

    for (let pos = 1; pos <= 20; pos++) {
      const roll = (cNum * 100 + pos).toString();
      const name = commonNames[pos - 1];
      const dobDay = pos.toString().padStart(2, '0');
      const dobMonth = "06";
      const dob = `${dobDay}${dobMonth}${birthYear}`;
      const parentName = `Parent of ${name}`;
      const parentMobile = `9300000${roll}`;
      const admissionNumber = `ADM${roll}`;

      const existingStudent = await prisma.student.findUnique({
        where: { rollNumber: roll }
      });

      if (!existingStudent) {
        let parentRecord = await prisma.parent.findUnique({
          where: { mobile: parentMobile }
        });

        if (!parentRecord) {
          parentRecord = await prisma.parent.create({
            data: {
              name: parentName,
              mobile: parentMobile,
              passwordHash: bcrypt.hashSync(parentMobile, 10)
            }
          });
        }

        await prisma.student.create({
          data: {
            rollNumber: roll,
            name,
            classId: clsRecord.id,
            dob,
            gender: "MALE",
            parentName,
            parentMobile,
            address: `AP Govt Housing Colony, Ward ${cNum}`,
            admissionNumber,
            parentId: parentRecord.id
          }
        });
        insertedCount++;
      }
    }
  }

  // 8. Seed Special Student (Roll: 2551)
  const specialRoll = "2551";
  const existingSpecial = await prisma.student.findUnique({
    where: { rollNumber: specialRoll }
  });

  if (!existingSpecial) {
    const class10Record = classes.find(c => c.grade === 'Class 10');
    if (class10Record) {
      const specialParentMobile = "9999999999";
      let specialParent = await prisma.parent.findUnique({
        where: { mobile: specialParentMobile }
      });

      if (!specialParent) {
        specialParent = await prisma.parent.create({
          data: {
            name: "Parent Guruvenkat",
            mobile: specialParentMobile,
            passwordHash: bcrypt.hashSync(specialParentMobile, 10)
          }
        });
      }

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
          parentId: specialParent.id
        }
      });
      insertedCount++;
      console.log('Seeded Special Student: Devarakonda Guruvenkat.');
    }
  }

  console.log(`Successfully inserted ${insertedCount} missing student records.`);
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

