# Multi-User Job Tracker 💼

A modern, full-stack **Job Application Tracker** web application designed to help job seekers organize their job search, manage application statuses, and keep track of follow-up tasks in a private, multi-user workspace.

Built with **[Lovable](https://lovable.dev)**, **React**, **TanStack Start**, and **Supabase**.

---

## 📌 Overview

Searching for a job requires managing multiple applications, interviews, notes, and deadlines. **Multi-User Job Tracker** provides a clean, responsive dashboard where users can register, track all their job applications, attach tasks or follow-ups to specific roles, and import existing application data in bulk. Each user's data is isolated and secured using Supabase Authentication and Row Level Security (RLS).

---

## ✨ Features

- 🔐 **Multi-User Authentication**: Secure Sign Up & Sign In powered by Supabase Auth with per-user isolated data storage.
- 📋 **Job Applications Management**:
  - Track company name, position, location, application status, application date, salary details, and notes.
  - Quick filtering and search across active job applications.
  - Direct links to original job postings.
- ⏱️ **Tasks & Follow-up Reminders**:
  - Assign follow-up tasks, interviews, or deadlines to specific job applications.
  - Dedicated Tasks dashboard to view and complete upcoming items.
- 📥 **Bulk Application Import**: Import applications seamlessly via CSV / structured data formats using a built-in import dialog.
- 📱 **Responsive & Intuitive Interface**:
  - Modern design using Tailwind CSS, Radix UI primitives, Lucide icons, and Sonner toast notifications.
  - Full mobile and desktop support.

---

## 🛠️ Tech Stack

- **Frontend & Framework**: [React 19](https://react.dev/), [TanStack Start](https://tanstack.com/start) / [TanStack Router](https://tanstack.com/router)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (Authentication, Database, Realtime & RLS)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/)
- **State & Data Fetching**: TanStack React Query
- **Form Handling & Validation**: React Hook Form, Zod
- **App Builder**: [Lovable](https://lovable.dev)

---

## 🚀 Getting Started (Run Locally)

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **npm**, **pnpm**, or **bun**

### 1. Clone the Repository

```bash
git clone https://github.com/nadineoliver-pro/multi-user-job-tracker.git
cd multi-user-job-tracker
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using Bun:
```bash
bun install
```

### 3. Environment Setup

Create a `.env` file in the root directory (or use the provided `.env` template) with your Supabase credentials:

```env
VITE_SUPABASE_URL="https://<your-supabase-project-id>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-supabase-publishable-key>"
```

### 4. Run the Development Server

Start the local Vite development server:

```bash
npm run dev
```

Or with Bun:

```bash
bun run dev
```

Open your browser and navigate to `http://localhost:5173` (or the URL printed in your terminal).

---

## 🏗️ Building & Scripts

- `npm run dev` - Starts the Vite development server
- `npm run build` - Builds the application for production
- `npm run preview` - Previews the production build locally
- `npm run lint` - Runs ESLint to check for code quality
- `npm run format` - Formats code using Prettier

---

## 💙 Built with Lovable

This project is connected to [Lovable](https://lovable.dev).

- **Ship faster**: Describe what you want to build and Lovable handles the code.
- **Stay in sync**: Every change committed to the default branch automatically syncs with your Lovable workspace editor.

