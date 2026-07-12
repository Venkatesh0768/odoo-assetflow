# Testing Guide - Bug Fixes Verification

## Prerequisites

1. Ensure backend and frontend are running:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend  
   cd frontend
   npm run dev
   ```

2. Login as admin user to access all features

---

## Test 1: Dashboard Recent Activity - Valid Dates ✓

**Location**: `/dashboard` (Home page)

### Steps:
1. Navigate to the Dashboard home page
2. Scroll to the "Recent Activity" section
3. Verify activity entries show proper dates

### Expected Results:
- ✅ Dates display as "Jan 15", "Feb 12", "Dec 25", etc.
- ✅ NO "Invalid Date" messages
- ✅ Most recent activities appear at the top
- ✅ Each activity has a readable timestamp

### Screenshots to Verify:
- Activity log shows dates on the right side
- Format matches: `{Month} {Day}` (e.g., "Jan 5")

---

## Test 2: Department Head & Parent - Proper Display ✓

**Location**: `/dashboard/org-setup` → Departments Tab

### Part A: View Existing Departments

1. Navigate to Organization Setup
2. Click on "Departments" tab
3. Look at the table columns: Department | Head | Parent Dept | Status | Actions

### Expected Results:
- ✅ "Head" column shows user names (or "—" if none assigned)
- ✅ "Parent Dept" column shows parent department names (or "—" if top-level)
- ✅ NOT showing blank for departments that have heads assigned

### Part B: Create New Department with Head

1. Click "+ Add Department"
2. Fill in department name: "Test Department"
3. Select a user from "Department Head" dropdown
4. Optionally select "Parent Department"
5. Click "Create"

### Expected Results:
- ✅ Toast notification: "Department created successfully!" (green)
- ✅ Form closes automatically
- ✅ New department appears in table
- ✅ Selected head name shows in "Head" column
- ✅ Selected parent shows in "Parent Dept" column

---

## Test 3: Employee Role Assignment - Working & Updating ✓

**Location**: `/dashboard/org-setup` → Employees Tab

### Steps:
1. Navigate to Organization Setup
2. Click on "Employees" tab
3. Find any employee (not yourself)
4. Click "Change Role" button
5. Select a new role from the dropdown (e.g., "Department Head")
6. Click "Save Role"

### Expected Results:
- ✅ Toast notification: "Role updated to 'department_head' successfully!" (green)
- ✅ Inline form closes immediately
- ✅ Role badge updates instantly to show new role
- ✅ Badge color changes based on role:
  - Admin → Green
  - Asset Manager → Yellow
  - Department Head → Yellow
  - Employee → Gray

### Test Different Roles:
- employee → department_head
- department_head → asset_manager
- asset_manager → admin
- All should update immediately with toast confirmation

---

## Test 4: Toast Notifications - All CRUD Operations ✓

### Test 4A: Department Operations

**Location**: `/dashboard/org-setup` → Departments Tab

1. **Create Department**:
   - Click "+ Add Department"
   - Fill name, select head/parent
   - Submit
   - **Expect**: Green toast "Department created successfully!"

2. **Activate/Deactivate Department**:
   - Click "Deactivate" on any active department
   - **Expect**: Green toast "Department deactivated"
   - Click "Activate" on the same department
   - **Expect**: Green toast "Department activated"

### Test 4B: Category Operations

**Location**: `/dashboard/org-setup` → Categories Tab

1. **Create Category**:
   - Click "+ Add Category"
   - Fill name and description
   - Submit
   - **Expect**: Green toast "Category created successfully!"

### Test 4C: Employee Operations

**Location**: `/dashboard/org-setup` → Employees Tab

1. **Change Role** (tested above):
   - **Expect**: Green toast "Role updated to '{role}' successfully!"

2. **Activate/Deactivate User**:
   - Click "Deactivate" on an active user
   - **Expect**: Green toast "User deactivated"
   - Click "Activate"
   - **Expect**: Green toast "User activated"

### Test 4D: Asset Operations

**Location**: `/dashboard/assets`

1. **Register Asset**:
   - Click "+ Register Asset"
   - Fill required fields (Name, Category)
   - Submit
   - **Expect**: Green toast "Asset registered successfully!"
   - Form closes automatically

2. **Validation Error**:
   - Click "+ Register Asset"
   - Leave required fields empty
   - Submit
   - **Expect**: Red toast with error message

### Test 4E: Allocation Operations

**Location**: `/dashboard/allocations`

1. **Allocate Asset**:
   - Click "Allocate Asset"
   - Select available asset and user
   - Submit
   - **Expect**: Green toast "Asset allocated successfully!"

2. **Return Asset**:
   - Click "Return" on any active allocation
   - Fill condition and notes
   - Submit
   - **Expect**: Green toast "Asset returned successfully!"

3. **Transfer Request**:
   - Switch to "Transfer Requests" tab
   - Click "Request Transfer"
   - Select asset and recipient
   - Submit
   - **Expect**: Green toast "Transfer request submitted!"

4. **Approve Transfer**:
   - Click "Approve" on any pending transfer
   - **Expect**: Green toast "Transfer approved!"

5. **Reject Transfer**:
   - Click "Reject" on any pending transfer
   - Enter rejection reason
   - **Expect**: Yellow/Warning toast "Transfer rejected."

---

## Toast Notification Behavior Verification

### Visual Checks:
- ✅ Toasts appear in bottom-right corner
- ✅ Slide-in animation from right
- ✅ Auto-dismiss after ~5 seconds
- ✅ Manual close button (X) works
- ✅ Multiple toasts stack vertically

### Color Scheme:
- 🟢 **Success** (Green): Create, Update, Approve, Activate
- 🔴 **Error** (Red): Validation errors, API failures
- 🟡 **Warning** (Amber): Reject operations
- 🔵 **Info** (Blue): Informational messages

### Icon Legend:
- ✓ Success
- ✕ Error
- ⚠ Warning
- ℹ Info

---

## Edge Cases to Test

### 1. Multiple Rapid Operations
- Create 3 departments quickly
- All 3 toasts should stack
- All should auto-dismiss sequentially

### 2. Error Handling
- Try to create department with empty name
- Should show red error toast
- Form should stay open

### 3. Network Interruption
- Disconnect network
- Try any operation
- Should show error toast with descriptive message

### 4. Concurrent Users
- Have two users open same page
- User A changes a role
- User B's view should update after refresh

---

## Regression Testing

Ensure existing functionality still works:

1. **Login/Logout** - Still works correctly
2. **Navigation** - All menu items accessible
3. **Search/Filter** - Asset and user filters work
4. **Pagination** - Works on all list pages
5. **Responsive Design** - Works on mobile/tablet
6. **Permission Checks** - Non-admins can't change roles

---

## Performance Checks

1. **Toast Memory Leak Check**:
   - Create 20+ operations rapidly
   - Check browser DevTools memory usage
   - Should auto-clear old toasts

2. **Re-render Performance**:
   - Open DevTools React Profiler
   - Trigger toast notification
   - Only toast components should re-render

3. **Animation Performance**:
   - Toasts should slide smoothly (60fps)
   - No jank or stuttering
   - GPU-accelerated transforms

---

## Browser Compatibility

Test in:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

---

## Accessibility Testing

1. **Keyboard Navigation**:
   - Tab through forms
   - All inputs reachable
   - Toast close button focusable

2. **Screen Reader**:
   - Toasts announced with role="alert"
   - Form errors read properly
   - Labels associated with inputs

3. **Color Contrast**:
   - All text readable
   - Meets WCAG AA standards
   - Color not sole indicator

---

## Known Limitations

1. **Toast Position**: Fixed to bottom-right (not configurable yet)
2. **Toast Duration**: Hard-coded to 5 seconds
3. **Max Toasts**: No limit (auto-dismiss prevents pile-up)
4. **Toast Persistence**: Cleared on page refresh

---

## Rollback Instructions

If issues arise:

1. **Revert Backend**:
   ```bash
   cd backend/src/models
   git checkout HEAD -- activityLogModel.js
   ```

2. **Revert Frontend**:
   ```bash
   cd frontend
   git checkout HEAD -- lib/api.ts lib/actions/
   git checkout HEAD -- app/\(dashboard\)/
   git checkout HEAD -- components/ui/Toast.tsx
   ```

3. **Clear Cache**:
   ```bash
   rm -rf .next
   npm run build
   ```

---

## Support

For issues or questions:
- Check `FIXES_SUMMARY.md` for technical details
- Review commit messages for specific changes
- Check browser console for errors

---

**Last Updated**: January 2025
