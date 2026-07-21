# StudyNook Server API Documentation

## Base URL
`http://localhost:5000/api`

## Endpoints Summary

### Health & Base
- `GET /` - Base status check.
- `GET /api/health` - Server health status and uptime details.

### Authentication (`/api/auth`)
- `POST /api/auth/register` - User registration.
- `POST /api/auth/login` - User authentication & JWT cookie issuance.
- `POST /api/auth/logout` - User logout & cookie invalidation.
- `GET /api/auth/me` - Fetch authenticated user profile.

### Rooms (`/api/rooms`)
- `GET /api/rooms` - Query study rooms with filtering, search, and rate range.
- `GET /api/rooms/:id` - Fetch room details by ID.
- `POST /api/rooms` - Create a room listing (Owner required).
- `PUT /api/rooms/:id` - Update room listing (Owner required).
- `DELETE /api/rooms/:id` - Delete room listing (Owner required).

### Bookings (`/api/bookings`)
- `GET /api/bookings/user` - Fetch authenticated user's bookings.
- `POST /api/bookings` - Create a room reservation.
- `DELETE /api/bookings/:id` - Cancel a reservation.

### Reviews (`/api/reviews`)
- `GET /api/reviews/room/:roomId` - Fetch reviews for a room.
- `POST /api/reviews` - Submit rating & feedback.
