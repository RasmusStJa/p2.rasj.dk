// backend/types/express/index.d.ts

// This line ensures the file is treated as a module.
export {};

declare global {
    namespace Express {
        export interface Request {
            user?: { // User property is optional
                id: number; // Or string, if your user IDs are not numbers
                // You can add other properties your auth middleware might attach:
                // username?: string;
                // email?: string;
                // role?: string;
            };
            // If you are using express-session and want to type req.session.user
            // you might also augment the SessionData interface from express-session here
            // or in a separate .d.ts file for session types.
            // For example:
            // session: Session & Partial<SessionData> & {
            //    user?: { id: number; /* other user props */ }
            // };
        }
    }
}
