import {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  JwtPayload,
} from '../../../src/utils/jwt';

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------
const mockPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
  userId: 'user-001',
  role: 'user',
  firstName: 'Mario',
  lastName: 'Rossi',
  email: 'mario.rossi@example.com',
};

// ---------------------------------------------------------------------------
// generateToken
// ---------------------------------------------------------------------------
describe('generateToken', () => {
  it('should return a string composed of three dot-separated segments (JWT format)', () => {
    const token = generateToken(mockPayload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should embed userId and role in the decoded payload', () => {
    const token = generateToken(mockPayload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.role).toBe(mockPayload.role);
  });
});

// ---------------------------------------------------------------------------
// verifyToken
// ---------------------------------------------------------------------------
describe('verifyToken', () => {
  it('should successfully decode a freshly generated token', () => {
    const token = generateToken(mockPayload);
    expect(() => verifyToken(token)).not.toThrow();
    const decoded = verifyToken(token);
    expect(decoded.firstName).toBe(mockPayload.firstName);
  });

  it('should throw on a token signed with a different secret', () => {
    // Sign a token with a wrong secret directly via jsonwebtoken
    const jwt = require('jsonwebtoken');
    const bad = jwt.sign({ userId: 'x', role: 'user', firstName: 'X', lastName: 'Y' }, 'wrong-secret');
    expect(() => verifyToken(bad)).toThrow();
  });

  it('should throw on a clearly malformed token string', () => {
    expect(() => verifyToken('not.a.valid.jwt')).toThrow();
  });

  it('should throw on an already-expired token', () => {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET ?? 'fallback-secret-key';
    const expired = jwt.sign(
      { userId: 'x', role: 'user', firstName: 'X', lastName: 'Y' },
      secret,
      { expiresIn: '0s', issuer: 'zenithstore-api', audience: 'zenithstore-users' }
    );
    expect(() => verifyToken(expired)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// extractTokenFromHeader
// ---------------------------------------------------------------------------
describe('extractTokenFromHeader', () => {
  it('should return null when the header is undefined', () => {
    expect(extractTokenFromHeader(undefined)).toBeNull();
  });

  it('should return null for a single-segment header with no space', () => {
    expect(extractTokenFromHeader('InvalidHeader')).toBeNull();
  });

  it('should return null when the scheme is not "Bearer"', () => {
    expect(extractTokenFromHeader('Basic abc123')).toBeNull();
  });

  it('should extract the raw token from a valid Bearer header', () => {
    const raw = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def';
    expect(extractTokenFromHeader(`Bearer ${raw}`)).toBe(raw);
  });
});
