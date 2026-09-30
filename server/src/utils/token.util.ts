import crypto from 'crypto';

export const INVITATION_TOKEN_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

export interface GeneratedInvitationToken {
  /** Raw token — only ever sent to the invitee (in the activation link), never stored. */
  rawToken: string;
  /** SHA-256 digest of rawToken — what actually gets persisted to `User.invitationToken`. */
  hashedToken: string;
  expiresAt: Date;
}

/**
 * Generates an invitation/activation token. The raw value goes into the
 * activation link; only its hash is persisted, so a database read (or leak)
 * alone can never be used to activate an account — the same pattern used for
 * password-reset tokens.
 */
export const generateInvitationToken = (): GeneratedInvitationToken => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  return {
    rawToken,
    hashedToken: hashToken(rawToken),
    expiresAt: new Date(Date.now() + INVITATION_TOKEN_TTL_MS),
  };
};

export const hashToken = (rawToken: string): string => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

export const buildActivationLink = (clientUrl: string, rawToken: string): string => {
  return `${clientUrl}/activate?token=${rawToken}`;
};
