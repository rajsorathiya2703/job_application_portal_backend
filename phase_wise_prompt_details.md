# Job Application Portal — Phase-Wise Build Plan & Prompts

Reference: `job-portal-architecture-plan.md` (collections, folder structure, routes, middleware chain). Each phase prompt below assumes the AI coding tool can see that plan or the code from the previous phase — paste them in order, review the output, approve, then move to the next phase.

---

## Phase Flow Overview

| Phase | Goal | Output |
|---|---|---|
| **1** | Project bootstrap | Working TS + Express server, MongoDB connected, env config validated, health-check route, base folder structure, global error handler wired |
| **2** | Data layer | All Mongoose models — `User`, `RefreshToken`, `Company`, `RecruiterProfile`, `JobSeekerProfile`, `Tag`, `Job`, `Resume`, `Application` — with TS interfaces and indexes |
| **3** | Input validation layer | Zod schemas for every model's create/update payloads + a generic `validate` middleware that parses body/params/query and forwards errors |
| **4** | Authentication | Register, login, Google OAuth, refresh-token rotation, logout, plus `authenticate` and `authorize` middleware |
| **5** | Recruiter & Job Seeker modules | Full controller → service → route wiring for both profile types (CRUD + dynamic sub-resources for education/experience/projects, company profile update) |
| **6** | Tag & Job modules | Recruiter creates/manages jobs (ownership-checked), public job listing with filters/search/pagination, Tag CRUD |
| **7** | Resume module | Multer upload wired, file-type/size validation, multiple resumes per seeker, default-resume selection |
| **8** | Application module | Apply to a job, prevent duplicate applications, seeker's own applications view, recruiter's per-job applicant view, status updates with history |
| **9** | Finishing touches | Seed script (sample company/recruiter/jobs), Postman collection, full README, Render deployment config |

Each phase ends with **you reviewing the diff before continuing** — the prompts below explicitly ask the tool to stop and summarize what it built rather than chaining into the next phase unprompted.

---

## Phase 1 — Project Setup Prompt

```
Set up the initial backend for a "Job Application Portal" REST API.

Stack: Node.js, Express, TypeScript, Mongoose (MongoDB), dotenv.

Requirements:
1. Initialize a TypeScript Express project with this exact folder structure:

src/
├── config/
│   ├── db.ts
│   └── env.ts
├── middlewares/
│   └── errorHandler.middleware.ts
├── utils/
│   ├── apiError.ts
│   ├── apiResponse.ts
│   └── asyncHandler.ts
├── modules/
│   └── health/
│       ├── health.routes.ts
│       └── health.controller.ts
├── app.ts
└── server.ts

2. `config/env.ts`: load and validate process.env using zod (PORT, MONGO_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY, NODE_ENV). Throw a clear startup error if any required var is missing.

3. `config/db.ts`: mongoose connection function with connected/error event logging, exported and called from server.ts.

4. `utils/apiError.ts`: an `AppError` class extending Error with `statusCode` and `isOperational`.

5. `utils/apiResponse.ts`: a helper `sendResponse(res, statusCode, message, data?)` that returns a consistent JSON shape: `{ success, message, data }`.

6. `utils/asyncHandler.ts`: a wrapper that catches async controller errors and forwards them to `next()`.

7. `middlewares/errorHandler.middleware.ts`: global error handler — reads `AppError` if present, otherwise defaults to 500, returns `{ success: false, message, stack (only in dev) }`.

8. `modules/health/`: a simple `GET /api/health` route returning `{ status: 'ok', uptime }`, wired through the same controller/asyncHandler pattern so it acts as the template for all future modules.

9. `app.ts`: express app instance, `express.json()`, mount health routes under `/api/health`, mount `errorHandler` last.

10. `server.ts`: connect to DB, then start the HTTP server on `PORT`, log the URL on success, exit process on DB connection failure.

11. Create a `.env.example` with all keys from step 2, using placeholder values.

12. Add `dev` script using `ts-node-dev` (or `tsx`) and a `build`/`start` script to `package.json`.

Do not implement any business modules yet — this phase is purely the skeleton. After finishing, tell me exactly which files you created/modified and confirm the server starts and `/api/health` responds, so I can verify before we move to Phase 2.
```

---

## Phase 2 — Define Models Prompt

```
Continue on the existing Job Application Portal backend (TypeScript + Express + Mongoose, structure as already set up in Phase 1). Do not touch config, middlewares, or the health module.

Create all Mongoose models for the app. For each model, create a `<name>.model.ts` inside its module folder under `src/modules/<module>/`, with a matching TypeScript interface (`I<Name>`) and export both the interface and the Mongoose model.

Models to create:

1. modules/user/user.model.ts — User
   - role: enum ['job_seeker','recruiter'], required
   - email: string, unique, required, lowercase
   - password: string, select:false (required only if authProvider is 'local')
   - authProvider: enum ['local','google'], default 'local'
   - googleId: string, optional
   - avatar: string, optional
   - contactNumber: string
   - isEmailVerified: boolean, default false
   - emailVerifyToken / emailVerifyExpiry: optional
   - passwordResetToken / passwordResetExpiry: optional
   - isActive: boolean, default true
   - timestamps: true

2. modules/auth/refreshToken.model.ts — RefreshToken
   - user: ObjectId ref 'User', required
   - tokenHash: string, required
   - expiresAt: Date, required
   - createdByIp: string
   - revokedAt: Date, optional
   - replacedByToken: string, optional
   - timestamps: true

3. modules/company/company.model.ts — Company
   - name, description, industry, companySize, address
   - contactNumber1, contactNumber2
   - logo, website: optional strings
   - isVerified: boolean, default false
   - createdBy: ObjectId ref 'User', required
   - timestamps: true

4. modules/recruiter/recruiterProfile.model.ts — RecruiterProfile
   - user: ObjectId ref 'User', required, unique
   - company: ObjectId ref 'Company', required
   - designation: string
   - timestamps: true

5. modules/tag/tag.model.ts — Tag
   - title: string, required
   - appliesOn: enum ['job','skill'], required
   - timestamps: true

6. modules/jobSeeker/jobSeekerProfile.model.ts — JobSeekerProfile
   - user: ObjectId ref 'User', required, unique
   - firstName, lastName: string
   - address: string
   - skills: [ObjectId ref 'Tag']
   - education: array of subdocuments { universityName, courseName, startYear: Number, endYear: Number, percentage: Number }
   - experience: array of subdocuments { companyName, startDate: Date, endDate: Date, field, description }
   - projects: array of subdocuments { title, description, techStack: [String], startDate: Date, endDate: Date, link }
   - timestamps: true
   - Each subdocument array item should have its own _id (default Mongoose behavior) so individual entries can be targeted by PUT/DELETE later.

7. modules/job/job.model.ts — Job
   - title, description: string, required
   - totalExperience: { min: Number, max: Number }
   - relevantExperience: { min: Number, max: Number }
   - jobType: enum ['full_time','part_time','internship','contract'], required
   - workMode: enum ['onsite','remote','hybrid'], required
   - tags: [ObjectId ref 'Tag']
   - location: { address: String, city: String, state: String, country: String, isRemote: Boolean }
   - company: ObjectId ref 'Company', required
   - postedBy: ObjectId ref 'User', required
   - openPositions: Number, default 1
   - status: enum ['open','closed','draft'], default 'open'
   - applicationDeadline: Date, optional
   - timestamps: true

8. modules/resume/resume.model.ts — Resume
   - jobSeeker: ObjectId ref 'JobSeekerProfile', required
   - fileName, fileUrl: string, required
   - fileType: enum ['pdf','doc','docx'], required
   - fileSizeKB: Number
   - isDefault: boolean, default false
   - timestamps: true (createdAt acts as uploadedAt)

9. modules/application/application.model.ts — Application
   - job: ObjectId ref 'Job', required
   - jobSeeker: ObjectId ref 'User', required
   - resume: ObjectId ref 'Resume', required
   - coverLetter: string, optional
   - status: enum ['applied','under_review','shortlisted','rejected','hired','withdrawn'], default 'applied'
   - statusHistory: array of { status: String, changedAt: Date, changedBy: ObjectId ref 'User' }
   - timestamps: true (createdAt acts as appliedAt)
   - Add a compound unique index on { job: 1, jobSeeker: 1 } so a candidate can't apply twice to the same job.

After creating all 9 models, list them out with their file paths and confirm there are no circular import issues between modules (e.g. Job importing Company, Application importing Job/Resume/User). Don't create routes, controllers, or services yet — stop here so I can review the schemas before Phase 3.
```

---

## Phase 3 — Input Validation Middleware Prompt

```
Continue on the same Job Application Portal backend. Models from Phase 2 already exist — do not modify them.

Build the validation layer using Zod.

1. Create `middlewares/validate.middleware.ts`:
   - Export a factory function `validate(schema: ZodSchema, source?: 'body' | 'query' | 'params')` defaulting source to 'body'.
   - It should parse `req[source]` against the schema, replace `req[source]` with the parsed/typed result on success, and on failure call `next(new AppError(400, formattedZodMessage))` — flatten Zod's error into a single readable message (or an array of field:message pairs) rather than passing the raw ZodError.

2. For every module, create a `<name>.validation.ts` file exporting Zod schemas for its request payloads. At minimum:

   - modules/auth/auth.validation.ts:
     - registerSchema (role, email, password min 8 chars, contactNumber)
     - loginSchema (email, password)
     - googleAuthSchema (idToken: string)
     - refreshTokenSchema (refreshToken: string, only if sent in body rather than cookie)

   - modules/jobSeeker/jobSeeker.validation.ts:
     - updateProfileSchema (firstName, lastName, address — all optional/partial)
     - educationSchema (universityName, courseName, startYear, endYear, percentage — with startYear <= endYear refinement)
     - experienceSchema (companyName, startDate, endDate, field, description)
     - projectSchema (title, description, techStack array, startDate, endDate, link optional url)

   - modules/recruiter/recruiter.validation.ts:
     - updateRecruiterProfileSchema (designation)
     - updateCompanySchema (name, description, industry, companySize, address, contactNumber1, contactNumber2, logo, website — all optional/partial)

   - modules/job/job.validation.ts:
     - createJobSchema (all Job fields except company/postedBy which come from req.user/context, with enum validation matching the model enums, and a refinement that totalExperience.min <= totalExperience.max)
     - updateJobSchema (same, all optional)

   - modules/tag/tag.validation.ts:
     - createTagSchema (title, appliesOn enum)

   - modules/application/application.validation.ts:
     - createApplicationSchema (jobId: valid Mongo ObjectId string, resumeId: valid Mongo ObjectId string, coverLetter optional)
     - updateStatusSchema (status enum matching Application.status)

   Use a shared `utils/objectId.validation.ts` helper: a Zod refinement that checks a string is a valid Mongo ObjectId, reused across all the *Id fields above instead of repeating the regex in every file.

3. Do not wire these into routes yet (routes don't exist until Phase 4/5) — just make sure every schema file compiles and exports cleanly typed schemas (export inferred TS types too, e.g. `export type RegisterInput = z.infer<typeof registerSchema>`).

After this, list every validation file created and confirm they all import the shared ObjectId helper rather than duplicating validation logic. Stop here for my review before Phase 4.
```

---

## Phase 4 — Authentication, Routes & Authorization Middleware Prompt

```
Continue on the same Job Application Portal backend. Models (Phase 2) and validation schemas (Phase 3) already exist — reuse them, don't recreate.

Build the full authentication module.

1. `utils/jwt.util.ts`:
   - signAccessToken(payload) / signRefreshToken(payload) using JWT_ACCESS_SECRET / JWT_REFRESH_SECRET and their expiry envs.
   - verifyAccessToken(token) / verifyRefreshToken(token).
   - hashToken(token) using crypto (sha256) for storing refresh tokens hashed in the DB — never store raw tokens.

2. `config/googleAuth.ts`:
   - Set up a `google-auth-library` OAuth2Client using a GOOGLE_CLIENT_ID env var (add this to env.ts and .env.example).
   - Export a `verifyGoogleIdToken(idToken: string)` function that returns the verified payload (email, name, picture, sub).

3. `middlewares/authenticate.middleware.ts`:
   - Reads Bearer token from Authorization header.
   - Verifies via jwt.util, attaches `{ id, role }` to `req.user` (extend Express Request type in `types/express.d.ts`).
   - On missing/invalid/expired token, calls next(new AppError(401, ...)).

4. `middlewares/authorize.middleware.ts`:
   - `authorize(...roles: string[])` — checks `req.user.role` is in the allowed list, else next(new AppError(403, ...)).

5. `modules/auth/auth.service.ts` — business logic:
   - register(input): hash password with bcrypt, create User, if role is 'job_seeker' also create an empty JobSeekerProfile, if 'recruiter' just create the User (RecruiterProfile/Company get filled in later via a separate endpoint since company details aren't known at signup). Issue access + refresh token pair, store hashed refresh token.
   - login(email, password): verify user exists and password matches (bcrypt.compare), issue token pair.
   - googleLogin(idToken): verify via googleAuth, find-or-create User with authProvider 'google', issue token pair.
   - refreshToken(rawToken): verify JWT signature, look up hashed match in RefreshToken collection, confirm not revoked/expired, revoke it, issue and store a new pair (rotation), return new pair. If the token is reused after being revoked, revoke all tokens for that user (reuse detection) and throw an AppError.
   - logout(rawToken): find and revoke the matching RefreshToken record.

6. `modules/auth/auth.controller.ts`: thin controllers calling the service, wrapped in asyncHandler, responding via sendResponse. Set refresh token as an httpOnly cookie on register/login/refresh; clear it on logout.

7. `modules/auth/auth.routes.ts`:
   - POST /register — validate(registerSchema) → controller.register
   - POST /login — validate(loginSchema) → controller.login
   - POST /google — validate(googleAuthSchema) → controller.googleLogin
   - POST /refresh-token — controller.refreshToken (reads cookie, no body validation needed)
   - POST /logout — authenticate → controller.logout

8. Mount auth routes in `app.ts` under `/api/auth`.

After this, walk me through the full register → login → refresh → logout flow you implemented (which files handle what), and confirm authenticate/authorize are ready to be reused by every future module. Stop here for my review before Phase 5.
```

---

## Phase 5 — Recruiter & Job Seeker Routes/Services Prompt

```
Continue on the same Job Application Portal backend. User/RefreshToken/JobSeekerProfile/RecruiterProfile/Company models (Phase 2), validation schemas (Phase 3), and authenticate/authorize middleware (Phase 4) already exist — reuse them.

Build the Job Seeker and Recruiter modules end to end.

### Job Seeker module (modules/jobSeeker/)

1. jobSeeker.service.ts:
   - getMyProfile(userId): fetch JobSeekerProfile by user, populate skills (Tag).
   - updateMyProfile(userId, data): update firstName/lastName/address/skills.
   - addEducation(userId, data) / updateEducation(userId, eduId, data) / deleteEducation(userId, eduId): operate on the embedded education array by subdocument _id.
   - Same pattern for experience and projects.

2. jobSeeker.controller.ts: thin wrappers over the service, using req.user.id from the authenticate middleware, wrapped in asyncHandler, responding via sendResponse.

3. jobSeeker.routes.ts, all routes prefixed and requiring authenticate + authorize('job_seeker'):
   - GET /me
   - PUT /me — validate(updateProfileSchema)
   - POST /me/education — validate(educationSchema)
   - PUT /me/education/:eduId — validate(educationSchema)
   - DELETE /me/education/:eduId
   - POST /me/experience, PUT /me/experience/:expId, DELETE /me/experience/:expId — same pattern with experienceSchema
   - POST /me/projects, PUT /me/projects/:projectId, DELETE /me/projects/:projectId — same pattern with projectSchema

### Recruiter module (modules/recruiter/)

1. recruiter.service.ts:
   - getMyProfile(userId): fetch RecruiterProfile by user, populate company.
   - createOrUpdateCompany(userId, data): if the recruiter's RecruiterProfile has no company yet, create a new Company (createdBy: userId) and link it; if it exists, update the existing Company document. Return the populated RecruiterProfile.
   - updateDesignation(userId, designation).

2. recruiter.controller.ts: thin wrappers, same asyncHandler/sendResponse pattern.

3. recruiter.routes.ts, all routes prefixed and requiring authenticate + authorize('recruiter'):
   - GET /me
   - PUT /me — validate(updateRecruiterProfileSchema)
   - PUT /me/company — validate(updateCompanySchema)

4. Mount both route files in app.ts under /api/job-seekers and /api/recruiters.

Do not build Job, Tag, Resume, or Application routes in this phase — those come later. After finishing, summarize the endpoints you wired, confirm role-based access is enforced correctly (a recruiter hitting a job-seeker route should get 403, and vice versa), and list any assumptions you made about the empty-profile-on-registration behavior from Phase 4 so I can confirm they match.
```

---

## Phase 6 — Tag & Job Module Prompt

```
Continue on the same Job Application Portal backend. Models (Phase 2), validation schemas (Phase 3), and authenticate/authorize middleware (Phase 4) already exist — reuse them, don't recreate.

Build the Tag and Job modules end to end.

### Tag module (modules/tag/)

1. tag.service.ts:
   - createTag(data): create a Tag document.
   - getTags(appliesOn?: 'job' | 'skill'): list all tags, optionally filtered by appliesOn.

2. tag.controller.ts: thin wrappers, asyncHandler + sendResponse pattern.

3. tag.routes.ts:
   - GET /?appliesOn=skill|job — public, no auth required.
   - POST / — authenticate + authorize('recruiter') → validate(createTagSchema) → controller.create (recruiters can add new tags on the fly when posting a job; keep it simple, no separate admin role for this assessment).

### Job module (modules/job/)

1. job.service.ts:
   - createJob(recruiterUserId, data): look up the recruiter's RecruiterProfile to get their company, create the Job with company + postedBy set from context (never trust these from the request body). Reject if the recruiter has no company set up yet (throw AppError 400 telling them to complete their company profile first).
   - updateJob(recruiterUserId, jobId, data): fetch the job, verify job.postedBy equals recruiterUserId (ownership check), else throw AppError 403. Apply the update.
   - deleteJob(recruiterUserId, jobId): same ownership check, then delete.
   - getJobById(jobId): public fetch, populate company and tags.
   - listJobs(filters, pagination): public. Support query filters:
     - jobType, workMode (exact match)
     - tags (array of tag IDs, match any)
     - city (case-insensitive partial match on location.city, or isRemote=true)
     - minExperience/maxExperience (overlap against totalExperience.min/max range)
     - search (case-insensitive partial match on title)
     - status defaults to 'open' only (don't leak draft/closed jobs publicly)
     - pagination: page, limit (default page=1, limit=10), return { data, total, page, totalPages }
   - listMyJobs(recruiterUserId, pagination): jobs where postedBy = recruiterUserId, all statuses included (recruiter sees their own drafts/closed too).

2. job.controller.ts: thin wrappers, asyncHandler + sendResponse pattern. Read pagination/filter params from req.query.

3. job.routes.ts:
   - GET / — public → controller.listJobs
   - GET /:id — public → controller.getJobById
   - POST / — authenticate + authorize('recruiter') → validate(createJobSchema) → controller.createJob
   - PUT /:id — authenticate + authorize('recruiter') → validate(updateJobSchema) → controller.updateJob
   - DELETE /:id — authenticate + authorize('recruiter') → controller.deleteJob
   - GET /recruiter/mine — authenticate + authorize('recruiter') → controller.listMyJobs

4. Mount tag routes under /api/tags and job routes under /api/jobs in app.ts.

Make sure ownership checks happen in the service layer, not just relying on the controller — this is a common security gap. After finishing, confirm: a recruiter without a company profile gets a clear error when trying to post a job, a recruiter cannot edit/delete another recruiter's job, and the public GET /jobs endpoint never returns draft/closed jobs. Stop here for my review before Phase 7.
```

---

## Phase 7 — Resume Module Prompt

```
Continue on the same Job Application Portal backend. Models (Phase 2) and validation schemas (Phase 3) already exist. Reuse authenticate/authorize from Phase 4.

Build the Resume module with file upload via Multer.

1. config/multer.ts:
   - Configure `diskStorage`: destination `uploads/resumes/` (create this folder if it doesn't exist, and add it to .gitignore), filename as `${req.user.id}-${Date.now()}${path.extname(originalname)}` to avoid collisions.
   - fileFilter: only accept mimetypes for pdf, doc, docx — reject anything else with a clear error passed to the callback.
   - limits: fileSize 5MB.
   - Export a configured `upload` instance (e.g. `upload.single('resume')` used directly in the route).
   - Add a comment at the top of this file noting: this uses local disk storage, which is fine for local dev, but Render's free/standard web services have an ephemeral filesystem — uploaded files will be lost on redeploy/restart. Structure the service layer (step 2) so the actual file-saving logic is isolated in one function, making it easy to swap for a cloud storage provider later without touching controllers or routes.

2. modules/resume/resume.service.ts:
   - createResume(userId, file): look up the JobSeekerProfile for this user, create a Resume document with fileName, fileUrl (local path or URL), fileType (derived from extension), fileSizeKB. If this is the seeker's first resume, set isDefault: true automatically.
   - getMyResumes(userId): list all resumes for this seeker's profile, most recent first.
   - setDefaultResume(userId, resumeId): verify the resume belongs to this seeker, unset isDefault on all their other resumes, set it true on this one (do this as an atomic operation, not two separate awaited calls if avoidable).
   - deleteResume(userId, resumeId): verify ownership, delete the DB record and remove the actual file from disk (fs.unlink), handle the case where the file is already missing gracefully (log a warning, don't throw).

3. modules/resume/resume.controller.ts: thin wrappers, asyncHandler + sendResponse.

4. modules/resume/resume.routes.ts, all requiring authenticate + authorize('job_seeker'):
   - POST / — multer upload middleware first (single field name 'resume'), then controller.create. If no file is present after multer runs, throw AppError 400 ("resume file is required").
   - GET / — controller.getMyResumes
   - PATCH /:id/default — controller.setDefault
   - DELETE /:id — controller.delete

5. Mount resume routes under /api/resumes in app.ts. Also serve the uploads folder as static files if using local storage (express.static) so fileUrl values are actually reachable — but note in a comment that this is a dev-only convenience and should be reconsidered for production.

After finishing, confirm: uploading a non-pdf/doc/docx file is rejected with a clear message, uploading a file over 5MB is rejected, the first resume a user uploads is auto-marked default, and deleting a resume also removes it from disk. Stop here for my review before Phase 8.
```

---

## Phase 8 — Application Module Prompt

```
Continue on the same Job Application Portal backend. Models (Phase 2, including the compound unique index on Application { job, jobSeeker }), validation schemas (Phase 3), and authenticate/authorize (Phase 4) already exist — reuse them.

Build the Application module, which ties Job Seeker, Job, and Resume together.

1. modules/application/application.service.ts:
   - apply(jobSeekerUserId, data: { jobId, resumeId, coverLetter }):
     - Verify the Job exists and status is 'open' (throw AppError 400 if closed/draft or not found).
     - Verify the Resume exists and belongs to this job seeker (throw AppError 403 if not theirs).
     - Create the Application with status 'applied' and an initial statusHistory entry { status: 'applied', changedAt: now, changedBy: jobSeekerUserId }.
     - Catch the Mongo duplicate-key error (E11000) from the compound unique index and rethrow as a clean AppError 409 ("You have already applied to this job") instead of leaking the raw Mongo error.
   - getMyApplications(jobSeekerUserId, pagination): list this seeker's applications, populate job (title, company, location, jobType) and resume (fileName), most recent first.
   - getApplicationsForJob(recruiterUserId, jobId, pagination): verify the job belongs to this recruiter (job.postedBy === recruiterUserId, else AppError 403), then list applications for that job, populate jobSeeker (basic user info) and resume.
   - updateStatus(recruiterUserId, applicationId, newStatus): verify the application's job belongs to this recruiter, push a new entry to statusHistory, update status field.
   - withdraw(jobSeekerUserId, applicationId): verify the application belongs to this seeker, only allow withdrawal if current status is 'applied' or 'under_review' (not if already 'rejected'/'hired'), set status to 'withdrawn' with a statusHistory entry.

2. modules/application/application.controller.ts: thin wrappers, asyncHandler + sendResponse.

3. modules/application/application.routes.ts:
   - POST / — authenticate + authorize('job_seeker') → validate(createApplicationSchema) → controller.apply
   - GET /me — authenticate + authorize('job_seeker') → controller.getMyApplications
   - GET /job/:jobId — authenticate + authorize('recruiter') → controller.getApplicationsForJob
   - PATCH /:id/status — authenticate + authorize('recruiter') → validate(updateStatusSchema) → controller.updateStatus
   - PATCH /:id/withdraw — authenticate + authorize('job_seeker') → controller.withdraw

4. Mount application routes under /api/applications in app.ts.

After finishing, confirm: applying twice to the same job returns a clean 409 (not a raw Mongo stack trace), a recruiter cannot view or update applications for a job they didn't post, and a job seeker cannot withdraw an application that's already been marked 'hired' or 'rejected'. Stop here for my review before Phase 9.
```

---

## Phase 9 — Seed Script, Postman Collection, README & Render Deployment Prompt

```
Continue on the same Job Application Portal backend. All modules (auth, job-seeker, recruiter, tag, job, resume, application) are complete — do not modify their logic, this phase is about finishing touches for submission.

1. seed/seed.ts:
   - Connect to MongoDB using the existing config/db.ts connection function.
   - Clear existing data from User, RecruiterProfile, Company, JobSeekerProfile, Tag, Job (skip Resume/Application/RefreshToken — leave those empty).
   - Create:
     - 1 Company ("Bright Tech Solutions", industry "IT Services", companySize "50-200") linked to...
     - 1 recruiter User (email: recruiter@example.com, password: hash "Password@123") + its RecruiterProfile linking to the Company above.
     - 1 job seeker User (email: seeker@example.com, password: hash "Password@123") + its JobSeekerProfile with 1 sample education entry and 1 sample experience entry, so the profile isn't empty when reviewers test it.
     - 6 Tags: 3 with appliesOn 'skill' (e.g. "React", "Node.js", "MongoDB") and 3 with appliesOn 'job' (e.g. "Full Stack Development", "Frontend Development", "Backend Development").
     - 5 sample Jobs under the seeded company/recruiter, varying jobType, workMode, experience ranges, and tags, so filtering/search has something real to demonstrate.
   - Log a summary of what was created (counts) and the seeded login credentials, then disconnect.
   - Add a `seed` script to package.json: `"seed": "tsx src/seed/seed.ts"`.

2. Generate a Postman collection JSON file at the project root named `Job-Portal-Portal.postman_collection.json` (v2.1 schema), organized into folders matching the modules: Auth, Job Seeker, Recruiter, Tag, Job, Resume, Application. Each request should:
   - Use a `{{baseUrl}}` variable (default http://localhost:5000/api) and a `{{accessToken}}` variable for Authorization headers where needed.
   - Include a representative example body for POST/PUT/PATCH requests (matching the actual Zod schemas), and for the Resume upload request, set the body type to form-data with a file field named 'resume'.
   - Include a short description per request stating which role/auth is required.

3. Write a full README.md covering:
   - Project overview and tech stack.
   - Setup instructions: clone, npm install, copy .env.example to .env, fill in values, npm run seed, npm run dev.
   - Full .env.example content shown inline (PORT, MONGO_URI, JWT secrets/expiries, GOOGLE_CLIENT_ID) with a one-line comment per key.
   - API endpoint documentation: for every route across every module, show method, path, auth requirement, a sample request JSON body (where applicable), and a sample success response JSON — organize this by module using the same structure as the Postman collection.
   - A note on the resume storage tradeoff (local disk vs cloud) and what was chosen for this submission.
   - Instructions for importing the Postman collection.
   - Deployment section: steps to deploy to Render (build command, start command, env vars to set in the Render dashboard, and the free-tier ephemeral disk caveat for the /uploads folder).

4. Add a `render.yaml` (or document the manual dashboard steps if you prefer not to commit one) specifying: build command `npm install && npm run build`, start command `npm start`, and the list of required environment variables (without their values).

After finishing, list every file created in this phase and confirm the seed script runs cleanly end to end with `npm run seed` against a fresh database.
```