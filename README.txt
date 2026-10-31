B.Tech Student Dashboard

Open index.html with a local development server (such as VS Code Live Server). Keep index.html, style.css and script.js together.

Cloud sync requires internet access, Supabase Auth configured, and a student_data table with columns user_id, key and value; enforce row-level security so each user accesses only their own rows. Add a UNIQUE constraint on (user_id, key) for upsert.

The public Supabase publishable key is intended for browser use, but do not embed service-role keys.

Changes: split inline CSS/JS; scoped database reads to user; explicit upsert conflict key; clearer failure messages; sign-up email-confirmation handling; time validations; timer based on elapsed real time; date handling improvement; defensive loaded-data checks.
