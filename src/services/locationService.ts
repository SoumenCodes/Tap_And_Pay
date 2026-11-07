import { apiClient } from './apiClient';
import { appLogger } from './appLogger';

export interface SuburbLocation {
  id: number | string;
  suburb: string;
  description?: string;
}

export interface LocationSearchResponse {
  status: boolean;
  message: string;
  count: number;
  search: string | null;
  data: SuburbLocation[];
}

// In-memory query cache to avoid redundant API hits for identical searches
const locationCache = new Map<string, SuburbLocation[]>();

export const locationService = {
  /**
   * GET /api/location?type=<type>&search=<query>
   * Fetches Australian suburbs or preset locations matching the type and search query.
   * e.g. /api/location -> top presets & suburbs
   * e.g. /api/location?type=home -> all suburbs
   * e.g. /api/location?type=home&search=mel -> suburbs matching 'mel'
   */
  searchLocations: async (query: string = '', type?: string): Promise<SuburbLocation[]> => {
    const trimmed = query.trim();
    const cacheKey = `${type || 'all'}_${trimmed.toLowerCase()}`;

    if (locationCache.has(cacheKey)) {
      return locationCache.get(cacheKey) || [];
    }

    try {
      appLogger.info('LOCATION_API', `Searching locations with type: "${type || ''}", query: "${trimmed}"`);
      const params: Record<string, string> = {};
      if (type) {
        params.type = type;
      }
      if (trimmed) {
        params.search = trimmed;
      }

      const response = await apiClient.get<LocationSearchResponse>('/api/location', { params });

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
