import jwt, { SignOptions } from 'jsonwebtoken';
import { ENV } from '../config/environment';
import { UserRole } from '@upvia/shared';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  universityId?: string;
  collegeId?: string;
  departmentId?: string;
  programId?: string;
  companyId?: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: ENV.JWT_EXPIRES_IN as any,
  };
  return jwt.sign(payload, ENV.JWT_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any,
  };
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as TokenPayload;
};
