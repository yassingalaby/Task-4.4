# UI/UX Rescue Challenge — Campus Lost & Found (Task 4.4)

## Overview & Redesign
The campus Lost & Found application has been overhauled to provide a modern, accessible, and user-friendly experience:
- **Prominent Centered Search Bar & Search Button:** Search is now centered in the hero section with a large, high-visibility "Search" button so users never miss how to look up lost or found items.
- **High-Visibility CTAs & Buttons:** All key actions (`+ Post a report`, `Search`, `Share your report →`, `Clear filters`, `Find possible matches`) have distinct high-contrast button styling, clear focus rings, and tactile hover/active states. All main-page buttons and links are preserved.
- **Modern, Accessible Visual Style:** Switched from cramped low-contrast beige/grey to an accessible Navy/Blue/Amber design system with readable fonts (14–18px+), clear card categorisation, and clean column layouts.

---

## 8 Errors Identified and Fixed

### Error 1: Generic, Unhelpful Form Error Messages (Heuristic: Error Recovery)
- **Problem:** The original `submit()` function completely discarded specific validation messages from `validate()` and displayed only a vague `"Please review your entries."`. When a user triggered a duplicate (same title and location), they were not told why it failed.
- **Fix:** Implemented specific per-field validation errors rendered inline next to each input. Added an error summary box at the top with jump links, wired `aria-invalid` and `aria-describedby`, automatically focused the first invalid field, and cleared field errors as soon as the user starts typing.

### Error 2: Rigid Exact-Phrase Search (Heuristic: Flexibility & Efficiency)
- **Problem:** The search matched exact substring phrases only. A student searching for `"backpack black"` received 0 results even though `"Black backpack"` existed.
- **Fix:** Switched to token-based, order-independent search across title, description, location, and category. Typing `"backpack black"` or `"blue bottle"` matches corresponding items regardless of word order.

### Error 3: Hidden Search & Misleading Controls (Heuristic: Visibility of System Status)
- **Problem:** Search was tucked away in a small side panel without a dedicated search button, while an `"Apply"` button did nothing because filtering was already executed onChange.
- **Fix:** Replaced the sidebar with a prominent, centered search bar with a bold primary `"Search"` button. Removed the confusing Apply button, added live result counters (`X notices match your search`), and provided removable filter chips.

### Error 4: Dead-End Zero-Result State (Heuristic: Help & Recovery)
- **Problem:** When search or filters yielded no matches, the UI displayed three empty column placeholders stating `"Nothing here yet"`, leaving the user stranded without guidance.
- **Fix:** Built a dedicated empty state banner explaining why no items matched and giving direct one-click actions: `"Clear filters"` or `"+ Post a report"` so the user can immediately report their lost item.

### Error 5: Ambiguous Handover & Verification Status (Heuristic: Real-World Match & Trust)
- **Problem:** When reporting a found item, users could not state whether they currently held the item or had dropped it off at a campus collection point. All found items ambiguously showed `"Reported found - not confirmed at a collection point"`.
- **Fix:** Added a `"Where is the item now?"` selection to the form (`I still have it` vs. `I left it at a collection point`). Set finder drop-offs to `"Not yet confirmed"` (warning badge) because only staff can verify receipt (`"Held by staff"`). Locked handover fields on staff-confirmed items so reporters cannot falsely reassign staff custody.

### Error 6: Poor Legibility, Tiny Fonts, and Wrapped Asterisks (Heuristic: Accessibility)
- **Problem:** Body and metadata text used tiny 9px–11px fonts with washed-out `#a5a098` greys failing WCAG AA contrast. Required field asterisks (`*`) wrapped awkwardly to new lines due to flex-column styling.
- **Fix:** Increased typography scale to 14px–18px with strong contrast ratios (`#14213d` and `#3a465d` on light backgrounds). Grouped label text with asterisks inline inside span tags, and added accessible focus rings.

### Error 7: Stale Filter Trapping Newly Created Reports
- **Problem:** If a user had active filters (e.g. filtered to "Lost") and created a new "Found" report, the board redirected back with the old filter still active, causing their newly created report to be invisible.
- **Fix:** Automatically reset search and filters upon submitting a new report, guaranteeing that the user immediately sees their newly posted notice with a clear confirmation toast.

### Error 8: Action Menus (`···`) Could Not Be Dismissed
- **Problem:** Clicking the three dots opened the action popover, but clicking outside or pressing Escape did not close it, cluttering the card and causing UI overlap.
- **Fix:** Added global document listeners for clicks outside `.menu-holder` and Escape key presses to cleanly dismiss active popover menus.

---

## AI Design Suggestion Refined/Rejected
- **Suggestion:** Automatically marking any found report where the user selects a collection point as `"Received at <Collection Point>"`.
- **Refinement/Rejection:** Rejected as unsafe and misleading. In a university setting, an unconfirmed student report could lead owners to visit a closed or empty collection desk. Instead, created a distinct intermediate status: `"Not yet confirmed"` (warning tone) until staff officially log receipt.

---

## Verification & Screenshots
- Verified through automated browser tests (`node e2e.mjs`) covering 30 assertions across search, filters, validation, accessibility, and handover workflows.
- Screenshots are saved in `docs/screenshots/`:
  - `before-1-board.png` vs `after-1-board.png`
  - `before-2-search-reordered-words.png` vs `after-2-search-reordered-words.png`
  - `before-3-search-no-results.png` vs `after-3-search-no-results.png`
  - `before-4-form-empty-submit.png` vs `after-4-form-empty-submit.png`
  - `before-5-form-duplicate.png` vs `after-5-form-duplicate.png`
  - `before-6-form-found.png` vs `after-6-form-found.png`
