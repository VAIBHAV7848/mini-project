# Responsive Strategy

## 1. Breakpoints
- **Mobile (`sm` / < 640px)**: 360x800 to 430x932
- **Tablet (`md` / 768px)**: 768x1024
- **Desktop (`lg` / 1024px)**: 1024x768 to 1440x900
- **Large Desktop (`xl` / 1280px+)**: 1920x1080

## 2. Layout Transformations
- **Navigation**:
  - Desktop: Persistent left sidebar + top bar.
  - Mobile: Bottom tab bar for primary routes, hamburger menu for secondary items.
- **Data Tables**:
  - Desktop: Standard multi-column tables.
  - Mobile: Transform into stacked cards (List views) hiding non-essential columns.
- **Dialogs & Drawers**:
  - Desktop: Centered modals or side drawers.
  - Mobile: Bottom sheets or full-screen modals.
- **Forms**:
  - Desktop: Multi-column layouts where logical (e.g., Grid).
  - Mobile: Single column, 100% width inputs.

## 3. Touch & Ergonomics
- Minimum touch target size: `44px x 44px`.
- Primary actions on mobile should be easily reachable by thumb (e.g., sticky bottom action bars).
- Ensure hover states have corresponding active/pressed states for touch devices.
