/**
 * Token and Storage Service
 * Handles access/refresh token persistence in memory and storage
 */

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export const tokenStorage = {
  getAccessToken: (): string | null => {
    return inMemoryAccessToken;
  },

  setAccessToken: (token: string | null) => {
    inMemoryAccessToken = token;
  },

  getRefreshToken: (): string | null => {
    return inMemoryRefreshToken;
  },

  setRefreshToken: (token: string | null) => {
    inMemoryRefreshToken = token;
  },

  setTokens: (accessToken: string, refreshToken?: string) => {
    inMemoryAccessToken = accessToken;
    if (refreshToken) {
      inMemoryRefreshToken = refreshToken;
    }
  },

  clearTokens: () => {
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
  },
};
