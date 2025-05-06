import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number; // Or string, if your user ID is a string
  }
}

// export {}; // Only needed if you get an error like "Cannot compile external module..."
