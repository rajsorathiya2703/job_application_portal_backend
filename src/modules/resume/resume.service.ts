import fs from 'fs';
import path from 'path';
import { Resume } from './resume.model';
import { JobSeekerProfile } from '../jobSeeker/jobSeekerProfile.model';
import { AppError } from '../../utils/apiError';

// ─── Types ────────────────────────────────────────────────────────────────────

type ResumeFileType = 'pdf' | 'doc' | 'docx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derives the resume file type from the file extension.
 */
const getFileType = (filename: string): ResumeFileType => {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  if (ext === 'pdf' || ext === 'doc' || ext === 'docx') return ext;
  throw new AppError(400, 'Unsupported file extension');
};

/**
 * Resolves the job seeker profile for a given user.
 * Throws 404 if no profile is found.
 */
const findSeekerProfile = async (userId: string) => {
  const profile = await JobSeekerProfile.findOne({ user: userId });
  if (!profile) {
    throw new AppError(
      404,
      'Job seeker profile not found. Please complete your profile first.'
    );
  }
  return profile;
};

// ─── saveResumeFile ───────────────────────────────────────────────────────────
/**
 * ISOLATION POINT — all file-persistence logic lives here.
 *
 * Currently: multer has already written to disk; we simply compute the public
 * URL from the filename. To switch to cloud storage (S3, Cloudinary, etc.):
 *   • Change multer to memoryStorage so `file.buffer` is available.
 *   • Replace the body of this function with a cloud-upload call.
 *   • Return the cloud-provider URL instead of the local path.
 *   • No changes needed outside this function.
 */
const saveResumeFile = (file: Express.Multer.File): { fileUrl: string } => {
  // Construct a server-relative URL that matches the express.static mount in app.ts
  const fileUrl = `/uploads/resumes/${file.filename}`;
  return { fileUrl };
};

// ─── createResume ─────────────────────────────────────────────────────────────

export const createResume = async (
  userId: string,
  file: Express.Multer.File
) => {
  const profile = await findSeekerProfile(userId);

  const { fileUrl } = saveResumeFile(file);

  // Auto-set isDefault for the seeker's first resume
  const existingCount = await Resume.countDocuments({ jobSeeker: profile._id });
  const isDefault = existingCount === 0;

  const resume = await Resume.create({
    jobSeeker: profile._id,
    fileName: file.originalname,
    fileUrl,
    fileType: getFileType(file.originalname),
    fileSizeKB: Math.round(file.size / 1024),
    isDefault,
  });

  return resume;
};

// ─── getMyResumes ─────────────────────────────────────────────────────────────

export const getMyResumes = async (userId: string) => {
  const profile = await findSeekerProfile(userId);
  const resumes = await Resume.find({ jobSeeker: profile._id }).sort({
    createdAt: -1,
  });
  return resumes;
};

// ─── setDefaultResume ─────────────────────────────────────────────────────────

export const setDefaultResume = async (
  userId: string,
  resumeId: string
) => {
  const profile = await findSeekerProfile(userId);

  // Verify ownership
  const resume = await Resume.findOne({
    _id: resumeId,
    jobSeeker: profile._id,
  });

  if (!resume) {
    throw new AppError(404, 'Resume not found or does not belong to you');
  }

  // Atomic swap: unset all, then set the target — two writes but ordered safely.
  // Using Promise.all here would risk a brief window where none are default;
  // sequential awaits keep it consistent without needing a transaction.
  await Resume.updateMany(
    { jobSeeker: profile._id },
    { $set: { isDefault: false } }
  );

  await Resume.findByIdAndUpdate(resumeId, { $set: { isDefault: true } });

  return Resume.findById(resumeId);
};

// ─── deleteResume ─────────────────────────────────────────────────────────────

export const deleteResume = async (userId: string, resumeId: string) => {
  const profile = await findSeekerProfile(userId);

  // Ownership check
  const resume = await Resume.findOne({
    _id: resumeId,
    jobSeeker: profile._id,
  });

  if (!resume) {
    throw new AppError(404, 'Resume not found or does not belong to you');
  }

  // Delete DB record first
  await Resume.findByIdAndDelete(resumeId);

  // Remove file from disk — derive the absolute path from the stored relative URL
  const absolutePath = path.join(
    process.cwd(),
    resume.fileUrl  // already starts with /uploads/resumes/...
  );

  try {
    fs.unlinkSync(absolutePath);
  } catch (err: unknown) {
    // File may already be missing (manual deletion, ephemeral FS restart, etc.)
    // Log a warning but do NOT throw — the DB record is already gone.
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      console.warn(
        `[deleteResume] File not found on disk (already deleted?): ${absolutePath}`
      );
    } else {
      // Unexpected FS error — still log but don't surface to the client
      console.error(`[deleteResume] Unexpected error deleting file: ${absolutePath}`, err);
    }
  }
};
