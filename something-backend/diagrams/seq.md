```mermaid
sequenceDiagram
  actor User
  participant Frontend
  participant Backend
  participant DB
  actor Admin
  actor SuperAdmin

  User->>Frontend: Browse app
  Frontend->>Backend: Fetch data
  Backend->>DB: Query data
  DB-->>Backend: Return data
  Backend-->>Frontend: Send response
  Frontend-->>User: Display content

  User->>Frontend: Create post
  Frontend->>Backend: Submit post
  Backend->>DB: Save post
  DB-->>Backend: Confirm
  Backend-->>Frontend: Post created
  Frontend-->>User: Show post

  User->>Frontend: Join room
  Frontend->>Backend: Request join
  Backend->>DB: Add member
  DB-->>Backend: Success
  Backend-->>Frontend: Joined
  Frontend-->>User: Enter room

  User->>Frontend: Send message
  Frontend->>Backend: Send message
  Backend->>DB: Store message
  DB-->>Backend: Saved
  Backend-->>Frontend: Message sent
  Frontend-->>User: Display message

  Admin->>Frontend: Access admin panel
  Frontend->>Backend: Fetch applications
  Backend->>DB: Get pending requests
  DB-->>Backend: Applications list
  Backend-->>Frontend: Show list
  Frontend-->>Admin: Display approvals

  Admin->>Frontend: Approve request
  Frontend->>Backend: Submit approval
  Backend->>DB: Update status
  DB-->>Backend: Confirmed
  Backend-->>Frontend: Success
  Frontend-->>Admin: Show confirmation

  SuperAdmin->>Frontend: Select user
  Frontend->>Backend: Suspend user
  Backend->>DB: Mark suspended
  DB-->>Backend: Updated
  Backend-->>Frontend: Suspended
  Frontend-->>SuperAdmin: Confirm suspension