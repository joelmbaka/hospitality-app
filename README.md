# Tukutane Events App

## Internship Challenge Submission

### Overview
This is my submission for the Tukutane Internship Challenge. I've built a mobile application using React Native (Expo) and Supabase that showcases event discovery and management. The app goes beyond the basic requirements by implementing additional features that demonstrate my full-stack development skills.

### Features

#### Core Requirements
- ✅ Event listing with real data from Supabase
- ✅ Event details with image, name, category, and RSVP functionality
- ✅ Clean, responsive UI built with React Native Elements

#### Bonus Features
- 🔒 User authentication (Sign In/Sign Up)
- 📅 Save events to device calendar
- 🔍 Advanced filtering and search functionality
- 💾 Offline support with AsyncStorage
- 🔄 Pull-to-refresh for latest events
- 🌐 Cross-platform (iOS, Android, Web)

### Tech Stack
- **Frontend**: React Native (Expo)
- **UI Components**: React Native Elements
- **Backend**: Supabase
  - Authentication
  - Real-time Database
  - Storage for event images
- **Navigation**: React Navigation
- **State Management**: React Context API
- **Icons**: Expo Vector Icons

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Tukutane
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the development server**
   ```bash
   pnpm start
   ```

### Project Structure
```
Tukutane/
├── app/                 # Main application code
│   ├── (tabs)/          # Tab navigation
│   ├── auth/            # Authentication screens
│   ├── _layout.tsx      # Root layout
│   └── +not-found.tsx   # 404 page
├── assets/             # Static assets
├── lib/
│   └── supabase.ts     # Supabase client configuration
└── supabase/           # Database migrations and types
```

### Demonstration
[Include screenshots or a video demo here]

### Additional Notes
- The app follows modern React Native best practices
- Clean and maintainable code structure
- Proper error handling and loading states
- Responsive design for various screen sizes

### Future Enhancements
- Push notifications for event reminders
- Social sharing of events
- User profiles and event history
- Rating and review system for events

### Submission Details
Submitted by: Joel Mbaka  
Email: [Your Email]  
Date: July 22, 2025
