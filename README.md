# BFS218 Atlas

A learning companion for **BFS218: Racism and the Digital Age (Understanding Techno-Racism)** at Seneca Polytechnic.

Per-week: Overview, Purpose and Learning Outcomes, Guiding Questions, Weekly Concepts, Readings, an interactive in-browser slideshow, a Case Study, a Reflection Corner, and References. Plus four learning tools: glossary and key thinkers, a Living Cartography personal map, self-check cards, and case studies.

It is a **companion to Blackboard**, not a replacement. Grades, discussion, and official submission live in Blackboard. No grading and no student-to-student interaction here.

## Editing content
All content is in `data/course-data.js` (one `window.BFS218` object).
- Weekly **video**: set `weeks[n].video` to `{ "provider":"youtube", "id":"VIDEO_ID" }` (or `vimeo`, or `{ "url":"https://.../file.mp4" }`). The player loads only when a student clicks.
- **Blackboard**: set `course.blackboardCourseUrl`.
- Slides: `slides/week-NN/slide-1.png ...`.

Static, no framework, works offline. Accessible (WCAG 2.2 AA target), IBM Plex Sans, light palette.
