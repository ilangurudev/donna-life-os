# Donna Life OS - Visual Testing Bug Report

**Date:** January 12, 2026  
**Testing Tool:** Playwright + Chromium  
**Screenshots Captured:** 19 total

---

## 🐛 Bugs Found

### 1. **~~CRITICAL: Search Bar Text Overlapping with Magnifying Glass Icon~~** ✅ FIXED
**Location:** Notes Panel → Search Input  
**Screenshots:** `02-notes-panel.png`, `08-mobile-notes-tab.png` (before), `FIXED-search-bar.png`, `FIXED-mobile-search-bar.png` (after)

**Description:**  
The placeholder text "Search notes..." was beginning directly under the magnifying glass icon, causing the "S" to be hidden/overlapped. 

**Root Cause:**  
In `RecentNotesList.tsx`, the input had `className="mobile-search pl-10"`. The CSS `.mobile-search` used `@apply px-4` which conflicted with `pl-10` due to CSS specificity.

**Fix Applied:**  
1. Updated `index.css` to use `pl-10 pr-4` instead of `px-4` in `.mobile-search` class
2. Removed redundant `pl-10` from `RecentNotesList.tsx` className

**Files Changed:**
- `src/index.css` - Changed padding from `px-4` to `pl-10 pr-4`
- `src/components/NotesPanel/RecentNotesList.tsx` - Removed `pl-10` from className

---

### 2. **MEDIUM: API Key Error Message UX**
**Location:** Chat Panel  
**Screenshots:** `03-search-bar-unfocused.png`, `06-note-selected.png`

**Description:**  
When no API key is configured, the chat shows "Invalid API key · Please run /login" in purple text. While functional, this could be improved with:
- A more friendly onboarding message
- Visual styling that makes it clear this is an error/setup needed
- A clickable link to the login process

**Current State:** Error message appears but isn't clearly styled as an error.

---

### 3. **MINOR: Folder Tree Item Count Inconsistency**
**Location:** Notes Panel → Folders View  
**Screenshots:** `05-view-folders.png`

**Description:**  
The folder tree shows counts like "1" next to each folder but uses a different visual style than the "3 notes" count in Recent view. Consider unifying these styles.

---

## ✅ Features Working Correctly

### Desktop Layout
- ✅ Split pane layout works correctly
- ✅ Notes panel displays on left (40% default)
- ✅ Chat panel displays on right (60% default)
- ✅ Resize handle appears functional

### Notes Panel
- ✅ Recent/Folders view toggle works
- ✅ Note cards display with title, folder, preview text
- ✅ Status badges (active, todo) render correctly
- ✅ High Priority badge displays properly
- ✅ Relative timestamps ("2m ago") display correctly
- ✅ Note count displays ("3 notes")

### Note Viewer
- ✅ Note selection works - clicking a note opens viewer
- ✅ Frontmatter table displays (Title, Status, Created)
- ✅ Markdown content renders correctly (headers, lists)
- ✅ Close button (X) appears in viewer header
- ✅ File path breadcrumb shows correctly

### Folder Tree
- ✅ Hierarchical structure displays correctly
- ✅ Folders expand/collapse properly
- ✅ File icons display with correct colors
- ✅ High priority indicator (!) shows on tasks

### Chat Panel
- ✅ Connection status indicator (Connected/Disconnected)
- ✅ Turn counter and cost display ("Turns: 1 $0.0000")
- ✅ Dev mode toggle works (switches to "Clean" mode)
- ✅ Chat input with send button
- ✅ Thinking indicator displays while processing

### Mobile Layout
- ✅ Responsive design switches to mobile view at small viewport
- ✅ Bottom tab bar appears (Chat | Notes)
- ✅ Tab switching works correctly
- ✅ Mobile header displays correctly
- ✅ Safe area insets appear to be working

---

## 📊 Summary

| Severity | Count | Issues | Status |
|----------|-------|--------|--------|
| Critical | 1     | Search bar text overlap | ✅ FIXED |
| Medium   | 1     | API key error UX | Open |
| Minor    | 1     | Folder count styling inconsistency | Open |

**Total Issues Found:** 3  
**Issues Fixed:** 1

---

## 🔧 Remaining Priority Fixes

1. ~~**Immediate:** Fix search bar padding (user-reported issue)~~ ✅ Done
2. **Soon:** Improve API key error message styling and UX
3. **Later:** Unify count styling between views
