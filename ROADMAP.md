# Project Pro App - Development Roadmap

## Week of October 2, 2025 - Priority Tasks

### 🔐 1. Google Sign-In Resolution (HIGH PRIORITY)
**Status**: Currently not working despite certificate configuration
**Goal**: Finally resolve Google Sign-In authentication

**Investigation Areas**:
- [ ] Verify EAS build certificate fingerprint matches Firebase exactly
- [ ] Test with different Google Sign-In SDK versions
- [ ] Check Android manifest permissions and configurations
- [ ] Validate Firebase project settings and OAuth consent screen
- [ ] Test with fresh Firebase project if needed
- [ ] Consider alternative authentication flows as backup

**Files to Review**:
- `src/screens/AuthScreen.js` - Authentication implementation
- `src/config/firebase.js` - Firebase configuration
- `android/app/google-services.json` - Google Services configuration
- `hooks/prebuild.js` - EAS build configuration

---

### 🎯 2. Clickable Project Cards (MEDIUM PRIORITY)
**Goal**: Make project cards directly navigate to tasks view

**Implementation Plan**:
- [ ] Remove "View" button from project cards
- [ ] Make entire project card touchable
- [ ] Update navigation to pass project data directly
- [ ] Ensure consistent user experience

**Files to Modify**:
- `src/screens/ProjectsScreen.js` - Project card component
- Navigation logic for project → tasks flow

---

### 🎨 3. Light Theme Implementation (MEDIUM PRIORITY)
**Goal**: Create toggleable light/dark theme system

**Implementation Plan**:
- [ ] Create theme context with light/dark modes
- [ ] Design light theme color palette
- [ ] Update all components to use theme context
- [ ] Add theme toggle in settings
- [ ] Persist theme preference in AsyncStorage
- [ ] Test all screens in both themes

**Files to Create/Modify**:
- `src/contexts/ThemeContext.js` - New theme provider
- `src/themes/colors.js` - Color definitions
- All component files - Theme integration
- `src/screens/SettingsScreen.js` - Theme toggle

**Light Theme Color Palette** (Suggested):
```javascript
const lightTheme = {
  background: '#ffffff',
  surface: '#f8fafc',
  primary: '#3b82f6',
  secondary: '#64748b',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
};
```

---

### 👤 4. Profile Management Features (MEDIUM PRIORITY)
**Goal**: Complete user profile functionality

**Features to Implement**:
- [ ] Profile picture upload/change
- [ ] Email address change functionality
- [ ] Password change with current password verification
- [ ] User information display
- [ ] Account deletion option (optional)

**Implementation Plan**:
- [ ] Design profile screen UI
- [ ] Integrate with Firebase Storage for images
- [ ] Implement Firebase Auth email/password updates
- [ ] Add form validation and error handling
- [ ] Test profile picture compression and upload

**Files to Modify**:
- `src/screens/ProfileScreen.js` - Main implementation
- New utility files for image handling
- Firebase configuration for Storage

---

### 📅 5. Calendar View Toggle (LOW PRIORITY)
**Goal**: Add weekly view option to calendar

**Implementation Plan**:
- [ ] Create weekly calendar view component
- [ ] Add view toggle in settings
- [ ] Persist calendar view preference
- [ ] Update calendar navigation for weekly view
- [ ] Ensure data displays correctly in both views

**Files to Modify**:
- `src/screens/CalendarScreen.js` - Add weekly view
- `src/screens/SettingsScreen.js` - View preference toggle
- Calendar utility functions for week calculations

---

## Implementation Priority Order

1. **Google Sign-In** (Must resolve first - blocks user testing)
2. **Clickable Project Cards** (Quick UX improvement)
3. **Light Theme** (Major feature, affects all screens)
4. **Profile Management** (User account features)
5. **Calendar Weekly View** (Enhancement feature)

## Success Metrics

- [ ] Google Sign-In works on both development and production builds
- [ ] Users can navigate projects without extra button taps
- [ ] Complete light/dark theme toggle functionality
- [ ] Full profile management with image upload
- [ ] Calendar supports both monthly and weekly views
- [ ] All features work on both Android and web platforms

## Notes

- Test each feature thoroughly on both platforms
- Maintain backward compatibility during theme implementation
- Consider user feedback for UX improvements
- Keep security best practices for profile management features
- Document all new features as they're implemented

---

*Last Updated: September 26, 2025*
*Next Review: October 2, 2025*