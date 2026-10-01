# SMARTFARM AI — API SPECIFICATION

*Version:* 1.0.0  
*Base URL:* `/api/v1`  
*Response Format:* JSON  

---

## 1. Response Envelopes

### 1.1 Success Response Envelope
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### 1.2 Error Response Envelope
```json
{
  "error": {
    "code": "validation_failed",
    "message": "The provided inputs failed validation.",
    "details": {
      "name": ["Name must be at least 2 characters long."]
    },
    "request_id": "req_8f9a2b1c"
  }
}
```

---

## 2. API Endpoint Matrix

### 2.1 Authentication & Profile
- `POST /api/v1/auth/register` — Register new farmer account.
- `POST /api/v1/auth/login` — Authenticate and create session.
- `POST /api/v1/auth/logout` — Terminate current session.
- `GET  /api/v1/me` — Get authenticated user profile & preferences.
- `PATCH /api/v1/me` — Update user profile & language preferences.
- `PATCH /api/v1/me/onboarding` — Record onboarding step completion.

### 2.2 Farm Management
- `GET  /api/v1/farms` — List farms owned by authenticated user.
- `POST /api/v1/farms` — Create a new farm.
- `GET  /api/v1/farms/:id` — Get detailed farm info with field list.
- `PUT  /api/v1/farms/:id` — Update farm details.
- `DELETE /api/v1/farms/:id` — Soft-delete a farm.

### 2.3 Field Management
- `GET  /api/v1/fields` — List fields (filterable by `farm_id`).
- `POST /api/v1/fields` — Create a new field with optional map GeoJSON.
- `GET  /api/v1/fields/:id` — Get detailed field status and history.
- `PUT  /api/v1/fields/:id` — Update field information.
- `DELETE /api/v1/fields/:id` — Soft-delete field.

### 2.4 Crop & Cycle Management
- `GET  /api/v1/crops` — Search crop master catalog (localized).
- `GET  /api/v1/crops/:id/stages` — View crop stage templates.
- `GET  /api/v1/crop-cycles` — List crop cycles.
- `POST /api/v1/crop-cycles` — Create crop cycle and materialize stages.
- `GET  /api/v1/crop-cycles/:id` — Get cycle detail & timeline.
- `POST /api/v1/crop-cycles/:id/advance-stage` — Advance current crop stage.
- `POST /api/v1/crop-cycles/:id/harvest` — Record harvest completion.

### 2.5 Tasks & Weather Advisory
- `GET  /api/v1/tasks` — List tasks (filter by status, due date, field).
- `POST /api/v1/tasks` — Create task.
- `PATCH /api/v1/tasks/:id` — Update task status.
- `POST /api/v1/tasks/:id/complete` — Mark task complete.
- `GET  /api/v1/weather` — Current weather for farm location.
- `GET  /api/v1/weather/forecast` — Daily & hourly forecast.
- `GET  /api/v1/advisories` — Weather-aware advisory rules.

### 2.6 Soil & Observations
- `GET  /api/v1/soil/profile` — Get soil status for field.
- `PUT  /api/v1/soil/profile` — Update soil path/type.
- `POST /api/v1/soil/reports` — Upload soil document (PDF/Image).
- `PUT  /api/v1/soil/reports/:id/parameters` — Save confirmed parameters.
- `GET  /api/v1/observations` — List scouting observations.
- `POST /api/v1/observations` — Log new field observation.

### 2.7 Dashboard & Admin
- `GET  /api/v1/dashboard/summary` — Overview metrics for dashboard widgets.
- `GET  /api/v1/admin/users` — Admin user management.
- `GET  /api/v1/admin/audit-logs` — Administrative audit history.
- `GET  /api/v1/admin/system/health` — Provider and queue health status.
