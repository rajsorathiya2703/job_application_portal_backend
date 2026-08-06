# Job Application Portal — Architecture & Implementation Plan

## 1. Final Collection Design

### `User` (auth root — shared by both roles)
```
_id
role                enum ['job_seeker', 'recruiter']
email               unique, required
password            hashed, required if authProvider = 'local'
authProvider         enum ['local', 'google']
googleId            optional
avatar              optional
contactNumber
isEmailVerified     boolean
emailVerifyToken / emailVerifyExpiry
passwordResetToken / passwordResetExpiry
isActive            boolean
createdAt / updatedAt
```

### `RefreshToken`
```
_id
user            ref User
tokenHash       (store hashed, never raw)
expiresAt
createdByIp
revokedAt
replacedByToken   (rotation chain)
createdAt
```

### `JobSeekerProfile` (1:1 with User)
```
_id
user            ref User (unique)
firstName, lastName
address
skills          [ref Tag]   (Tag.appliesOn = 'skill')
education[]     { universityName, courseName, startYear, endYear, percentage }
experience[]    { companyName, startDate, endDate, field, description }
projects[]      { title, description, techStack[], startDate, endDate, link }
createdAt / updatedAt
```
Education/experience/projects as embedded sub-document arrays — Mongo handles the "1 to N dynamic entries" naturally, no join collection needed.

### `Resume`
```
_id
jobSeeker       ref JobSeekerProfile
fileName
fileUrl         (path or cloud URL)
fileType        enum ['pdf','doc','docx']
fileSizeKB
isDefault       boolean
uploadedAt
```

### `Company`
```
_id
name
description
industry
companySize
address
contactNumber1, contactNumber2
logo
website
isVerified
createdBy       ref User
createdAt / updatedAt
```

### `RecruiterProfile` (1:1 with User)
```
_id
user            ref User (unique)
company         ref Company
designation
createdAt / updatedAt
```

### `Tag`
```
_id
title
appliesOn       enum ['job', 'skill']
createdAt
```
Reused for both job tags and seeker skills via `appliesOn` — matches your original design, just simplified to embedded ObjectId arrays instead of a separate join collection (Mongo doesn't need one for many-to-many).

### `Job`
```
_id
title
description
totalExperience       { min: Number, max: Number }
relevantExperience    { min: Number, max: Number }
jobType               enum ['full_time','part_time','internship','contract']
workMode              enum ['onsite','remote','hybrid']
tags                  [ref Tag]   (appliesOn = 'job')
location              { address, city, state, country, isRemote }
company               ref Company
postedBy              ref User (recruiter)
openPositions         Number
status                enum ['open','closed','draft']
applicationDeadline   optional Date
createdAt / updatedAt
```

### `Application` ⭐ (the missing core entity)
```
_id
job             ref Job
jobSeeker       ref User
resume          ref Resume
coverLetter     optional text
status          enum ['applied','under_review','shortlisted','rejected','hired','withdrawn']
statusHistory[] { status, changedAt, changedBy }
appliedAt
updatedAt
```
Add a compound unique index on `{ job, jobSeeker }` so a candidate can't apply to the same job twice.

---

## 2. Folder Structure (TypeScript, matches your Zod → middleware → controller → service → model layering)

```
src/
├── config/
│   ├── db.ts               # mongoose connection
│   ├── env.ts               # validated env (zod-parsed process.env)
│   ├── multer.ts            # storage engine + file filter + size limit
│   └── googleAuth.ts        # google-auth-library client for idToken verify
│
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.validation.ts
│   ├── user/
│   │   └── user.model.ts
│   ├── job-seeker/
│   │   ├── jobSeeker.routes.ts
│   │   ├── jobSeeker.controller.ts
│   │   ├── jobSeeker.service.ts
│   │   ├── jobSeeker.validation.ts
│   │   └── jobSeeker.model.ts
│   ├── recruiter/
│   │   └── ... (same pattern)
│   ├── company/
│   │   └── ...
│   ├── job/
│   │   └── ...
│   ├── tag/
│   │   └── ...
│   ├── resume/
│   │   ├── resume.routes.ts
│   │   ├── resume.controller.ts
│   │   ├── resume.service.ts
│   │   └── resume.model.ts
│   └── application/
│       └── ... (same pattern)
│
├── middlewares/
│   ├── authenticate.middleware.ts   # verifies access token
│   ├── authorize.middleware.ts      # role check: authorize('recruiter')
│   ├── validate.middleware.ts       # generic zod schema validator
│   ├── upload.middleware.ts         # multer instance wired per-route
│   └── errorHandler.middleware.ts   # global error catcher (last in chain)
│
├── utils/
│   ├── jwt.util.ts          # sign/verify access + refresh tokens
│   ├── apiError.ts          # custom AppError class
│   ├── apiResponse.ts       # consistent success response shape
│   └── asyncHandler.ts      # wraps controllers, forwards errors to next()
│
├── types/
│   └── express.d.ts         # extends Request with req.user
│
├── seed/
│   └── seed.ts              # sample companies, tags, jobs
│
├── app.ts                   # express app, route mounting, middleware order
└── server.ts                 # http server bootstrap
```

---

## 3. Route Map

**Auth** — `/api/auth`
- `POST /register` — role, email, password (or google flow)
- `POST /login`
- `POST /google` — body: `{ idToken }`, verified server-side via google-auth-library
- `POST /refresh-token` — rotates + returns new access/refresh pair
- `POST /logout` — revokes the refresh token

**Job Seeker Profile** — `/api/job-seekers`
- `GET /me`
- `PUT /me` — update profile
- `POST /me/education` · `PUT /me/education/:id` · `DELETE /me/education/:id`
- `POST /me/experience` · `PUT /me/experience/:id` · `DELETE /me/experience/:id`
- `POST /me/projects` · `PUT /me/projects/:id` · `DELETE /me/projects/:id`

**Resume** — `/api/resumes`
- `POST /` — multipart upload (Multer)
- `GET /` — list my resumes
- `PATCH /:id/default`
- `DELETE /:id`

**Recruiter / Company** — `/api/recruiters`, `/api/companies`
- `GET /me`, `PUT /me` (recruiter profile)
- `PUT /company` — update company profile

**Jobs** — `/api/jobs`
- `POST /` — recruiter only
- `GET /` — public, with query filters (jobType, workMode, tags, location, experience range)
- `GET /:id`
- `PUT /:id` · `DELETE /:id` — recruiter, ownership-checked
- `GET /recruiter/mine` — recruiter's posted jobs

**Tags** — `/api/tags`
- `GET /?appliesOn=skill|job`
- `POST /` — admin/recruiter

**Applications** — `/api/applications`
- `POST /` — body: `{ jobId, resumeId, coverLetter }` — job seeker only
- `GET /me` — job seeker's own applications
- `GET /job/:jobId` — recruiter view of applicants for their job
- `PATCH /:id/status` — recruiter updates status
- `PATCH /:id/withdraw` — job seeker withdraws

---

## 4. Middleware Chain (order matters)

```
express.json()
  → authenticate (skips for public routes like GET /jobs, /auth/*)
  → authorize(...roles) (e.g. authorize('recruiter') on POST /jobs)
  → validate(zodSchema) (body/params/query)
  → upload.single('resume') (only on resume routes, before controller)
  → controller → service → model
  → errorHandler (registered last, catches everything via asyncHandler)
```

- **`validate.middleware.ts`**: one generic factory — `validate(schema: ZodSchema) => (req,res,next)` that parses `req.body`/`req.query`/`req.params` and calls `next(new AppError(...))` on failure, matching the pattern you already use in DairyFlow Pro.
- **`upload.middleware.ts`**: Multer with `fileFilter` restricted to `pdf`, `doc`, `docx` and a size cap (e.g. 5MB); store under `/uploads/resumes` locally, or swap the storage engine for Cloudinary if you go that route for Render.
- **`authorize.middleware.ts`**: simple role check reading `req.user.role` set by `authenticate`.

---

## 5. Auth Flow Specifics

- **Access token**: short-lived (15 min), sent in response body, used in `Authorization: Bearer`.
- **Refresh token**: long-lived (7–30 days), stored **hashed** in `RefreshToken` collection, sent as httpOnly cookie (or body, if Postman-only testing is fine for the assessment).
- **Rotation**: on every `/refresh-token` call, revoke the old token and issue a new one (`replacedByToken` chain) — protects against replay if a refresh token leaks.
- **Logout**: deletes/revokes the matching `RefreshToken` row so it can't be reused even though the JWT itself hasn't technically "expired."
- **Google login**: client sends Google `idToken` → backend verifies via `google-auth-library` → find-or-create `User` with `authProvider: 'google'` → issue your own access/refresh pair. This avoids running a full Passport session flow, which is overkill for a pure REST API.

---

## 6. Suggested Build Order

1. `config/` + `User` model + `authenticate`/`authorize`/`validate`/`errorHandler` middleware skeletons
2. Auth module (register, login, refresh, logout) — get Postman collection working here first
3. Google OAuth on top of the same User model
4. JobSeekerProfile + dynamic education/experience/project sub-routes
5. Company + RecruiterProfile
6. Tag module
7. Job module + seed script (sample jobs)
8. Resume module (Multer)
9. Application module (ties everything together)
10. README + Postman export + Render deployment

This order lets you demo working auth early and builds toward Application last, since it depends on every other collection existing first.