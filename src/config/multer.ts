/**
 * Multer configuration — local disk storage.
 *
 * ⚠️  IMPORTANT — Deployment note:
 * This uses local disk storage, which is fine for local development.
 * Render's free/standard web services have an *ephemeral* filesystem:
 * uploaded files will be permanently lost on every redeploy or instance restart.
 *
 * The actual file-saving logic is intentionally isolated inside resume.service.ts
 * (`saveResumeFile`). To migrate to cloud storage (e.g. AWS S3, Cloudinary, GCS):
 *   1. Replace diskStorage below with memoryStorage (multer keeps the buffer in RAM).
 *   2. Update `saveResumeFile` in resume.service.ts to stream/upload the buffer to
 *      the cloud provider and return the public URL.
 *   3. No changes needed in the controller or routes.
 */

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// ─── Ensure destination folder exists at startup ─────────────────────────────

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'resumes');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Allowed MIME types ───────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  'application/pdf',                                                          // .pdf
  'application/msword',                                                       // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
];

// ─── Storage engine ───────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },

  filename(req, file, cb) {
    // Pattern: <userId>-<timestamp><ext>  →  avoids filename collisions across users/requests
    const userId = req.user?.id ?? 'unknown';
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

// ─── File filter ─────────────────────────────────────────────────────────────

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only PDF, DOC, and DOCX files are accepted.'
      )
    );
  }
};

// ─── Configured upload instance ───────────────────────────────────────────────

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
}).single('resume');

export { UPLOAD_DIR };
