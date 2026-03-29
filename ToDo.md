# SkillsExchange Platform - Development To-Do List

## 1. Authentication & User Accounts
- [ ] **Sign-Up / Registration**
    - [ ] Create registration page with fields: `Name`, `Email`, `Password`.
    - [ ] Implement client-side validation (email format, password strength).
    - [ ] Develop `POST /register` endpoint on the backend.
    - [ ] Ensure `password` field is `NOT NULL` in the database.
    - [ ] Setup auto-login or redirect logic after successful registration.
- [ ] **Login**
    - [ ] Create login page with fields: `Email`, `Password`.
    - [ ] Develop `POST /login` endpoint on the backend.
    - [ ] Implement clear error messaging for invalid credentials.
- [ ] **Session Management**
    - [ ] Implement frontend session/token persistence (JWT or session cookies).
    - [ ] Ensure persistent login state across page refreshes.

- [ ] **Error Handling & Feedback**
    - [ ] Implement a global error-handling middleware on the backend to catch database/trigger errors.
    - [ ] Map database error codes (e.g., Oracle `ORA-xxxxx`) to user-friendly messages.
    - [ ] Create a reusable `Notification` or `Toast` component on the frontend to display these errors.

---

## 2. User Dashboard
- [ ] **Header / Navigation Bar**
    - [ ] Display the logged-in user's name.
    - [ ] Add a functional `Logout` button.
    - [ ] Implement navigation links: `Profile`, `Skills` (Dropdown: `My Skills`, `Find Skills`), `Matches`, `Sessions`.
- [ ] **Dashboard Overview**
    - [ ] Create a personalized landing page (Dashboard).
    - [ ] Show a summary of recent activity (e.g., "Recently Added Skills").
    - [ ] Display status of pending requests and upcoming sessions at a glance.

---

## 3. Skills Management
- [ ] **My Skills (Offered Skills)**
    - [ ] Implement a list/card view of skills the user offers.
    - [ ] Include skill name and proficiency level (`Beginner`, `Intermediate`, `Advanced`).
    - [ ] Add `Edit` and `Delete` actions for each skill.
- [ ] **Add Skill**
    - [ ] Implement `Add New Skill` button that opens a modal or form.
    - [ ] Allow selection of existing skills from `GET /add-skill`.
    - [ ] Support entering new skill names via `POST /add-new-skill`.
    - [ ] Include proficiency level selection.
    - [ ] Show success confirmation message upon addition.
- [ ] **Skill Marketplace (Browse)**
    - [ ] Create a browsable list of all available skills.
    - [ ] Implement a `Learn this` button for each skill.
    - [ ] **Request Skill Modal**:
        - [ ] Submit request to `POST /request-skill`.
        - [ ] **Trigger Handling**: Backend must catch triggers that prevent duplicate or invalid requests and return a `400` or `409` error.
        - [ ] Display "Your request is pending" confirmation or a specific error from the trigger.
    - [ ] Track and display the status of pending learning requests.

---

## 4. Matches & User Discovery
- [ ] **Matches Page**
    - [ ] Fetch and display matched users via `GET /matches/:userId`.
    - [ ] **Match Cards** should show:
        - [ ] Matched user's name.
        - [ ] Average rating.
        - [ ] Skill they offer you.
        - [ ] Skill they want to learn from you.
        - [ ] `Schedule Session` button.
        - [ ] `View Profile` button.
- [ ] **User Profile (Matched Users)**
    - [ ] Create a profile view showing matched user details (name, rating, offered skills + proficiency).
    - [ ] Include a `Schedule a Session` button if a match exists.

---

## 5. Session Management
- [ ] **Schedule Session**
    - [ ] Implement scheduling form: select matched user, pick date and time.
    - [ ] **Backend logic**:
        - [ ] Insert into `sessions` table with `status = 'pending'`.
        - [ ] Set `scheduled_time` as picked.
        - [ ] Default `end_time` to 1 hour after `scheduled_time`.
- [ ] **Session Lifecycle**
    - [ ] Add ability for the other user to accept (`status = 'upcoming'`).
    - [ ] Add ability for the other user to decline (`status = 'cancel'`).
    - [ ] Implement status update to `'complete'` once the session finishes.
- [ ] **Sessions List / Calendar**
    - [ ] Show upcoming sessions (`status = 'upcoming'`).
    - [ ] Entry details: participant, time, skills involved, status label.
    - [ ] Add `Details` button and `Rate` button (visible when complete).

---

## 6. Ratings & Reviews
- [ ] **Rate User Feature**
    - [ ] Create a "Rate User" modal/page triggered after a completed session.
    - [ ] Auto-fill: current user (rater) and other user (rated).
    - [ ] Implement a 1–5 star rating selector.
    - [ ] Add an optional review text field.
    - [ ] Implement `POST /rate-user` endpoint.
    - [ ] **Database Triggers (DBMS Tier)**: 
        - [ ] Add trigger to prevent a user from rating themselves (`rater_id != rated_id`).
        - [ ] Add trigger to automatically update `users.rating_avg` using the `calculate_rating` function after a new rating is inserted.
    - [ ] **Trigger Handling (Backend/Frontend)**: 
        - [ ] Backend logic to catch database triggers (e.g., `-20001` for duplicates).
        - [ ] Frontend must display the specific error message returned by the database trigger (e.g., "You have already rated this user").

---

## 7. User Profile Edit
- [ ] **Profile Management**
    - [ ] Create a profile edit page for `Name`, `Email`, `Password`.
    - [ ] **Security**: Require current password before allowing a password change.
    - [ ] Ensure all required database constraints (like `password NOT NULL`) are maintained.

---

## 8. Search & Filtering
- [ ] **Search Functionality**
    - [ ] Implement search for skills (by name).
    - [ ] Implement search for users.
- [ ] **Filtering**
    - [ ] Add filters for skill name, proficiency levels, and user ratings.
    - [ ] Ensure search and filters work efficiently across the marketplace and matches.

## 9. Database Integrity & Sequences (DBMS)
- [ ] Ensure `users` table has mandatory `NOT NULL` constraints on `name` and `email` fields.
- [ ] Ensure all tables have corresponding sequences and `BEFORE INSERT` auto-ID triggers (add for `matches`, `sessions`, `user_skills`, etc.).
- [ ] Implement a `match_users` stored procedure that correctly populates the `matches` table based on cross-requests.
- [ ] Implement a centralized backend utility to parse Oracle `RAISE_APPLICATION_ERROR` messages and strip the `ORA-20001:` prefix before sending it to the UI.
