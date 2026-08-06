# Job Portal Backend API

A complete, robust backend API for a Job Portal application. It supports dual user roles (Job Seekers and Recruiters), job postings, resume uploads, and an end-to-end application lifecycle management system.

## Tech Stack

| Technology | Description |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express 5** | Web framework (native async error handling) |
| **TypeScript** | Strongly typed language |
| **MongoDB / Mongoose 9** | NoSQL database and ODM |
| **Zod** | Schema validation |
| **JWT** | Authentication (Access & Refresh tokens) |
| **Bcrypt.js** | Password hashing |
| **Multer** | File uploads (resumes) |

---

## Setup Instructions

### 1. Clone & Install
```bash
git clone <repository_url>
cd Job_Portal_backend
npm install
```

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
Fill in your specific values in `.env` (like your `MONGO_URI` and JWT secrets).

### 3. Seed the Database
Before running the application, seed it with test data (a recruiter, a job seeker, tags, and jobs).
> **Warning**: Ensure your `.env` is fully populated before running this.
```bash
npm run seed
```

*Test Credentials seeded:*
- Recruiter: `recruiter@example.com` / `Password@123`
- Seeker: `seeker@example.com` / `Password@123`

### 4. Run the Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000` (or the PORT you specified).

---

## Environment Variables

Here is the `.env.example` file with comments:

```env
PORT=5000 # The port the server will run on

# Default: Uses SRV DNS lookup (works in most environments)
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.ecgxrv4.mongodb.net/job_portal?appName=Cluster0

# Alternative: Use the standard connection string if you face DNS SRV (ECONNREFUSED/ENOTFOUND) errors on restricted networks
# MONGO_URI=mongodb://<username>:<password>@cluster0-shard-00-00.ecgxrv4.mongodb.net:27017,cluster0-shard-00-01.ecgxrv4.mongodb.net:27017,cluster0-shard-00-02.ecgxrv4.mongodb.net:27017/job_portal?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0

JWT_ACCESS_SECRET=your_access_secret_key # Secret used to sign access tokens
JWT_REFRESH_SECRET=your_refresh_secret_key # Secret used to sign refresh tokens
JWT_ACCESS_EXPIRY=15m # Access token lifespan
JWT_REFRESH_EXPIRY=7d # Refresh token lifespan
NODE_ENV=development # Node environment (development/production/test)
BCRYPT_SALT_ROUNDS=10 # Number of salt rounds for password hashing
```

---

## Resume Storage Note

For this implementation, **Resumes are stored on the local disk** (`/uploads/resumes/`) to minimize external dependencies during review. 

> **Important**: If deploying to a platform with an ephemeral filesystem (like Render's free tier), uploaded resumes will be lost when the instance restarts. The file saving logic is cleanly isolated in `src/modules/resume/resume.service.ts` inside the `saveResumeFile()` function, making it easy to swap in AWS S3 or Cloudinary for production.

---

## API Documentation

### Auth Module

| Method | Path | Auth Required | Body | Example Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | No | `{ "email": "...", "password": "...", "role": "job_seeker" }` | `201` + accessToken + user object |
| POST | `/api/auth/login` | No | `{ "email": "...", "password": "..." }` | `200` + accessToken + user object |
| POST | `/api/auth/refresh-token` | No (Cookie) | None | `200` + new accessToken |
| POST | `/api/auth/logout` | Yes | None | `200` Success |

### Job Seeker Module

| Method | Path | Auth Required | Body | Example Response |
|---|---|---|---|---|
| GET | `/api/job-seekers/me` | Job Seeker | None | `200` + complete seeker profile |
| PUT | `/api/job-seekers/me` | Job Seeker | `{ "firstName": "..." }` | `200` + updated profile |
| POST | `/api/job-seekers/me/education` | Job Seeker | `{ "universityName": "..." }` | `201` + updated profile |
| PUT | `/api/job-seekers/me/education/:id` | Job Seeker | `{ "endYear": 2024 }` | `200` + updated profile |
| DELETE | `/api/job-seekers/me/education/:id` | Job Seeker | None | `200` + updated profile |
| POST | `/api/job-seekers/me/experience` | Job Seeker | `{ "companyName": "..." }` | `201` + updated profile |
| PUT | `/api/job-seekers/me/experience/:id` | Job Seeker | `{ "field": "..." }` | `200` + updated profile |
| DELETE | `/api/job-seekers/me/experience/:id` | Job Seeker | None | `200` + updated profile |
| POST | `/api/job-seekers/me/projects` | Job Seeker | `{ "title": "..." }` | `201` + updated profile |
| PUT | `/api/job-seekers/me/projects/:id` | Job Seeker | `{ "techStack": [] }` | `200` + updated profile |
| DELETE | `/api/job-seekers/me/projects/:id` | Job Seeker | None | `200` + updated profile |

### Recruiter Module

| Method | Path | Auth Required | Body | Example Response |
|---|---|---|---|---|
| GET | `/api/recruiters/me` | Recruiter | None | `200` + recruiter profile |
| PUT | `/api/recruiters/me` | Recruiter | `{ "designation": "..." }` | `200` + updated profile |
| PUT | `/api/recruiters/me/company` | Recruiter | `{ "name": "..." }` | `200` + updated company |

### Tag Module

| Method | Path | Auth Required | Body | Example Response |
|---|---|---|---|---|
| GET | `/api/tags?appliesOn=skill` | No | None | `200` + array of tags |
| POST | `/api/tags` | Recruiter | `{ "title": "...", "appliesOn": "skill" }` | `201` + tag object |

### Job Module

| Method | Path | Auth Required | Body | Example Response |
|---|---|---|---|---|
| GET | `/api/jobs` | No | None (query params available) | `200` + paginated jobs array |
| GET | `/api/jobs/:id` | No | None | `200` + job object |
| POST | `/api/jobs` | Recruiter | `{ "title": "...", "jobType": "full_time" }` | `201` + job object |
| PUT | `/api/jobs/:id` | Recruiter | `{ "status": "closed" }` | `200` + job object |
| DELETE | `/api/jobs/:id` | Recruiter | None | `200` Success |
| GET | `/api/jobs/recruiter/mine` | Recruiter | None | `200` + array of jobs |

### Resume Module

| Method | Path | Auth Required | Body | Example Response |
|---|---|---|---|---|
| POST | `/api/resumes` | Job Seeker | `form-data` with `resume` file | `201` + resume object |
| GET | `/api/resumes` | Job Seeker | None | `200` + array of resumes |
| PATCH | `/api/resumes/:id/default` | Job Seeker | None | `200` + resume object |
| DELETE | `/api/resumes/:id` | Job Seeker | None | `200` Success |

### Application Module

| Method | Path | Auth Required | Body | Example Response |
|---|---|---|---|---|
| POST | `/api/applications` | Job Seeker | `{ "jobId": "...", "resumeId": "..." }` | `201` + application object |
| GET | `/api/applications/me` | Job Seeker | None | `200` + paginated applications |
| GET | `/api/applications/job/:jobId` | Recruiter | None | `200` + paginated applications |
| PATCH | `/api/applications/:id/status` | Recruiter | `{ "status": "shortlisted" }` | `200` + application object |
| PATCH | `/api/applications/:id/withdraw` | Job Seeker | None | `200` + application object |

---

## Postman Collection

A complete Postman collection is included in the project root: `Job-Portal-Portal.postman_collection.json`.

1. Open Postman.
2. Click **Import** and select the JSON file.
3. The collection uses two variables:
   - `baseUrl` (default: `http://localhost:5000/api`)
   - `accessToken` (set this after logging in via the Auth -> Login endpoint to access protected routes).

---

## Deployment on Render

This project is configured for easy deployment on [Render](https://render.com/).

1. Connect your GitHub repository to Render.
2. Create a new **Web Service**.
3. Render should automatically detect settings from the included `render.yaml`. If not, configure manually:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Set your Environment Variables in the Render Dashboard (`MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`).
5. **Note on Uploads**: Render's free tier uses ephemeral storage. Any resumes uploaded will be deleted when the server spins down due to inactivity or restarts. For a production deployment, configure AWS S3 inside `saveResumeFile()`.
