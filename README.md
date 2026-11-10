# CAMPUS360

A responsive college-campus portal with student registration/login, a student dashboard,
attendance, assignments and submissions, digital notes, events, notifications, profiles,
and an admin panel.

## Project structure

- `index.html`, `style.css`, `script.js` — public landing page
- `pages/` — student login, registration, and admin login
- `dashboard/` — student-facing portal
- `admin/` — admin management pages
- `server/` — Express API, MongoDB models, authentication, and uploads
- `config.js` — shared frontend API configuration

## Run the frontend

Open the project folder in VS Code and use the Live Server extension, or run any static
web server from this directory. Do not open the pages as `file://` URLs.

## Run the backend locally

1. Install Node.js 20 or later.
2. Open a terminal in `server/`.
3. Install dependencies: `npm install`.
4. Copy `.env.example` to `.env`.
5. Fill in your MongoDB connection string, a new JWT secret, admin email, and bcrypt
   hash for the admin password.
6. Start the API: `npm start`.

The API listens on port `5000` by default. Check `http://localhost:5000/api/health`.

For local frontend testing, open the browser console on the frontend and run:

```js
localStorage.setItem("campus360ApiOrigin", "http://localhost:5000");
```

To return to the deployed API, run:

```js
localStorage.removeItem("campus360ApiOrigin");
```

The frontend defaults to the configured CAMPUS360 Render API. The shared `config.js`
adds the correct student/admin bearer token to API requests.

## Deploy

### Frontend (GitHub Pages)

1. Push the contents of this project folder to a GitHub repository.
2. In GitHub, open **Settings → Pages**.
3. Select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
4. Add the resulting GitHub Pages origin to the backend `CLIENT_ORIGIN` environment
   variable on Render.

### Backend (Render)

1. Create a new **Web Service** from the repository and set the root directory to `server`.
2. Build command: `npm install`
3. Start command: `npm start`
4. Add the environment variables listed in `server/.env.example`.
5. Add the deployed frontend origin to `CLIENT_ORIGIN`.

### MongoDB Atlas

Create a database user and database, allow access from the backend host as appropriate,
and put the connection string in the backend environment variables. Never commit `.env`.

## Security notes

- `.env` and uploaded files are excluded from the project archive and Git.
- Student/admin API requests use bearer tokens.
- Uploaded assignment files are limited to PDF, DOC, or DOCX and 2 MB.
- This is a college-project starter. Before production use, add stronger operational
  controls such as rate limiting, account recovery, audit logging, and managed backups.
