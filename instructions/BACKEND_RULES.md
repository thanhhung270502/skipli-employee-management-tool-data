# Backend Rules

Tech stack: Express.js 4, TypeScript, Firebase Admin (Firestore), Socket.io, JWT, Joi, Twilio (SMS), SendGrid (Email).

## Project Structure — Feature-Based Architecture

```
back-end/src/
├── index.ts                          # app bootstrap, middleware, module mounting, server start
│
├── common/                           # shared infrastructure (cross-module only)
│   ├── middleware/
│   │   ├── auth.ts                   # JWT generate/verify + role guards
│   │   └── errorHandler.ts           # centralized error + 404 handlers
│   ├── services/
│   │   ├── firebase.ts               # Firebase Admin init + getDb()
│   │   ├── email.ts                  # SendGrid: invite + OTP emails
│   │   └── sms.ts                    # Twilio: OTP SMS
│   ├── types/
│   │   └── index.ts                  # shared only: JwtPayload, AuthRequest, ApiResponse
│   └── utils/
│       └── otp.ts                    # OTP generate, expiry, validation
│
└── modules/                          # feature modules
    ├── owner-auth/
    │   ├── index.ts                  # public API: export router only
    │   ├── owner-auth.controller.ts
    │   ├── owner-auth.model.ts
    │   ├── owner-auth.route.ts
    │   ├── owner-auth.service.ts
    │   └── owner-auth.validator.ts
    ├── employee-auth/
    │   ├── index.ts
    │   ├── employee-auth.controller.ts
    │   ├── employee-auth.model.ts
    │   ├── employee-auth.route.ts
    │   ├── employee-auth.service.ts
    │   └── employee-auth.validator.ts
    ├── employee/
    │   ├── index.ts
    │   ├── employee.controller.ts
    │   ├── employee.model.ts
    │   ├── employee.route.ts
    │   ├── employee.service.ts
    │   └── employee.validator.ts
    ├── task/
    │   ├── index.ts
    │   ├── task.controller.ts
    │   ├── task.model.ts
    │   ├── task.route.ts
    │   ├── task.service.ts
    │   └── task.validator.ts
    └── chat/
        ├── index.ts
        ├── chat.controller.ts
        ├── chat.model.ts
        ├── chat.route.ts
        ├── chat.service.ts
        ├── chat.socket.ts            # Socket.io handlers (co-located with chat feature)
        └── chat.validator.ts
```

**Root `index.ts` rule**: mount module routers only — no business logic.

```ts
import ownerAuthRouter from './modules/owner-auth';
import employeeAuthRouter from './modules/employee-auth';
import employeeRouter from './modules/employee';
import taskRouter from './modules/task';
import chatRouter from './modules/chat';

app.use('/api/owner', ownerAuthRouter);
app.use('/api/employee', employeeAuthRouter);
app.use('/api/owner/employees', employeeRouter);   // owner CRUD
app.use('/api/employee', employeeRouter);             // employee profile (same module, different mount)
app.use('/api/owner/tasks', taskRouter);              // owner task routes
app.use('/api/employee/tasks', taskRouter);           // employee task routes
app.use('/api/chat', chatRouter);
```

## Module Layer Responsibilities

Each feature module follows a strict request flow:

```
HTTP Request
  → route        (path + middleware wiring)
  → validator    (input schema validation)
  → controller   (HTTP in/out — thin)
  → service      (business logic + Firestore)
  → controller   (shape response)
  → HTTP Response
```

| File | Responsibility | Must NOT contain |
|------|---------------|------------------|
| `*.route.ts` | Define Express `Router`, map paths → controller, apply auth middleware | Business logic, Firestore calls |
| `*.controller.ts` | Extract `req` data, call validator + service, send `res` | Direct Firestore access, Joi schemas |
| `*.service.ts` | Business logic, Firestore CRUD, call `common/services` | `req`/`res` objects, HTTP status codes |
| `*.model.ts` | Domain interfaces, enums, request/response types | Runtime code, validation logic |
| `*.validator.ts` | Joi schemas + `validate*()` functions | Business logic, database access |
| `index.ts` | Export router (and socket init if applicable) | Implementation details |

**Dependency direction** (never reverse):

```
route → controller → service → common/services (firebase, email, sms)
         ↓
      validator
         ↓
       model
```

## Domain Modules (Skipli)

| Module | Base path | Responsibility |
|--------|-----------|----------------|
| `owner-auth` | `/api/owner` | Owner OTP login via SMS |
| `employee-auth` | `/api/employee` | Employee OTP login, invite setup, verify invite |
| `employee` | `/api/owner/employees`, `/api/employee/profile` | Employee CRUD (owner) + profile (employee) |
| `task` | `/api/owner/tasks`, `/api/employee/tasks` | Task creation, listing, mark done |
| `chat` | `/api/chat` + Socket.io | Message history (REST) + real-time chat |

### Route Map (source of truth)

| Method | Path | Module | Auth | Description |
|--------|------|--------|------|-------------|
| GET | `/api/health` | `index.ts` | — | Health check |
| POST | `/api/owner/create-new-access-code` | `owner-auth` | — | Send owner OTP via SMS |
| POST | `/api/owner/validate-access-code` | `owner-auth` | — | Validate owner OTP → JWT |
| GET | `/api/owner/employees` | `employee` | owner | List all employees |
| GET | `/api/owner/employees/:employeeId` | `employee` | owner | Get single employee |
| POST | `/api/owner/employees` | `employee` | owner | Create employee + send invite |
| PUT | `/api/owner/employees/:employeeId` | `employee` | owner | Update employee |
| DELETE | `/api/owner/employees/:employeeId` | `employee` | owner | Delete employee |
| POST | `/api/owner/tasks` | `task` | owner | Create task |
| GET | `/api/owner/tasks` | `task` | owner | List all tasks |
| POST | `/api/employee/login-email` | `employee-auth` | — | Send employee OTP via email |
| POST | `/api/employee/validate-access-code` | `employee-auth` | — | Validate employee OTP → JWT |
| POST | `/api/employee/setup-account` | `employee-auth` | — | Complete invite setup |
| GET | `/api/employee/verify-invite/:token` | `employee-auth` | — | Verify invite token |
| GET | `/api/employee/profile` | `employee` | employee | Get own profile |
| PUT | `/api/employee/profile` | `employee` | employee | Update own profile |
| GET | `/api/employee/tasks` | `task` | employee | List assigned tasks |
| PUT | `/api/employee/tasks/:taskId/done` | `task` | employee | Mark task done |
| GET | `/api/chat/:roomId/messages` | `chat` | any auth | Fetch chat history |

**Frontend sync (CRITICAL)**: when adding/changing an endpoint, update the matching file in `front-end/src/common/models/<domain>/` (`*-api-model.ts` + `*-model.ts`). Route paths must match exactly what the frontend calls.

## Module File Patterns

### `*.model.ts` — Types only

- Only `interface`, `type`, `enum` — zero runtime code
- Enum names: `E` prefix (e.g., `ETaskStatus`)
- Firestore document shapes: plain interfaces (camelCase fields)
- API-safe types strip secrets: `EmployeePublic` omits `passwordHash`, `inviteToken`
- Request/response: `<Action>Request` / `<Action>Response`
- Nullable fields: `T | null`, not `T | undefined`

```ts
// modules/employee/employee.model.ts

export interface Employee {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  username: string | null;
  passwordHash: string | null;
  inviteToken: string | null;
  isSetup: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeePublic extends Omit<Employee, 'passwordHash' | 'inviteToken'> {
  id: string;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  department: string;
  phone?: string;
  role?: string;
}

export interface CreateEmployeeResponse {
  employeeId: string;
  message: string;
}
```

Shared cross-module types (`JwtPayload`, `AuthRequest`) live in `common/types/index.ts` — never duplicate in module models.

### `*.validator.ts` — Joi schemas

```ts
// modules/employee/employee.validator.ts
import Joi from 'joi';
import type { CreateEmployeeRequest } from './employee.model';

export const createEmployeeSchema = Joi.object<CreateEmployeeRequest>({
  name: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  department: Joi.string().trim().required(),
  phone: Joi.string().trim().optional().allow(''),
  role: Joi.string().trim().optional(),
});

export const validateCreateEmployee = (body: unknown) =>
  createEmployeeSchema.validate(body, { abortEarly: false, stripUnknown: true });
```

Validator rules:
- One schema per action: `createEmployeeSchema`, `updateEmployeeSchema`
- Export paired validate function: `validateCreateEmployee(body)`
- Use `abortEarly: false` to return all errors at once
- Use `stripUnknown: true` to reject unexpected fields

### `*.service.ts` — Business logic

```ts
// modules/employee/employee.service.ts
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../common/services/firebase';
import { sendEmployeeInviteEmail } from '../../common/services/email';
import type { CreateEmployeeRequest, EmployeePublic } from './employee.model';

export const listEmployees = async (): Promise<EmployeePublic[]> => {
  const db = getDb();
  const snapshot = await db.collection('employees').orderBy('createdAt', 'desc').get();

  return snapshot.docs.map((doc) => {
    const { passwordHash, inviteToken, ...safe } = doc.data();
    return { id: doc.id, ...safe } as EmployeePublic;
  });
};

export const createEmployee = async (data: CreateEmployeeRequest): Promise<{ employeeId: string }> => {
  const db = getDb();
  // uniqueness check, create doc, send invite...
  return { employeeId: uuidv4() };
};
```

Service rules:
- Export named async functions — one per use case
- Return domain data or throw `AppError` with `statusCode`
- Strip sensitive fields before returning
- Never import `express` in service files

### `*.controller.ts` — Thin HTTP layer

```ts
// modules/employee/employee.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../common/types';
import { validateCreateEmployee } from './employee.validator';
import * as employeeService from './employee.service';

export const createEmployee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = validateCreateEmployee(req.body);
    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const { employeeId } = await employeeService.createEmployee(value);
    res.status(201).json({ success: true, employeeId, message: 'Employee created and invite email sent' });
  } catch (err) {
    next(err);
  }
};
```

Controller rules:
- Return type: `Promise<void>`
- Validate → call service → respond — no business logic
- Client errors: respond directly with status + `return`
- Server errors: always `next(err)`

### `*.route.ts` — Router wiring

```ts
// modules/employee/employee.route.ts
import { Router } from 'express';
import { authenticateToken, requireOwner, requireEmployee } from '../../common/middleware/auth';
import * as employeeController from './employee.controller';

const router = Router();

// Owner routes
router.get('/', authenticateToken, requireOwner, employeeController.listEmployees);
router.post('/', authenticateToken, requireOwner, employeeController.createEmployee);
router.get('/:employeeId', authenticateToken, requireOwner, employeeController.getEmployee);
router.put('/:employeeId', authenticateToken, requireOwner, employeeController.updateEmployee);
router.delete('/:employeeId', authenticateToken, requireOwner, employeeController.deleteEmployee);

// Employee routes (mounted at /api/employee/profile separately if needed)
router.get('/profile', authenticateToken, requireEmployee, employeeController.getProfile);
router.put('/profile', authenticateToken, requireEmployee, employeeController.updateProfile);

export default router;
```

### `index.ts` — Module public API

```ts
// modules/employee/index.ts
export { default } from './employee.route';
export * from './employee.model';   // types only — for cross-module imports
```

**Module `index.ts` rule**: export router + model types — never export controller, service, or validator internals.

## API Response Format (CRITICAL)

Every endpoint MUST return this envelope:

```ts
// Success
res.json({ success: true, message?: string, ...payload });

// Error (from controller)
res.status(400).json({ success: false, message: 'Human-readable error' });

// Created
res.status(201).json({ success: true, ...payload });
```

| Status | When |
|--------|------|
| `200` | Success (GET, PUT, DELETE) |
| `201` | Resource created (POST) |
| `400` | Validation error, bad input |
| `401` | Missing token |
| `403` | Invalid token or wrong role |
| `404` | Resource not found |
| `409` | Conflict (duplicate email/username) |
| `500` | Unhandled error (via `errorHandler`) |

Never leak internal errors, stack traces, or secrets in production responses.

## Auth Middleware

Import from `common/middleware/auth.ts`:

| Middleware | Purpose |
|------------|---------|
| `authenticateToken` | Verify `Authorization: Bearer <token>`, set `req.user` |
| `requireOwner` | Guard: `req.user.role === 'owner'` |
| `requireEmployee` | Guard: `req.user.role === 'employee'` |

Apply in `*.route.ts` only — never in controller or service.

## Sensitive Data — Never Expose

Always strip in **service layer** before returning:

| Field | Collection | Reason |
|-------|-----------|--------|
| `passwordHash` | employees | credential |
| `inviteToken` | employees | setup secret |
| `accessCode` | owners, employees | OTP secret |

## Firestore Collections

| Collection | Doc ID | Module |
|------------|--------|--------|
| `owners` | `phoneNumber` | `owner-auth` |
| `employees` | UUID | `employee`, `employee-auth` |
| `tasks` | UUID | `task` |
| `messages/{roomId}/chats` | auto | `chat` |

### Firestore Access Rules

- Always use `getDb()` from `common/services/firebase.ts`
- Use `new Date()` for timestamps (not `Date.now()` number)
- Partial updates: build `Record<string, unknown>` with only defined fields + `updatedAt`
- Check doc exists before update/delete → throw `404` AppError from service
- Check uniqueness before create → throw `409` AppError from service

### Chat Room ID Format

```
{ownerPhone}_{employeeId}
```

Example: `+84912345678_a1b2c3d4-...`

## Common Services (`common/services/`)

Infrastructure only — not feature business logic.

| File | Functions |
|------|-----------|
| `firebase.ts` | `initializeFirebase()`, `getDb()` |
| `email.ts` | `sendEmployeeInviteEmail()`, `sendOtpEmail()` |
| `sms.ts` | `sendSms()`, `sendOtpSms()` |

**Rule**: feature `*.service.ts` calls `common/services` — never import `@sendgrid/mail`, `twilio`, or `firebase-admin` directly in modules.

## OTP Utilities (`common/utils/otp.ts`)

| Function | Purpose |
|----------|---------|
| `generateOtp()` | 6-digit random code |
| `getOtpExpiry()` | `Date` based on `OTP_EXPIRY_MINUTES` env |
| `isOtpExpired(expiry)` | Handles Firestore `Timestamp` and `Date` |

Rate-limited endpoints (configured in `index.ts`):
- `POST /api/owner/create-new-access-code` — 5 req / 10 min
- `POST /api/employee/login-email` — 5 req / 10 min

## Socket.io (`modules/chat/chat.socket.ts`)

Real-time chat handlers live inside the `chat` module.

| Event (client → server) | Payload | Action |
|-------------------------|---------|--------|
| `join_room` | `{ roomId, userId, role, name }` | Join room, track online user |
| `send_message` | `{ roomId, senderId, senderName, senderRole, text }` | Save via `chat.service` + broadcast |
| `typing_start` | `{ roomId, senderName }` | Notify room |
| `typing_stop` | `{ roomId }` | Notify room |

| Event (server → client) | Payload |
|-------------------------|---------|
| `room_joined` | `{ roomId }` |
| `user_joined` | `{ userId, role, name }` |
| `user_left` | `{ userId, name }` |
| `receive_message` | `ChatMessage & { id: string }` |
| `user_typing` | `{ senderName }` |
| `user_stopped_typing` | — |
| `message_error` | `{ message }` |

Initialize in `index.ts`:

```ts
import { initializeChatSocket } from './modules/chat/chat.socket';
initializeChatSocket(io);
```

## Environment Variables

Copy `.env.example` → `.env`. Never commit `.env`.

| Variable | Required | Purpose |
|----------|----------|---------|
| `PORT` | no (default 5000) | Server port |
| `NODE_ENV` | no | `development` / `production` |
| `JWT_SECRET` | **yes** | Token signing |
| `JWT_EXPIRES_IN` | no (default `7d`) | Token TTL |
| `FIREBASE_PROJECT_ID` | **yes** | Firestore |
| `FIREBASE_CLIENT_EMAIL` | **yes** | Firestore |
| `FIREBASE_PRIVATE_KEY` | **yes** | Firestore (use `\n` escapes) |
| `TWILIO_*` | for owner OTP | SMS |
| `SENDGRID_*` | for employee email | Invite + OTP email |
| `FRONTEND_URL` | no | CORS + invite link base |
| `OTP_EXPIRY_MINUTES` | no (default 15) | OTP TTL |

## File & Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Module folder | `kebab-case` | `owner-auth/`, `employee-auth/` |
| Module files | `<module>.<layer>.ts` | `employee.controller.ts` |
| Common infra | `<purpose>.ts` | `common/middleware/auth.ts` |
| Exported service functions | `camelCase` verb-first | `listEmployees`, `createEmployee` |
| Exported controller functions | `camelCase` verb-first | `listEmployees`, `createEmployee` |
| Joi schemas | `<action>Schema` | `createEmployeeSchema` |
| Validate functions | `validate<Action>` | `validateCreateEmployee` |
| Firestore collections | `camelCase` plural | `employees`, `tasks` |
| Route path segments | `kebab-case` | `/create-new-access-code` |
| REST resources | plural nouns | `/employees`, `/tasks` |

## Adding a New Feature Module — Checklist

1. Create `modules/<feature>/` with all 6 files (`controller`, `model`, `route`, `service`, `validator`, `index.ts`)
2. Define types in `<feature>.model.ts`
3. Define Joi schemas in `<feature>.validator.ts`
4. Implement business logic in `<feature>.service.ts`
5. Implement thin handlers in `<feature>.controller.ts`
6. Wire routes + middleware in `<feature>.route.ts`
7. Export router from `index.ts`
8. Mount router in root `index.ts`
9. Update `front-end/src/common/models/<domain>/`
10. Add rate limiting in root `index.ts` if endpoint sends OTP/notifications
11. Run build + tests

## Adding a New Endpoint to Existing Module — Checklist

1. Add types to `<module>.model.ts`
2. Add Joi schema to `<module>.validator.ts`
3. Add service function to `<module>.service.ts`
4. Add controller handler to `<module>.controller.ts`
5. Wire route in `<module>.route.ts`
6. Update frontend models
7. Run build + tests

## Build & Test (CRITICAL)

```bash
cd back-end
npm run build    # tsc — catches type errors
npm test         # jest — run before committing
npm run dev      # ts-node-dev for local development
```

Run `npm run build` before committing any `.ts` changes.
