# 📍 CampusPulse (CityPulse Sub-App)

**CampusPulse** is a location-based issue reporting and community forum application designed specifically for the **Goa College of Engineering (GEC)** campus. Students, faculty, and campus citizens can report localized issues (infrastructure, Wi-Fi outages, sanitation, lighting, water supply), upvote existing reports, leave comments, and view interactive maps showing real-time issue updates.

---

## 🎨 Design System: High-Tech Neo-Deterministic Dark Aesthetic

The application is styled with a premium **Neo-Deterministic / High-Tech Neo-Minimalist** dark aesthetic:
- **Core Color Palette**:
  - **Background**: Deep slate/charcoal (#090A0F, #12131C) for a premium dark feel.
  - **Accents**: Neon Cyan (#00E5FF) and Electric Purple (#8B5CF6) for highlights and interactive hover effects.
  - **Borders**: Thin border frames (#2A2D3D) that glow upon focus/interaction.
- **Glassmorphism**: Translucent panels featuring subtle backdrops and blurs for modern overlay structures.
- **Interactive Slideshow**: A gorgeous, unified homepage slideshow cycling through GEC campus images (`1.png`, `2.png`, `3.png`) with smooth opacity fades every 6.5 seconds.

---

## 🚀 Key Features

*   **📍 Restricted Campus Map**: Powered by Leaflet, displaying only the bounds of the Goa College of Engineering (GEC) campus to prevent off-campus submissions.
*   **🛠️ Issue Reporting**: Real-time reporting with description, category tags, geo-location coordinate tracking, and photos.
*   **💬 Community Feed**: Social feed where users can see reported issues, like (upvote) them, and write comment threads.
*   **📊 Official Admin Dashboard**: Rich interactive dashboard featuring live charts (powered by Recharts) for category and status distribution, enabling admins to update statuses and upload "after resolution" images.
*   **⚡ Supabase Real-time Sync**: Automatic sync when issues are created or updated across active map instances.

---

## 🛠️ Project Directory Structure

```text
CampusPulse/
├── CityPulse/           # Next.js Frontend Application
│   ├── public/
│   │   └── images/      # GEC Campus static images (1.png, 2.png, 3.png) for slideshow
│   ├── src/
│   │   ├── app/         # Next.js App Router (login, signup, map, feed, report, dashboard)
│   │   │   ├── dashboard/  # Protected Admin Dashboard
│   │   │   ├── feed/       # Public Social Feed of reported issues
│   │   │   ├── login/      # User Login
│   │   │   ├── map/        # Interactive Leaflet Map with campus pins
│   │   │   ├── report/     # Issue Reporting page with pin placement
│   │   │   └── signup/     # User Signup
│   │   ├── components/  # Shared components (Leaflet Map, Navbar)
│   │   └── lib/         # Client library initializers (Supabase integration)
│   └── package.json
└── .env.local           # Environment variables (Supabase URL, publishable key)
```

---

## ⚙️ Setup and Installation Instructions

Follow these steps to run **CampusPulse** locally:

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) (installed with Node.js)

### 2. Configure Environment Variables
Verify the `.env.local` file inside the root of your application contains your correct Supabase Credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

Make sure this file is copied to the `CityPulse/` folder as `CityPulse/.env.local`.

### 3. Supabase Database Schema Setup
Execute the following SQL inside your Supabase **SQL Editor** to prepare the database tables, triggers, policies, and storage buckets:

<details>
<summary><b>Click to Expand Database Setup SQL</b></summary>

```sql
-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Create Profiles Table (Linked to Supabase Auth Users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text check (role in ('citizen', 'municipal_official')) default 'citizen',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can update their own profiles." on public.profiles
  for update using (auth.uid() = id);

-- 3. Create Issues Table
create table public.issues (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  category text not null check (category in ('road', 'lighting', 'sanitation', 'water', 'other')),
  status text not null check (status in ('open', 'in_progress', 'resolved')) default 'open',
  latitude double precision not null,
  longitude double precision not null,
  address text,
  before_image_url text,
  after_image_url text,
  upvotes integer default 0,
  comment_count integer default 0,
  reported_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone
);

-- Enable RLS on Issues
alter table public.issues enable row level security;

-- Issues Policies
create policy "Anyone can view issues" on public.issues
  for select using (true);

create policy "Authenticated users can create issues" on public.issues
  for insert with check (auth.uid() is not null);

create policy "Users or officials can update issues" on public.issues
  for update using (auth.uid() is not null);

-- 4. Create Comments Table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  issue_id uuid references public.issues(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Comments
alter table public.comments enable row level security;

-- Comments Policies
create policy "Anyone can view comments" on public.comments
  for select using (true);

create policy "Authenticated users can post comments" on public.comments
  for insert with check (auth.uid() = user_id);

-- 5. Create Issue Status History Table (for audit trail)
create table public.issue_status_history (
  id uuid default gen_random_uuid() primary key,
  issue_id uuid references public.issues(id) on delete cascade not null,
  old_status text not null,
  new_status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Status History
alter table public.issue_status_history enable row level security;

create policy "Anyone can view status history" on public.issue_status_history
  for select using (true);

create policy "Officials can create status history" on public.issue_status_history
  for insert with check (auth.uid() is not null);

-- 6. Setup Profile trigger for new signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Campus Citizen'),
    coalesce(new.raw_user_meta_data->>'role', 'citizen')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Setup Storage Bucket for Uploaded Images
insert into storage.buckets (id, name, public) 
values ('issue-images', 'issue-images', true)
on conflict do nothing;

create policy "Public Access to Images" on storage.objects 
  for select using (bucket_id = 'issue-images');

create policy "Authenticated Upload Access" on storage.objects 
  for insert with check (
    bucket_id = 'issue-images' 
    and auth.role() = 'authenticated'
  );
```
</details>

### 4. Install Dependencies & Run
Navigate into the `CityPulse` application directory, install packages, and spin up the local development server:

```bash
cd CityPulse
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your browser.

---

## 🛡️ Role & Access Instructions

### 1. Campus Citizen (Reporter)
- Create a normal account using the Signup page.
- Citizen accounts can:
  - Submit issues with pins on the campus map.
  - Upvote/like issues.
  - Post comments in the discussions section.

### 2. Campus Admin (Official Dashboard Access)
- The admin dashboard is protected at the `/dashboard` route.
- To grant an account Admin/Official status:
  1. Go to your **Supabase Project Dashboard** (https://supabase.com).
  2. Open **Table Editor** on the left menu and select the `profiles` table.
  3. Locate your user row.
  4. Edit the `role` column and set it to `'municipal_official'`.
  5. Return to the app and navigate to `/dashboard` to view statistics and manage issues.
