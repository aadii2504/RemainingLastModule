
# LearnSphere
A modern digital learning platform focused on a smooth, secure learning experience.

> **Current milestone:** User Story 1 — Login, Authentication & Authorization (Frontend only, no backend integration yet)

---

## Table of Contents
- Overview
- Project Goals
- Current Status
- Demo (Screenshots/GIF)
- Tech Stack
- Getting Started
- Configuration
- Development Workflow
- [roject Structure
- Roadmap
- Contributing
- Code of Conduct
- License
- Acknowledgements
- FAQ

---

## Overview
LearnSphere is being built with **ASP.NET Core** for the web application and **SQL Server** planned for persistence. We are starting with the **authentication and authorization** slice so that user access is secure from day one. For the current milestone, the flows are **mocked** on the frontend—no backend calls yet. This allows rapid UI/UX iteration and role/permission modeling before wiring real services.

---

## Project Goals
- Deliver a clear, usable login experience.
- Establish a role-based authorization model (e.g., Student, Instructor, Admin).
- Keep the architecture maintainable and testable from the start.
- Ship features incrementally with visible milestones.

---

## Current Status
- ✅ **Login UI** (username/password form, validation)  — *Working*
- ✅ **Mocked Authentication** (in-memory user/session simulation) — *Working*
- ✅ **Protected Routes / Views** (authorization gates) — *Working*
- ⏳ **Real Backend Integration** (API + DB) — *coming next*
- ⏳ **Persistent Sessions & Refresh Tokens**
- ⏳ **Role Management UI & Policies**

> **Note:** The app currently simulates auth in the browser/app state. Replace the mock service with the real API client as we progress to the backend milestone.

---

## Demo (Screenshots/GIF)
> After Completion will Add images/GIFs under `docs/` and reference them here.


---

## Tech Stack
- **Frontend**: ASP.NET Core (Razor Pages/MVC), CSS framework (Bootstrap or Tailwind)
- **Backend (planned)**: ASP.NET Core Web API, SQL Server
- **Auth**: Mock service now → JWT & cookie auth later
- **Tooling**: .NET SDK, Visual Studio / VS Code, Git

---

## Getting Started

### Prerequisites
- **.NET SDK** (latest LTS)
- **Visual Studio** or **VS Code** with C# extension
- **Node.js** 

### Clone and Run
```bash
git clone <YOUR_REPO_URL>
cd LearnSphere
# Option A: Visual Studio
#   - Open the solution and press F5
# Option B: VS Code
#   - code .
