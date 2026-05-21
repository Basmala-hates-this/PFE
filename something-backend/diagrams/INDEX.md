# 🎯 Backend System - PlantUML Diagrams Index

Complete documentation of the Something Backend system with **4 comprehensive PlantUML diagrams** and detailed documentation.

---

## 📂 Files Overview

### Diagram Files
| File | Diagram Type | Purpose | Contains |
|------|-----------|---------|----------|
| `01_ClassDiagram.puml` | **Class Diagram** | Architecture & components | 6 Controllers, 6 Repositories, 3 Middleware, 3 Services |
| `02_UseCaseDiagram.puml` | **Use Case Diagram** | User interactions & roles | 4 Actors, 29 Use Cases, 6 feature groups |
| `03_SequenceDiagrams.puml` | **Sequence Diagrams** | Data flows & processes | 5 detailed flow scenarios |
| `04_EntityRelationship_and_APIRoutes.puml` | **ER + API Routes** | Database & endpoints | 14 Entities, 30+ API endpoints |
| `README.md` | **Documentation** | System overview | Architecture, patterns, security, endpoints |

### Combined Files
| File | Location | Purpose |
|------|----------|---------|
| `test.puml` | `../test.puml` | All 4 diagrams in one file (for easy reference) |

---

## 🎨 Diagram Details

### 1️⃣ Class Diagram
**File:** `01_ClassDiagram.puml`

Shows the complete architecture with all components:

```
┌─ Controllers (6)
│  ├─ AuthController
│  ├─ UserController
│  ├─ PostController
│  ├─ RoomController
│  ├─ MessageController
│  └─ AdminController
│
├─ Repositories (6)
│  ├─ UserRepository
│  ├─ PostRepository
│  ├─ CommentRepository
│  ├─ VoteRepository
│  ├─ RoomRepository
│  └─ MessageRepository
│
├─ Middleware (3)
│  ├─ AuthMiddleware
│  ├─ PermissionMiddleware
│  └─ UploadMiddleware
│
├─ Services (3)
│  ├─ AuthService
│  ├─ UserService
│  └─ EmailService
│
└─ Database
   └─ DatabasePool
```

**Use this to:**
- Understand component responsibilities
- See dependencies between layers
- Identify which classes interact

---

### 2️⃣ Use Case Diagram
**File:** `02_UseCaseDiagram.puml`

Defines all system functionality organized by actor:

```
👤 ACTORS (4):
├─ Student User     (registers, creates posts, joins rooms)
├─ Professor User   (needs verification, same as student + approval)
├─ Admin User       (manages approvals, suspensions, logs)
└─ Guest User       (read-only: view posts, profiles, browse rooms)

📋 FEATURES (6 groups):
├─ Authentication (5 use cases)
│  ├─ Register, Login, Logout, Reset Password, Verify OTP
├─ User Profile (5 use cases)
│  ├─ View/Edit profile, Upload picture, Follow user, View others
├─ Posts (7 use cases)
│  ├─ Create, View, Edit, Delete, Vote, Comment, Search
├─ Rooms (6 use cases)
│  ├─ Browse, Create, Join, Leave, Invite, Send messages
└─ Admin (6 use cases)
   └─ Approvals, Verifications, Suspensions, Logs
```

**Use this to:**
- Understand user roles and permissions
- Identify all system features
- Plan testing scenarios

---

### 3️⃣ Sequence Diagrams
**File:** `03_SequenceDiagrams.puml`

Five detailed interaction flows showing step-by-step processes:

#### **Flow 1: User Registration** (14 steps)
```
User → Express → AuthController → AuthService → Database → EmailService
- Validate email uniqueness
- Hash password
- Create user record
- Generate JWT token
- Send welcome email
```

#### **Flow 2: Create Post** (20+ steps)
```
User → Auth Middleware → Upload Middleware → PostController → Database
- Verify JWT token
- Validate file upload
- Check user suspension
- Create post record
- Calculate vote counts
```

#### **Flow 3: Join Room** (15+ steps)
```
User → Auth Middleware → RoomController → Database
- Authenticate user
- Find room
- Add member record
- Fetch user data
```

#### **Flow 4: Vote & Comment** (Parallel operations)
```
Vote Flow:    PostController → VoteRepository → Database
Comment Flow: PostController → CommentRepository → Database
(Both update post metrics)
```

#### **Flow 5: Send Message** (18+ steps)
```
User → Auth Middleware → MessageController → Database
- Verify room membership
- Check suspension status
- Create message record
```

**Use this to:**
- Trace data flow through system
- Debug issues
- Understand error handling paths
- See middleware chain in action

---

### 4️⃣ Entity Relationship & API Routes
**File:** `04_EntityRelationship_and_APIRoutes.puml`

Two related diagrams:

#### **Part A: ER Diagram (14 Entities)**
```
USERS ──┬─→ UNIVERSITIES
        ├─→ MAJORS (via USER_MAJORS)
        ├─→ ROOMS (creates)
        ├─→ ROOM_MEMBERS (joins)
        ├─→ POSTS (writes)
        ├─→ VOTES (gives)
        ├─→ COMMENTS (creates)
        ├─→ MESSAGES (sends)
        ├─→ FOLLOWERS (self-referential)
        └─→ ADMIN_APPLICATIONS (submits)

ROOMS ──┬─→ ROOM_MEMBERS
        ├─→ ROOM_SUSPENSIONS
        ├─→ POSTS
        └─→ MESSAGES

POSTS ──┬─→ VOTES
        └─→ COMMENTS
```

**Key Tables:**
- `users` - Core user data with roles
- `rooms` - Discussion spaces (public/private)
- `posts` - Main content
- `comments` - Replies
- `messages` - Room chat
- `followers` - Social connections

#### **Part B: API Routes (30+ Endpoints)**
```
AUTHENTICATION (5)
├─ POST   /api/auth/register
├─ POST   /api/auth/login
├─ POST   /api/auth/logout
├─ POST   /api/auth/reset-password
└─ POST   /api/auth/verify-otp

USERS (5)
├─ GET    /api/users/me
├─ PUT    /api/users/me
├─ GET    /api/users/:id
├─ POST   /api/users/:id/follow
└─ DELETE /api/users/:id/follow

POSTS (8)
├─ POST   /api/posts
├─ GET    /api/posts/:id
├─ PUT    /api/posts/:id
├─ DELETE /api/posts/:id
├─ GET    /api/posts
├─ POST   /api/posts/:id/votes
├─ POST   /api/posts/:id/comments
└─ GET    /api/posts/:id/comments

ROOMS (8)
├─ GET    /api/rooms
├─ GET    /api/rooms/public-rooms
├─ POST   /api/rooms
├─ GET    /api/rooms/:id
├─ POST   /api/rooms/:id/join
├─ DELETE /api/rooms/:id/leave
├─ POST   /api/rooms/:id/invite
└─ POST   /api/rooms/:id/suspend

MESSAGES (4)
├─ POST   /api/rooms/:roomId/messages
├─ GET    /api/rooms/:roomId/messages
├─ DELETE /api/rooms/:roomId/messages/:msgId
└─ PUT    /api/rooms/:roomId/messages/:msgId

ADMIN (6)
├─ GET    /api/admin/applications
├─ POST   /api/admin/university/approve
├─ POST   /api/admin/major/approve
├─ POST   /api/admin/professor/verify
├─ POST   /api/admin/suspend
└─ GET    /api/admin/logs
```

**Use this to:**
- Design database queries
- Implement new features
- Build API clients
- Understand data relationships

---

## 🚀 How to View Diagrams

### Option 1: Online (Fastest)
1. Go to http://www.plantuml.com/plantuml/uml/
2. Copy & paste content from `.puml` files
3. Diagrams render automatically

### Option 2: VS Code Extension
1. Install "PlantUML" extension
2. Right-click `.puml` file
3. Select "Preview Current Diagram"

### Option 3: Command Line
```bash
# Install PlantUML
npm install -g plantuml

# Generate PNG
plantuml 01_ClassDiagram.puml -o ../output

# Generate SVG
plantuml 01_ClassDiagram.puml -tsvg -o ../output
```

### Option 4: Browser Extension
- Install "PlantUML Viewer" for Chrome/Firefox
- Open `.puml` files directly

---

## 📊 Quick Statistics

| Metric | Count |
|--------|-------|
| **Controllers** | 6 |
| **Repositories** | 6 |
| **Middleware** | 3 |
| **Services** | 3 |
| **Actors** | 4 |
| **Use Cases** | 29 |
| **Sequence Flows** | 5 |
| **Database Tables** | 14 |
| **API Endpoints** | 30+ |
| **Total Classes/Entities** | 40+ |

---

## 🔐 Security Overview

**Authentication**
- JWT token-based (jsonwebtoken)
- Protected routes middleware
- Optional auth for public endpoints
- Guest blocking for restricted actions

**Data Protection**
- Password hashing (bcryptjs, salt: 10)
- Role-based access control
- Room suspension system
- Rate limiting (200 req/15 min)

**Data Access**
- Repository pattern for abstraction
- Database pooling
- Parameterized queries (SQL injection prevention)

---

## 🏗️ Architecture Principles

1. **Layered Architecture**
   - Separation of concerns
   - Each layer has specific responsibility

2. **Repository Pattern**
   - Abstraction of data access
   - Easy to test and maintain
   - Database-agnostic

3. **Middleware Chain**
   - Authentication → Validation → Handler
   - Reusable components

4. **Dependency Injection**
   - Controllers inject repositories
   - Loose coupling
   - Easy to mock for testing

---

## 📚 Related Documentation

- Full documentation: See `README.md` in this directory
- Architecture details: Class Diagram
- User interactions: Use Case Diagram  
- Process flows: Sequence Diagrams
- Data model: ER Diagram
- API reference: API Routes

---

## ✅ Diagram Coverage

### What's Included ✓
- Complete architecture visualization
- All user interactions and roles
- Detailed data flows with error handling
- Database schema with relationships
- All API endpoints organized by feature
- Security mechanisms
- Middleware chain
- Service interactions

### Diagram Features ✓
- Auto-numbered steps for clarity
- Success and error paths
- Parallel operations shown
- Color-coded packages
- Clear relationships and dependencies
- Comprehensive legends and notes

---

## 📝 Version Info

| Item | Value |
|------|-------|
| **Created** | May 21, 2026 |
| **Format** | PlantUML (.puml) |
| **Version** | 1.0 |
| **Status** | Complete |
| **Framework** | Express.js + PostgreSQL |
| **Documentation Level** | Comprehensive |

---

## 🎯 How to Use

### For Developers
→ Start with **Class Diagram** to understand code structure

### For Architects
→ Check **Use Case Diagram** for system scope and actors

### For Debugging
→ Follow **Sequence Diagrams** to trace execution flow

### For Database Work
→ Reference **ER Diagram** for schema and relationships

### For API Integration
→ Use **API Routes** diagram for endpoint reference

### For Testing
→ Use **Sequence Diagrams** for test case design

---

## 🔗 Navigation

| Want to... | Look at... |
|-----------|-----------|
| Understand code structure | 01_ClassDiagram.puml |
| See all features | 02_UseCaseDiagram.puml |
| Trace a process | 03_SequenceDiagrams.puml |
| Design a feature | 04_EntityRelationship_and_APIRoutes.puml |
| Learn the system | README.md |
| Quick overview | This file |

---

**For questions or updates, refer to the comprehensive README.md in this directory.**
