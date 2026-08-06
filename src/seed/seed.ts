import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';
import { env } from '../config/env';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);
import { User } from '../modules/user/user.model';
import { RecruiterProfile } from '../modules/recruiter/recruiterProfile.model';
import { Company } from '../modules/company/company.model';
import { JobSeekerProfile } from '../modules/jobSeeker/jobSeekerProfile.model';
import { Tag } from '../modules/tag/tag.model';
import { Job } from '../modules/job/job.model';

const seedDatabase = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Clear existing data in dependency order
    console.log('Clearing existing data...');
    await Job.deleteMany({});
    await Tag.deleteMany({});
    await RecruiterProfile.deleteMany({});
    await Company.deleteMany({});
    await JobSeekerProfile.deleteMany({});
    await User.deleteMany({});

    // 3. Create Recruiter User & Profile
    console.log('Seeding users and companies...');
    const hashedPassword = await bcrypt.hash('Password@123', env.BCRYPT_SALT_ROUNDS);
    
    const recruiterUser = await User.create({
      email: 'recruiter@example.com',
      password: hashedPassword,
      role: 'recruiter',
      isEmailVerified: true,
      authProvider: 'local',
      contactNumber: '1234567890',
    });

    const company = await Company.create({
      name: 'Bright Tech Solutions',
      industry: 'IT Services',
      companySize: '50-200',
      description: 'A leading technology solutions provider specializing in web and mobile applications.',
      isVerified: true,
      createdBy: recruiterUser._id,
    });

    await RecruiterProfile.create({
      user: recruiterUser._id,
      company: company._id,
      designation: 'Senior HR Manager',
    });

    // 4. Create Tags (do this first so we can use them in seeker profile and jobs)
    console.log('Seeding tags...');
    const tags = await Tag.insertMany([
      { title: 'React', appliesOn: 'skill' },
      { title: 'Node.js', appliesOn: 'skill' },
      { title: 'MongoDB', appliesOn: 'skill' },
      { title: 'Full Stack Development', appliesOn: 'job' },
      { title: 'Frontend Development', appliesOn: 'job' },
      { title: 'Backend Development', appliesOn: 'job' },
    ]);

    const skillTags = tags.filter(t => t.appliesOn === 'skill').map(t => t._id);
    const jobTags = tags.filter(t => t.appliesOn === 'job').map(t => t._id);

    // 5. Create Job Seeker User & Profile
    const seekerUser = await User.create({
      email: 'seeker@example.com',
      password: hashedPassword,
      role: 'job_seeker',
      isEmailVerified: true,
      authProvider: 'local',
      contactNumber: '0987654321',
    });

    await JobSeekerProfile.create({
      user: seekerUser._id,
      firstName: 'John',
      lastName: 'Doe',
      education: [
        {
          courseName: 'Bachelor of Science in Computer Science',
          universityName: 'State University',
          endYear: 2022,
        }
      ],
      experience: [
        {
          field: 'Junior Software Engineer',
          companyName: 'Startup Inc',
          description: 'Developed and maintained frontend applications using React and TypeScript.',
        }
      ],
      skills: skillTags, // Now using Tag ObjectIds
      projects: [],
    });

    // 6. Create Jobs
    console.log('Seeding jobs...');
    await Job.insertMany([
      {
        title: 'Senior Frontend Developer',
        company: company._id,
        postedBy: recruiterUser._id,
        description: 'Looking for an experienced frontend developer with strong React skills.',
        jobType: 'full_time',
        workMode: 'remote',
        location: { city: 'New York', state: 'NY', country: 'USA', isRemote: true },
        totalExperience: { min: 3, max: 5 },
        status: 'open',
        openPositions: 2,
        tags: [jobTags[1]], // Frontend Development
      },
      {
        title: 'Backend Node.js Developer',
        company: company._id,
        postedBy: recruiterUser._id,
        description: 'Join our backend team to build scalable microservices.',
        jobType: 'full_time',
        workMode: 'hybrid',
        location: { city: 'San Francisco', state: 'CA', country: 'USA' },
        totalExperience: { min: 2, max: 4 },
        status: 'open',
        openPositions: 1,
        tags: [jobTags[2]], // Backend Development
      },
      {
        title: 'Full Stack Engineer',
        company: company._id,
        postedBy: recruiterUser._id,
        description: 'End-to-end web application development.',
        jobType: 'contract',
        workMode: 'remote',
        location: { isRemote: true },
        totalExperience: { min: 5, max: 10 },
        status: 'open',
        openPositions: 3,
        tags: [jobTags[0]], // Full Stack Development
      },
      {
        title: 'Junior Web Developer',
        company: company._id,
        postedBy: recruiterUser._id,
        description: 'Great opportunity for recent bootcamp grads.',
        jobType: 'full_time',
        workMode: 'onsite',
        location: { city: 'Austin', state: 'TX', country: 'USA' },
        totalExperience: { min: 0, max: 1 },
        status: 'open',
        openPositions: 5,
        tags: [jobTags[1]], // Frontend Development
      },
      {
        title: 'DevOps & Backend Specialist',
        company: company._id,
        postedBy: recruiterUser._id,
        description: 'Help us improve our deployment pipelines and backend architecture.',
        jobType: 'full_time',
        workMode: 'hybrid',
        location: { city: 'Seattle', state: 'WA', country: 'USA' },
        totalExperience: { min: 4, max: 6 },
        status: 'draft', // Testing different statuses
        openPositions: 1,
        tags: [jobTags[2]], // Backend Development
      }
    ]);

    // 7. Summary and Disconnect
    console.log('\n✅ Database seeded successfully!');
    console.log('\n--- Seed Summary ---');
    console.log('Companies: 1');
    console.log('Recruiters: 1');
    console.log('Job Seekers: 1');
    console.log('Tags: 6');
    console.log('Jobs: 5\n');
    
    console.log('--- Test Credentials ---');
    console.log('Recruiter Login: recruiter@example.com / Password@123');
    console.log('Seeker Login: seeker@example.com / Password@123\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('MongoDB disconnected.');
    }
    process.exit(0);
  }
};

seedDatabase();
