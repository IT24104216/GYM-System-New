# Security Route Verification (Postman)

Use this checklist after auth/ownership changes.

## 1) Setup Environment Variables
- `baseUrl` = `http://localhost:5000/api/v1`
- `userToken`
- `coachToken`
- `dietitianToken`
- `adminToken`
- `userId`
- `otherUserId`
- `coachId`
- `otherCoachId`
- `dietitianId`
- `otherDietitianId`

## 2) Login and Capture Tokens
- `POST {{baseUrl}}/auth/login`
- Body example:
```json
{
  "identifier": "user@gmail.com",
  "password": "123456"
}
```
- Save returned token in environment (`userToken`/`coachToken`/`dietitianToken`/`adminToken`).

## 3) Ownership Checks (Expected 403)

### Appointments (user scope)
- `GET {{baseUrl}}/appointments?userId={{otherUserId}}`
- Auth: `Bearer {{userToken}}`
- Expected: `403`

### Notifications (user scope)
- `GET {{baseUrl}}/notifications/list?userId={{otherUserId}}`
- Auth: `Bearer {{userToken}}`
- Expected: `403`

### Progress (user scope)
- `GET {{baseUrl}}/progress/{{otherUserId}}`
- Auth: `Bearer {{userToken}}`
- Expected: `403`

### Coach scoped routes
- `GET {{baseUrl}}/workouts/requests?coachId={{otherCoachId}}`
- Auth: `Bearer {{coachToken}}`
- Expected: `403`

## 4) Owner-Match Checks (Expected 200)

### Appointments
- `GET {{baseUrl}}/appointments?userId={{userId}}`
- Auth: `Bearer {{userToken}}`
- Expected: `200`

### Notifications
- `GET {{baseUrl}}/notifications/list?userId={{userId}}`
- Auth: `Bearer {{userToken}}`
- Expected: `200`

### Progress
- `GET {{baseUrl}}/progress/{{userId}}`
- Auth: `Bearer {{userToken}}`
- Expected: `200`

## 5) No-Token Checks (Expected 401)
- `GET {{baseUrl}}/admin/users`
- `GET {{baseUrl}}/workouts/plans`
- `GET {{baseUrl}}/lockers/list`
- `GET {{baseUrl}}/promotions/list`
- `GET {{baseUrl}}/meal-plans/user-plan?userId={{userId}}`

Send without Authorization header. Expected: `401`.

## 6) Admin Access Checks (Expected 200)
- `GET {{baseUrl}}/admin/users`
- Auth: `Bearer {{adminToken}}`
- Expected: `200`

---

If any expected status fails, record:
- endpoint
- token role used
- sent params/body
- actual status + response message
