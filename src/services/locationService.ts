import { apiClient } from './apiClient';
import { appLogger } from './appLogger';

export interface SuburbLocation {
  id: number;
  suburb: string;
}

export interface LocationSearchResponse {
  status: boolean;
  message: string;
  count: number;
  search: string;
  data: SuburbLocation[];
}

// In-memory query cache to avoid redundant API hits for identical searches
const locationCache = new Map<string, SuburbLocation[]>();

export const locationService = {
  /**
   * GET /api/location?search=<query>
   * Fetches Australian suburbs matching the search query.
   */
  searchLocations: async (query: string): Promise<SuburbLocation[]> => {
    const trimmed = query.trim();
    const cacheKey = trimmed.toLowerCase();

    if (locationCache.has(cacheKey)) {
      return locationCache.get(cacheKey) || [];
    }

    try {
      appLogger.info('LOCATION_API', `Searching suburbs with query: "${trimmed}"`);
      const response = await apiClient.get<LocationSearchResponse>('/api/location', {
        params: { search: trimmed },
      });

      if (response.data?.status && Array.isArray(response.data?.data)) {
        const results = response.data.data;
        locationCache.set(cacheKey, results);
        return results;
      }

      return [];
    } catch (err: any) {
      appLogger.error('LOCATION_API', `Error searching locations for "${trimmed}":`, err?.message || err);
      console.warn('⚠️ Could not fetch locations from /api/location:', err?.message || err);
      return [];
    }
  },

  /**
   * Clears the in-memory cache
   */
  clearCache: () => {
    locationCache.clear();
  },
};
