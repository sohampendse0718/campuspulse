<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Spline-3D-FF69B4?style=for-the-badge&logo=spline&logoColor=white" alt="Spline 3D" />

  <br />
  <br />

  <h1 align="center">CampusPulse 🚀</h1>
  
  <p align="center">
    <strong>A next-generation, interactive campus management and student marketplace platform.</strong>
  </p>
  
  <p align="center">
    Built for modern engineering colleges to streamline issue reporting, foster peer-to-peer commerce, and provide an ultra-premium digital experience for students and staff alike.
  </p>
</div>

---

## ✨ Features

### 1. Smart Issue Reporting 🛠️
Report campus infrastructure issues in seconds.
*   **Duplicate Detection Algorithm**: Before a new issue is submitted, CampusPulse scans for existing similar problems in the same block (e.g., "Fan not working in Block A"). Instead of spamming the database, it intelligently prompts users to **Upvote** the existing issue to escalate its priority!
*   **Real-time Status Tracking**: Watch your issue move from `Open` ➡️ `In Progress` ➡️ `Resolved`.
*   **Photo Evidence**: Snap and upload pictures directly to Supabase Storage.

### 2. GEC Bazaar (Student Marketplace) 🛍️
A dedicated, student-exclusive marketplace for buying, selling, and requesting items.
*   **Sell & Request**: Post your old engineering books, calculators, lab coats, or cycles. Or, post a "Looking For" request if you need something specific.
*   **Zero-Friction WhatsApp Integration**: No clunky in-app chat needed. Buyers click "Message Seller," which instantly opens WhatsApp pre-filled with the item context directly to the seller's registered number.
*   **Auto-Expiry**: Listings automatically expire to keep the marketplace fresh and relevant.
*   **Role-Gated Access**: Strictly accessible only to verified students.

### 3. Spline 3D Integration 🎮
Taking campus portals out of the 90s. CampusPulse integrates beautiful, interactive **Spline 3D** models to make navigating the digital campus feel premium, modern, and engaging.

### 4. Role-Based Dashboards 🔐
Different interfaces tailored for different users:
*   **Students**: Can report issues, track their submissions, and access the GEC Bazaar.
*   **Ground Staff**: Receive targeted alerts, manage assigned tickets, and update issue statuses.
*   **Admins**: Full high-level overview, analytics on resolution times, and system-wide management.

### 5. Advanced Analytics & UI 📊
*   **Interactive Charts**: Built with Recharts to visualize issue resolution rates and category breakdowns.
*   **Dark Mode First**: A stunning, neon-accented dark mode aesthetic featuring glassmorphism, micro-animations, and fluid transitions.

---

## 🏗️ Tech Stack

*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **Backend / BaaS**: Supabase (PostgreSQL, Auth, Storage, RLS)
*   **Styling**: Modern CSS Modules & Inline Styling (Neon / Glassmorphism aesthetics)
*   **3D Rendering**: Spline Design
*   **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   A Supabase Project (Database, Auth, and Storage configured)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/CampusPulse.git
   cd CampusPulse/CityPulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🗄️ Database Schema & Storage

This project utilizes advanced Supabase features, including **Row Level Security (RLS)** to ensure data privacy.

*   `profiles`: Stores user roles (`student`, `ground_staff`, `admin`).
*   `issues`: Stores reported campus issues and their statuses.
*   `bazaar_items`: Powers the student marketplace.
*   **Storage Buckets**: Utilizes `issue-images` and `bazaar-images` for secure media uploads.

*Note: All data fetching heavily utilizes Supabase's PostgREST API with robust JS-side mapping to ensure caching reliability and blistering speed.*

---

<div align="center">
  <p>Built with ❤️ by CampusPulse Team</p>
</div>
