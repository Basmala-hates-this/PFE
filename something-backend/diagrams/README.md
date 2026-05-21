# Backend System - PlantUML Documentation

This directory contains comprehensive PlantUML diagrams for the Something Backend system architecture.

## 📊 Diagram Overview

### 1. **Class Diagram** (`01_ClassDiagram.puml`)
Describes the overall architecture with:
- **Controllers**: Handle API requests (Auth, User, Post, Room, Message, Admin)
- **Repositories**: Data access layer with CRUD operations
- **Middleware**: Authentication, permissions, and file upload handling
- **Services**: Business logic (Auth, User, Email)
- **Database Pool**: Connection management

**Key Features:**
- Shows all classes and their responsibilities
- Displays relationships between layers
- Illustrates the dependency injection pattern
- Helps understand the separation of concerns

---

### 2. **Use Case Diagram** (`02_UseCaseDiagram.puml`)
Defines all user interactions:
- **Actors**: Student, Professor, Admin, Guest, System
- **29 Use Cases** organized by function:
  - Authentication (Register, Login, Reset Password)
  - User Management (Profile, Follow, Upload)
  - Post Management (Create, Vote, Comment)
  - Room Management (Join, Create, Invite, Message)
  - Admin Functions (Approve, Verify, Suspend)

**Key Features:**
- Includes relationships between use cases (extends, includes)
- Shows which actors can perform which actions
- Defines system boundaries and interactions

---

### 3. **Sequence Diagrams** (`03_SequenceDiagrams.puml`)
Five detailed flow scenarios:

#### **Diagram 3.1: User Registration Flow**
Shows the complete registration process:
```
User → Express → AuthController → AuthService → Database → EmailService
```
- Validates email uniqueness
- Hashes password using bcrypt
- Creates JWT token
- Sends welcome email

#### **Diagram 3.2: Post Creation with Validation**
Shows post creation with checks:
```
User → Auth Middleware → Upload Middleware → PostController → Database
```
- JWT verification
- File upload validation
- Suspension checking
- Vote/comment counting

#### **Diagram 3.3: Room Joining Flow**
Shows room membership process:
```
User → Auth Middleware → RoomController → Database
```
- Validates room exists
- Prevents duplicate membership
- Adds user as member
- Fetches user data

#### **Diagram 3.4: Vote & Comment Flow**
Shows parallel operations:
```
Voting: PostController → VoteRepository → Database
Comments: PostController → CommentRepository → Database
```
- Records votes (useful/useless)
- Creates comments
- Updates vote counts

#### **Diagram 3.5: Send Message in Room**
Shows message flow with validations:
```
User → Auth Middleware → MessageController → Database
```
- Verifies room membership
- Checks suspension status
- Records message
- Returns to all members

**Key Features:**
- Uses auto-numbering for clarity
- Shows success and error paths
- Includes notes for important details
- Demonstrates middleware chain

---

### 4. **Entity Relationship & API Routes** (`04_EntityRelationship_and_APIRoutes.puml`)

#### **Part A: ER Diagram**
Shows database schema:
- **14 Tables** with relationships
- **Primary Keys** (PK), **Foreign Keys** (FK), **Unique Keys** (UK)
- **Enums** for status and role fields
- All relationships (1-to-many, many-to-many)

**Key Entities:**
```
Users → Universities, Majors, Rooms, Posts, Messages, Followers
Rooms → RoomMembers, RoomSuspensions, Posts, Messages
Posts → Votes, Comments
```

#### **Part B: API Routes**
Organizes 30+ endpoints by feature:
- **Auth Routes**: 5 endpoints
- **User Routes**: 5 endpoints
- **Post Routes**: 8 endpoints
- **Room Routes**: 8 endpoints
- **Message Routes**: 4 endpoints
- **Admin Routes**: 6 endpoints

**Key Features:**
- All HTTP methods (GET, POST, PUT, DELETE)
- Clear endpoint paths
- Organized by logical grouping

---

## 🏗️ System Architecture

### Layered Architecture
```
┌─────────────────────────────┐
│       HTTP Requests         │
├─────────────────────────────┤
│   Express.js + Middleware   │
│  (Auth, Upload, Validate)   │
├─────────────────────────────┤
│      Controllers            │
│  (Request Handlers)         │
├─────────────────────────────┤
│  Services & Business Logic  │
│  (Auth, User, Email)        │
├─────────────────────────────┤
│    Repositories             │
│  (Data Access Layer)        │
├─────────────────────────────┤
│  PostgreSQL Database        │
└─────────────────────────────┘
```

### Data Flow
1. **Request** → Express receives HTTP request
2. **Middleware** → Authentication, file upload validation
3. **Controller** → Routes to appropriate handler
4. **Service** → Business logic execution
5. **Repository** → Database operations
6. **Response** → JSON response to client

---

## 🔑 Key Design Patterns

### 1. **MVC Architecture**
- **M**odel: Repositories handle data
- **V**iew: JSON responses (API)
- **C**ontroller: Request handling

### 2. **Repository Pattern**
- Abstraction layer for data access
- Database-agnostic operations
- Easy to test and maintain

### 3. **Middleware Chain**
```
Request → Auth Middleware → Upload Middleware → Controller → Response
```

### 4. **Dependency Injection**
- Controllers inject repositories
- Services inject repositories
- Loose coupling between layers

---

## 🔐 Security Features

1. **JWT Authentication**
   - Token verification on protected routes
   - Optional auth for public endpoints
   - Guest blocking for restricted actions

2. **Password Security**
   - bcryptjs hashing (salt rounds: 10)
   - Never storing plain text

3. **Rate Limiting**
   - 200 requests per 15 minutes for public endpoints
   - Prevents abuse

4. **Role-Based Access**
   - Student, Professor, Admin, Guest roles
   - Permission middleware enforces access

5. **Suspension System**
   - Room-level user suspension
   - Prevents posting/messaging when suspended

---

## 📚 Database Schema Highlights

### Core Tables
- **users**: Authentication & profile
- **universities**: Educational institutions
- **majors**: Study programs
- **rooms**: Discussion spaces
- **posts**: Content/discussions
- **comments**: Replies to posts
- **messages**: Room chat

### Relationships
- **Many-to-Many**: Users ↔ Majors, Users ↔ Rooms
- **One-to-Many**: Users → Rooms, Rooms → Posts, Posts → Comments
- **Self-Reference**: Users → Followers (following relationship)

---

## 🚀 Key Endpoints by Feature

### Authentication
```
POST   /api/auth/register              - Create account
POST   /api/auth/login                 - Authenticate
POST   /api/auth/reset-password        - Password recovery
```

### Posts
```
POST   /api/posts                      - Create post
GET    /api/posts/:id                  - Get post details
POST   /api/posts/:id/votes            - Vote useful/useless
POST   /api/posts/:id/comments         - Add comment
```

### Rooms
```
GET    /api/rooms                      - User's rooms
GET    /api/rooms/public-rooms         - Browse public
POST   /api/rooms                      - Create room
POST   /api/rooms/:id/join             - Join room
POST   /api/rooms/:id/messages         - Send message
```

### Admin
```
GET    /api/admin/applications         - View pending approvals
POST   /api/admin/university/approve   - Approve university
POST   /api/admin/professor/verify     - Verify professor
```

---

## 📖 How to Use These Diagrams

1. **For Development**: Use class diagram to understand code structure
2. **For Planning**: Use use case diagram for feature planning
3. **For Debugging**: Use sequence diagrams to trace data flow
4. **For Database**: Use ER diagram for schema understanding
5. **For API Integration**: Use API routes for endpoint reference

---

## 🔄 Common Flows

### User Registration → Login → Post Creation
```
1. User registers (UC1) → stored in database
2. User logs in (UC2) → JWT token issued
3. User creates post (UC11) → validation → database storage
```

### Browse Rooms → Join → Send Message
```
1. User views rooms (UC18)
2. User joins room (UC20) → becomes member
3. User sends message (UC22) → visible to all members
```

### Admin Approval Process
```
1. Professor registers (UC2)
2. Submits verification (UC5)
3. Admin views application (UC24)
4. Admin verifies professor (UC27)
```

---

## 🛠️ Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password**: bcryptjs
- **Email**: Nodemailer
- **File Upload**: Multer
- **Documentation**: PlantUML

---

## 📝 Notes

- All diagrams are in PlantUML format (.puml)
- Can be rendered at [plantuml.com](http://www.plantuml.com)
- Compatible with VS Code PlantUML extension
- Diagrams are auto-numbered for easy reference

---

**Last Updated**: May 21, 2026
**Version**: 1.0
**Status**: Complete

For detailed implementation, refer to the actual source code files.
