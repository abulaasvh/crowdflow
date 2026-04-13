/**
 * CrowdFlow Shared Constants
 *
 * Application-wide constants for API routes, WebSocket configuration,
 * security parameters, and business rules.
 */

// ─── API Routes ─────────────────────────────────────────────────
export const API_ROUTES = {
  AUTH: {
    BASE: '/api/auth',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
    GOOGLE_SIGNIN: '/api/auth/google',
    GRAPHQL: '/api/auth/graphql',
  },
  CROWD: {
    BASE: '/api/crowd',
    ZONES: '/api/crowd/zones',
    HEATMAP: '/api/crowd/heatmap',
    QUEUE_TIMES: '/api/crowd/queues',
    PREDICTIONS: '/api/crowd/predictions',
  },
  ORDERS: {
    BASE: '/api/orders',
    MENU: '/api/orders/menu',
    CART: '/api/orders/cart',
    CHECKOUT: '/api/orders/checkout',
    HISTORY: '/api/orders/history',
  },
  NAVIGATION: {
    BASE: '/api/navigation',
    ROUTE: '/api/navigation/route',
    BEACONS: '/api/navigation/beacons',
    EXIT_PLAN: '/api/navigation/exit-plan',
  },
} as const;

// ─── WebSocket Configuration ────────────────────────────────────
export const WS_CONFIG = {
  /** Crowd heatmap broadcast interval in milliseconds */
  HEATMAP_BROADCAST_INTERVAL_MS: 500,

  /** Heartbeat ping interval for connection health */
  HEARTBEAT_INTERVAL_MS: 10_000,

  /** Client reconnect backoff — max retries */
  MAX_RECONNECT_ATTEMPTS: 10,

  /** Client reconnect backoff — initial delay in ms */
  RECONNECT_BASE_DELAY_MS: 1_000,

  /** Maximum WebSocket payload size in bytes (1 MB) */
  MAX_PAYLOAD_BYTES: 1_048_576,

  /** Room prefix for zone-specific channels */
  ZONE_ROOM_PREFIX: 'zone:',

  /** Room for staff dashboard broadcast */
  STAFF_ROOM: 'staff:dashboard',
} as const;

// ─── Security Parameters ────────────────────────────────────────
export const SECURITY = {
  /** JWT access token expiry */
  ACCESS_TOKEN_EXPIRY: '15m',

  /** JWT refresh token expiry */
  REFRESH_TOKEN_EXPIRY: '7d',

  /** Argon2 — memory cost in KiB (64 MB) */
  ARGON2_MEMORY_COST: 65_536,

  /** Argon2 — time cost (iterations) */
  ARGON2_TIME_COST: 3,

  /** Argon2 — parallelism factor */
  ARGON2_PARALLELISM: 4,

  /** Rate limit — max login attempts per window */
  MAX_LOGIN_ATTEMPTS: 5,

  /** Rate limit — window duration in minutes */
  LOGIN_WINDOW_MINUTES: 1,

  /** CORS allowed origins */
  CORS_ORIGINS: [
    'http://localhost:3000',    // Staff dashboard dev
    'http://localhost:5173',    // Vite dev server
    'http://localhost:19006',   // Expo web (default)
    'http://localhost:8081',    // Expo Metro bundler
    'http://localhost:8082',    // Expo web (alt port)
  ],

  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,

  /** Maximum password length (prevent DoS via long hashing) */
  MAX_PASSWORD_LENGTH: 128,
} as const;

// ─── Stadium Configuration ──────────────────────────────────────
export const STADIUM = {
  /** Default number of zones in a stadium */
  DEFAULT_ZONE_COUNT: 24,

  /** Heatmap grid resolution (cells per axis) */
  HEATMAP_GRID_SIZE: 50,

  /** Maximum venue capacity */
  MAX_CAPACITY: 50_000,

  /** Density thresholds (percentage of zone capacity) */
  DENSITY_THRESHOLDS: {
    LOW: 0.3,
    MODERATE: 0.6,
    HIGH: 0.85,
    CRITICAL: 1.0,
  },

  /** Queue prediction window in minutes */
  QUEUE_PREDICTION_WINDOW_MINUTES: 15,

  /** Sensor data retention in hours (GDPR compliance) */
  SENSOR_DATA_RETENTION_HOURS: 24,
} as const;

// ─── Google Services ────────────────────────────────────────────
export const GOOGLE_SERVICES = {
  /** Google Analytics 4 event names */
  GA_EVENTS: {
    PAGE_VIEW: 'page_view',
    LOGIN: 'login',
    SIGN_UP: 'sign_up',
    MAP_INTERACTION: 'map_interaction',
    ZONE_CLICK: 'zone_click',
    ORDER_PLACED: 'order_placed',
    ALERT_ACKNOWLEDGED: 'alert_acknowledged',
    EXIT_PLAN_VIEWED: 'exit_plan_viewed',
    QUEUE_TIME_CHECKED: 'queue_time_checked',
  },
  /** Google Maps configuration */
  MAPS: {
    DEFAULT_ZOOM: 17,
    STADIUM_ZOOM: 18,
  },
} as const;
