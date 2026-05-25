import type { IUserDoc } from '../models/User';

declare module 'express-serve-static-core' {
  interface Request {
    vedaUser?: IUserDoc;
  }
}

export {};
