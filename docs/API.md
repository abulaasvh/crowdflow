# CrowdFlow API Documentation

> Complete endpoint reference for all CrowdFlow microservices.

---

## Table of Contents
- [Auth Service (Port 4000)](#auth-service)
- [Crowd Service (Port 4001/4002)](#crowd-service)
- [Order Service (Port 4003)](#order-service)
- [Navigation Service (Port 4004)](#navigation-service)
- [Notification Service (Port 4005)](#notification-service)

---

## Auth Service

**Base URL:** `http://localhost:4000`  
**Protocol:** GraphQL (via Mercurius)  
**Endpoint:** `POST /graphql`  
**Explorer:** `GET /graphiql` (dev only)

### Health Check
```
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "service": "auth-service",
  "timestamp": "2026-04-19T10:00:00.000Z",
  "uptime": 3600.5
}
```

### GraphQL Mutations

#### Register
```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    user {
      id
      email
      displayName
      role
    }
    tokens {
      accessToken
      refreshToken
      expiresIn
      tokenType
    }
  }
}
```
**Variables:**
```json
{
  "input": {
    "email": "staff@venue.com",
    "password": "SecureP@ss1",
    "displayName": "John Doe",
    "role": "STAFF"
  }
}
```

#### Login
```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    user { id email displayName role }
    tokens { accessToken refreshToken expiresIn }
  }
}
```

#### Refresh Tokens
```graphql
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    tokens { accessToken refreshToken expiresIn }
  }
}
```

#### Google Sign-In
```graphql
mutation GoogleSignIn($idToken: String!, $role: String) {
  googleSignIn(idToken: $idToken, role: $role) {
    user { id email displayName }
    tokens { accessToken refreshToken }
  }
}
```

### Security
- **Password Hashing:** Argon2id (memory: 65536 KB, iterations: 3)
- **Access Token:** JWT, 15-minute expiry, RS256-compatible
- **Refresh Token:** JWT, 7-day expiry, rotation with family tracking
- **Rate Limiting:** 5 requests/minute per IP on auth endpoints

---

## Crowd Service

**REST Base URL:** `http://localhost:4001`  
**WebSocket URL:** `ws://localhost:4002`  
**Protocol:** REST + Socket.io

### REST Endpoints

#### Health Check
```
GET /health
```

#### Get Zone Data
```
GET /api/crowd/zones
```
**Response:**
```json
{
  "zones": [
    {
      "zoneId": "section-a",
      "currentCount": 2450,
      "capacity": 5000,
      "occupancyRate": 0.49,
      "status": "MODERATE",
      "trend": 0.02
    }
  ]
}
```

#### Get Heatmap
```
GET /api/crowd/heatmap
```
**Response:**
```json
{
  "heatmap": {
    "gridSize": 50,
    "densities": [0.12, 0.15, ...],
    "timestamp": "2026-04-19T10:00:00.000Z"
  }
}
```

#### Get Queue Data
```
GET /api/crowd/queues
```

#### Get Statistics
```
GET /api/crowd/stats
```
**Response:**
```json
{
  "stats": {
    "totalAttendees": 32000,
    "totalCapacity": 50000,
    "overallOccupancy": 0.64,
    "zonesAtCapacity": 2,
    "averageWaitTime": 7.5,
    "activeAlerts": 3
  }
}
```

### WebSocket Events

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `crowd:update` | `CrowdUpdatePayload` | Zone densities, stats, heatmap (every 500ms) |
| `zone:alert` | `ZoneAlertPayload` | Triggered when zone exceeds 85% capacity |
| `queue:update` | `{ queues: QueueInfo[] }` | Real-time queue length updates |

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `alert:acknowledge` | `{ alertId, staffId }` | Staff acknowledges an alert |

### Algorithms
- **Heatmap:** Inverse Distance Weighting (IDW) interpolation with Gaussian blur
- **Anomaly Detection:** Z-score threshold (>2σ)
- **Prediction:** Holt's Double Exponential Smoothing

---

## Order Service

**Base URL:** `http://localhost:4003`  
**Protocol:** GraphQL  
**Endpoint:** `POST /graphql`

### Queries

#### Get Menu
```graphql
query GetMenu {
  getMenu {
    id
    name
    description
    price
    category
    isAvailable
  }
}
```

#### Get Orders
```graphql
query GetOrders($userId: String!) {
  getOrders(userId: $userId) {
    id
    orderNumber
    status
    totalPrice
    seatInfo
    items { menuItem { name price } quantity }
    createdAt
  }
}
```

### Mutations

#### Create Order
```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    order {
      id
      orderNumber
      status
      totalPrice
    }
    paymentIntentClientSecret
  }
}
```
**Variables:**
```json
{
  "input": {
    "userId": "user-123",
    "seatInfo": "Section A, Row 12, Seat 5",
    "items": [
      { "menuItemId": "m1", "quantity": 2 },
      { "menuItemId": "m4", "quantity": 1 }
    ]
  }
}
```

### Order Status Flow
```
PENDING → CONFIRMED → PREPARING → READY → COMPLETED
                                         → CANCELLED
```

---

## Navigation Service

**Base URL:** `http://localhost:4004`  
**Protocol:** REST

### Get Optimal Route
```
GET /route?start={startNodeId}&end={endNodeId}
```
**Example:** `GET /route?start=section-a&end=gate-north`

**Response:**
```json
{
  "path": ["section-a", "walkway-north", "gate-north"],
  "totalWeight": 25,
  "isDensityAware": true
}
```

### Get Stadium Nodes
```
GET /nodes
```
**Response:**
```json
[
  { "id": "gate-north", "name": "North Gate" },
  { "id": "section-a", "name": "Section A" }
]
```

### Algorithm
- **Dijkstra's Shortest Path** with density-aware edge weighting
- Weight multipliers: CRITICAL=10×, HIGH=4×, MODERATE=1.5×, LOW=1×

---

## Notification Service

**Base URL:** `http://localhost:4005`  
**Protocol:** REST

### Send Notification
```
POST /send
Content-Type: application/json
```
**Body:**
```json
{
  "token": "device-fcm-token",
  "title": "Crowd Alert",
  "body": "Section A is at 90% capacity",
  "data": { "zoneId": "section-a", "severity": "critical" }
}
```

**Or via topic:**
```json
{
  "topic": "zone-section-a",
  "title": "Gate Opening",
  "body": "North Gate is now open"
}
```

**Response (Success):**
```json
{ "success": true, "messageId": "projects/crowdflow/messages/123" }
```

**Response (Mock Mode):**
```json
{ "success": true, "mock": true }
```

### Validation Rules
- Either `token` or `topic` is required
- `title` and `body` are required strings
- `data` is an optional key-value map of strings

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <accessToken>
```

Tokens are obtained via the Auth Service login/register mutations.

---

## Error Responses

All services follow a consistent error format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Descriptive error message"
}
```

### Common Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request — invalid input |
| 401 | Unauthorized — missing/invalid token |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable — health check failure |
