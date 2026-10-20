# Attendance App User Guide

## Students

1. Sign in with your university account.
2. Open **My Classes** and choose a class.
3. When the professor opens attendance, scan the QR code or enter the class
   code.
4. If location is requested, allow location access while in the classroom.
5. Wait for the **Attendance confirmed** message. A code is not confirmation
   until the API accepts it.
6. Use **Statistics** to review attendance percentage, present, late, and
   absent sessions.
7. If you cannot attend, open **Request absence**, select the class/session,
   write a reason, and attach supporting evidence if required.
8. Check **Notifications** for cancelled classes and absence-request decisions.

## Professors

1. Sign in and create or open a class section.
2. Enroll students in the section.
3. Select **Start attendance**, optionally set the classroom location and
   allowed radius, and display the generated code or QR code.
4. Watch confirmations in the attendance list. The code expires automatically.
5. Cancel a session when necessary; enrolled students receive a notification.
6. Review pending absence requests and approve or reject them.
7. Use **Class statistics** to view attendance by session and overall class
   attendance.

## Important rules

- Each student can confirm attendance only once per session.
- Codes and QR tokens expire and must not be shared.
- Attendance is confirmed only after a successful server response.
- Location is used only when the professor enables it for that session.
- Do not share passwords, access tokens, codes, or QR screenshots.
