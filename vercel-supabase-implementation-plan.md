Vercel + Supabase implementation plan for Basics_melsele

Goal
- Keep the current React/Vite website
- Add login for authorized users
- Add a database for site content
- Allow authorized users to add and edit simple content from the frontend
- Deploy the frontend on Vercel and the backend/data on Supabase

Recommended stack
- Frontend: React + Vite
- Hosting: Vercel
- Authentication: Supabase Auth
- Database: Supabase PostgreSQL
- Authorization: Supabase Row Level Security policies
- Optional file storage: Supabase Storage

Why this stack
- Minimal change from the current project structure
- Easy deployment from GitHub
- No custom backend required for the first version
- Good fit for structured website content like news, agenda items, sponsors, and page content

Phase 1: Prepare the project
1. Create a Supabase project                          
- Create a new Supabase account/project          V 
- Save the project URL and anon public key       V 
- Choose the region closest to the main users

2. Create a Vercel project
- Connect the GitHub repository to Vercel
- Confirm the build command is npm run build
- Confirm the output directory is dist

3. Add environment variables to Vercel
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

4. Add the Supabase client to the app
- Install @supabase/supabase-js
- Create a small client module in src to initialize Supabase

Phase 2: Define the data model
Suggested tables

1. profiles
- id (uuid, linked to auth.users.id)
- email
- full_name
- role
- created_at

2. news
- id
- title
- summary
- content
- image_url
- published
- created_at
- updated_at
- created_by

3. agenda_items
- id
- title
- description
- location
- start_date
- end_date
- published
- created_at
- updated_at
- created_by

4. activities
- id
- title
- description
- category
- image_url
- published
- created_at
- updated_at
- created_by

5. sponsors
- id
- name
- website_url
- image_url
- sort_order
- published
- created_at
- updated_at

6. pages_content
- id
- page_key
- section_key
- title
- body
- updated_at
- updated_by

Suggested roles
- admin: full access
- editor: create and edit content
- viewer: optional internal read-only role

Phase 3: Secure authentication and permissions
1. Enable Supabase Auth
- Start with email/password login
- Optionally add magic links later

2. Create a profile row for each user
- When a user signs up or is created, ensure they get a matching row in profiles

3. Enable Row Level Security on all content tables
- Public users can read only published content
- Editors can insert and update content
- Admins can delete and manage everything

4. Add policies
- Select published content for anonymous visitors
- Select all relevant content for authenticated editors/admins
- Insert/update only for users whose profile role is editor or admin
- Delete only for admin if you want stricter control

Phase 4: Frontend application changes
1. Add auth pages/components
- Login page
- Logout action
- Session state provider or simple auth context

2. Add protected admin routes
- /admin
- /admin/news
- /admin/agenda
- /admin/activities
- /admin/sponsors
- /admin/pages

3. Add CRUD forms
- Create and edit forms for news
- Create and edit forms for agenda items
- Create and edit forms for activities
- Create and edit forms for sponsors
- Simple page content editor for static text blocks

4. Update public pages to read from Supabase
- Home page loads published content
- Agenda page loads agenda_items
- Partners page loads sponsors
- News/extra sections load news or activities as needed

5. Keep a clean fallback strategy
- During migration, public CSV/static files can remain in place until each section is moved to the database

Phase 5: Admin user flow
1. Admin logs in
2. App checks the logged-in user profile and role
3. If role is admin/editor, show admin dashboard
4. Admin creates or edits content using forms
5. Changes are written to Supabase
6. Public pages immediately read the updated published data

Phase 6: Suggested implementation order in this codebase
1. Install and configure Supabase client
2. Add login page and auth state handling
3. Add profiles table and role check
4. Move one content type first, preferably agenda_items
5. Build one admin CRUD screen for agenda items
6. Replace the public Agenda page data source with Supabase
7. Repeat for news, activities, sponsors, and page sections

Phase 7: Database and policy sketch
Public read policy example logic
- anonymous users can select rows where published = true

Editor write policy example logic
- authenticated users can insert/update rows if their profile role is editor or admin

Admin delete policy example logic
- only authenticated users with profile role admin can delete

Important note
- Never use the Supabase service role key in the frontend
- Only use the anon key in the client

Phase 8: File and image uploads
If admins need to upload images:
- Create a Supabase Storage bucket
- Upload sponsor logos, news images, and activity images there
- Store the public file URL in the relevant database table

Phase 9: Cost and maintenance
Likely low-cost starter setup
- Vercel free or low-tier plan
- Supabase free or starter tier

This is usually enough for:
- Small club websites
- Admin-managed content
- Light to moderate traffic

Phase 10: Concrete tasks to implement in this repo
1. Add dependency
- @supabase/supabase-js

2. Add files
- src/lib/supabase.js
- src/context/AuthContext.jsx or similar
- src/pages/Login.jsx
- src/pages/admin/AdminDashboard.jsx
- src/pages/admin/AdminAgenda.jsx

3. Update routing
- Add login route
- Add protected admin routes

4. Update data loading
- Replace static data source for one section at a time with Supabase queries

5. Add environment usage
- Read VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from import.meta.env

Suggested first milestone
- Login works
- One admin user exists
- Agenda items are stored in Supabase
- Admin can create/edit agenda items from the frontend
- Public Agenda page reads live data from Supabase

Suggested second milestone
- Sponsors and news moved to Supabase
- Basic image uploads enabled

Suggested third milestone
- Simple CMS-style editor for page text blocks
- More refined admin permissions

What I would build first for this project
- Vercel deployment
- Supabase auth
- profiles table with roles
- agenda_items table
- protected admin agenda editor
- public Agenda page connected to the database

After that, the same pattern can be reused across the rest of the site.