# Context: Group Expense Splitter App

## Overview
The Group Expense Splitter App is designed to help users efficiently split and manage expenses among a group of people. The app will be built using React Native and Expo for Web, iOS, and Android, with a backend powered by Supabase. The web frontend will be deployed using AWS S3 Buckets and CloudFront, and the UI will be designed using React Native Paper.

## Tech Stack
- **Frontend:** React Native (Expo)
- **Backend:** Supabase (PostgreSQL, Authentication, API Management)
- **UI Framework:** React Native Paper
- **Web Deployment:** AWS S3 Buckets + CloudFront
- **Mobile Deployment:** iOS App Store, Google Play Store

## Application Flow

### 1. Authentication
- Users sign up using an email and password.
- Users log in with their credentials.
- Authentication state is persisted across sessions.
- Password reset functionality is available.

### 2. Home Page (Landing Page)
- Explains the purpose of the app.
- Highlights features and benefits.
- Provides Sign Up and Login options.

### 3. Dashboard (Main Navigation Hub)
- Displays navigation buttons to key pages:
  - Friends
  - Groups
  - Expenses
- Quick action buttons for:
  - Adding friends
  - Creating groups
  - Creating expenses
- Overview of pending balances with friends and groups.

### 4. Friends Management
- Displays a list of friends.
- Users can add friends by email or username.
- Shows balance status with each friend:
  - Green (Friend owes user)
  - Red (User owes friend)
  - Grey (Balance settled)

### 5. Groups Management
- Displays a list of groups the user is part of.
- Each group can be expanded to show:
  - List of friends in the group.
  - Balance owed between users.
- Users can:
  - Create groups (by entering a name).
  - Add friends to groups.
  - View group balances.

### 6. Expenses Management
- Displays a list of expenses the user is part of.
- Expense details include:
  - Expense title and description.
  - Total amount.
  - Number of participants.
  - Amount the user owes or is owed.
- Users can create expenses:
  - Select friends (individually or by group).
  - Enter title, description, and total amount.
  - Automatically split the amount evenly among friends.
  - Adjust individual contributions if needed.
  - Preview and confirm expense before saving.

## Development Phases

### Phase 1: Setup & Authentication
- Initialize React Native Expo project.
- Configure Supabase backend.
- Implement authentication (sign-up, login, password reset).

### Phase 2: Core Features
- Develop Home Page.
- Implement Dashboard with quick actions.
- Build Friends Management:
  - Add/remove friends.
  - Display balance per friend.
- Develop Groups Management:
  - Create groups.
  - Add friends to groups.
  - Show group balances.
- Implement Expenses Management:
  - Create and list expenses.
  - Manage individual contribution adjustments.

### Phase 3: UI/UX Enhancements
- Design UI with React Native Paper.
- Optimize navigation and interactions.
- Improve animations and loading states.

### Phase 4: Testing & Debugging
- Perform unit and integration testing.
- Fix UI and backend bugs.
- Optimize performance.

### Phase 5: Deployment
- Deploy web version to AWS S3 & CloudFront.
- Publish to iOS App Store and Google Play Store.

## Future Enhancements
- Notifications for expense updates.
- OCR scanning for receipts.
- Currency conversion.
- Multi-language support.

This structured context provides a comprehensive breakdown of the app’s architecture, flow, and features for developers to follow during development.