# Comprehensive Testing Manual - Felicity Event Management System

This manual provides a step-by-step guide to verify all functionalities required by Assignment 1. It covers happy paths, edge cases, and specific role-based workflows.

---

## 🟢 Part 1: Authentication & Security

### 1.1 Participant Registration (Bot Protection & Validation)
**Ref:** Section 4.1.1, 13.3 (Tier C - Bot Protection)

1.  **Test Case: UI & Captcha**
    *   **Action**: Go to `/register`. Attempt to submit empty form.
    *   **Expected**: HTML5 validation errors or toast notifications for required fields.
    *   **Action**: Fill form but leave ReCAPTCHA unchecked.
    *   **Expected**: "Please verify you are not a robot" error.

2.  **Test Case: IIIT Student Validation**
    *   **Action**: Select "IIIT Student". Enter email `student@gmail.com`.
    *   **Expected**: Error: "IIIT students must use @iiit.ac.in email".
    *   **Action**: Enter email `student@iiit.ac.in`.
    *   **Expected**: Registration successful.

3.  **Test Case: Non-IIIT Student**
    *   **Action**: Select "Non-IIIT". Enter `student@gmail.com`.
    *   **Expected**: Registration successful.

### 1.2 Organizer Login (No Self-Registration)
**Ref:** Section 4.1.2

1.  **Test Case: Restricted Access**
    *   **Action**: Check `/register` page.
    *   **Expected**: No option to register as "Organizer" or "Admin".

2.  **Test Case: Organizer Login**
    *   **Action**: Login with known Organizer credential (e.g., `music_club@felicity.com`).
    *   **Expected**: Redirect to Organizer Dashboard.

### 1.3 Session Management
**Ref:** Section 4.3

1.  **Test Case: Persistence**
    *   **Action**: Login as Participant. Close browser tab. Reopen and go to `/dashboard`.
    *   **Expected**: User is still logged in.
    *   **Action**: Click "Logout". Try accessing `/dashboard`.
    *   **Expected**: Redirect to Login page.

---

## 🟢 Part 2: Admin Features

### 2.1 Manage Organizers
**Ref:** Section 11.2

1.  **Test Case: Create Organizer**
    *   **Action**: Login as Admin. Go to "Manage Organizers". Click "Add New".
    *   **Input**: Name: "Robotics Club", Category: "Technical", Email: "robotics@felicity.com".
    *   **Expected**: System generates a password (displayed or emailed). Organizer account is created.

2.  **Test Case: Login with New Account**
    *   **Action**: Logout Admin. Login with `robotics@felicity.com` and the generated password.
    *   **Expected**: Successful login.

3.  **Test Case: Delete/Remove Organizer**
    *   **Action**: Login as Admin. Find "Robotics Club". Click "Delete".
    *   **Expected**: Organizer removed.
    *   **Action**: Try logging in as "Robotics Club".
    *   **Expected**: Login failed (Invalid credentials/User not found).

### 2.2 Organizer Password Reset (Advanced Tier B)
**Ref:** Section 13.2.2

1.  **Test Case: Request Reset (Organizer Side)**
    *   **Action**: Login as Organizer. Profile -> "Request Password Reset".
    *   **Input**: Reason: "Forgot password".
    *   **Expected**: Status changes to "Pending".

2.  **Test Case: Approve Reset (Admin Side)**
    *   **Action**: Login as Admin. Go to "Password Requests".
    *   **Action**: See request from Organizer. Click "Approve".
    *   **Expected**: New password generated and displayed. Status changes to "Approved".

3.  **Test Case: Reject Reset**
    *   **Action**: Reject a different request.
    *   **Expected**: Status "Rejected". Organizer sees rejection in their profile.

---

## 🟢 Part 3: Organizer Features

### 3.1 Event Creation
**Ref:** Section 10.4

1.  **Test Case: Create Normal Event**
    *   **Action**: Dashboard -> "Create Event".
    *   **Input**: Type: "Normal", Name: "Hackathon 2026", Team Size: Min 2, Max 4. Fee: 500.
    *   **Expected**: Event created in "Draft" state.

2.  **Test Case: Create Merchandise Event**
    *   **Action**: Create Event -> Type: "Merchandise".
    *   **Input**: Items: "T-Shirt" (Sizes: S, M, L), Stock: 50.
    *   **Expected**: Merchandise event created.

3.  **Test Case: Publish Event**
    *   **Action**: Edit Draft -> Click "Publish".
    *   **Expected**: Status changes to "Published". Visible to Participants.

### 3.2 Payment Verification (Advanced Tier A)
**Ref:** Section 13.1.2

1.  **Test Case: View Proofs**
    *   **Action**: Go to "Payment Approvals" (or specific event dashboard).
    *   **Expected**: List of pending registrations with "View Proof" buttons.

2.  **Test Case: Approve/Reject**
    *   **Action**: Click "View Proof" (opens image). Click "Approve".
    *   **Expected**: Registration status -> "Confirmed". Sales count increases. Inventory decreases (if merchandise).
    *   **Action**: Click "Reject".
    *   **Expected**: Registration status -> "Rejected" (or Pending Payment).

### 3.3 Analytics
**Ref:** Section 10.2, 10.3

1.  **Test Case: Dashboard Stats**
    *   **Action**: View Organizer Dashboard.
    *   **Expected**: Charts/Cards showing Total Registrations, Revenue.

---

## 🟢 Part 4: Participant Features

### 4.1 Browse & Search
**Ref:** Section 9.3

1.  **Test Case: Search Filters**
    *   **Action**: Go to Browse Events. Search "Hackathon".
    *   **Expected**: Shows only "Hackathon 2026".
    *   **Action**: Filter by "Merchandise".
    *   **Expected**: Shows only merchandise events.

### 4.2 Application Flow (Individual Event)
1.  **Test Case: Register (Free)**
    *   **Action**: Select a Free Event. Click Register.
    *   **Expected**: Instant "Confirmed" status. Ticket/QR generated.

### 4.3 Hackathon Team Registration (Advanced Tier A)
**Ref:** Section 13.1.1

1.  **Test Case: Create Team (Leader)**
    *   **Action**: Select "Hackathon 2026". Choice: "Create Team".
    *   **Input**: Team Name: "CodeWizards".
    *   **Expected**: Team created. Invite Code generated (e.g., `CW-1234`). Status "Pending".

2.  **Test Case: Join Team (Member)**
    *   **Action**: Login as *different* Participant. Select same event. Choice: "Join Team".
    *   **Input**: Code `CW-1234`.
    *   **Expected**: Added to team.
    *   **Edge Case**: Try joining full team. Expected: Error "Team is full".

3.  **Test Case: Team Confirmation**
    *   **Action**: Fill team to Min required size.
    *   **Expected**: Status updates to "Confirmed" (if free) or "Pending Payment" (if paid).

### 4.4 Merchandise Purchase & Payment Proof
1.  **Test Case: Purchase Workflow**
    *   **Action**: Select Merchandise Event. Choose "T-Shirt - M". Qty: 1.
    *   **Action**: Checkout. Upload "fake_payment.jpg". Submit.
    *   **Expected**: Order placed. Status "Pending Approval". Ticket NOT generated yet.

2.  **Test Case: Post-Approval**
    *   **Action**: (After Organizer approves in Step 3.2). Check "My Events".
    *   **Expected**: Status "Confirmed". Ticket "Download" button active.

---

## 🟢 Part 5: Real-Time Features (Tier B)

### 5.1 Team Chat
**Ref:** Section 13.2.3

1.  **Test Case: Access Chat**
    *   **Pre-requisite**: Must be in a confirmed team (from Step 4.3).
    *   **Action**: Go to "My Events" -> Click "Team Chat" on Hackathon event.
    *   **Expected**: Chat interface loads.

2.  **Test Case: Real-time Messaging**
    *   **Action**: User A sends "Hello Team".
    *   **Action**: User B (in same team, different browser/incognito) views chat.
    *   **Expected**: User B sees "Hello Team" instantly without refresh.

### 5.2 Discussion Forum (Event Level)
1.  **Test Case: Post Comment**
    *   **Action**: Go to Event Details page. Scroll to Discussion.
    *   **Action**: Post "Is laptops provided?".
    *   **Expected**: Comment appears.

---

## 🟢 Part 6: Profile & Preferences

### 6.1 Profile Management
**Ref:** Section 9.6

1.  **Test Case: Edit Details**
    *   **Action**: Profile -> Edit. Change Phone Number. Save.
    *   **Expected**: Updated.
    *   **Edge Case**: Try changing Email (Should be read-only).

### 6.2 Interests
1.  **Test Case: Select Interests**
    *   **Action**: Select "Coding", "Music". Save.
    *   **Action**: Check Browse Events (if recommendation logic exists).
    *   **Expected**: Coding events sorted higher (if implemented) or saved in profile.

---

## 🔴 Edge Cases & Security Checks

1.  **Route Protection**
    *   **Action**: Try accessing `/admin/dashboard` as Participant.
    *   **Expected**: Redirect to Login or 403 Forbidden.

2.  **Duplicate Registration**
    *   **Action**: Register for "Hackathon 2026". Try registering again for same event.
    *   **Expected**: Error "Already registered".

3.  **Out of Stock**
    *   **Action**: Purchase last item of T-Shirt.
    *   **Action**: Try purchasing another.
    *   **Expected**: "Out of Stock" button disabled or error on submit.

4.  **Team Constraints**
    *   **Action**: Leader tries to finalize team with 1 member (when Event Min Size = 2).
    *   **Expected**: Error "Minimum team size not met".

