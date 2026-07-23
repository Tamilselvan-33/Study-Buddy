import api from './api';
import type { MatchRecommendation, ApiResponse } from '../types';

export interface RecommendationQueryParams {
  subject?: string;
  min_score?: number;
  skill_level?: string;
  search?: string;
  sort_by?: 'compatibility' | 'name' | 'skill';
}

export const matchingService = {
  getRecommendations: async (params?: RecommendationQueryParams): Promise<MatchRecommendation[]> => {
    const res: ApiResponse<{ recommendations: MatchRecommendation[]; totalMatches: number }> = await api.get('/matching/recommendations', {
      params,
    });
    return res.data.recommendations;
  },

  explainMatch: async (targetUserId: string): Promise<any> => {
    const res: ApiResponse<any> = await api.get(`/matching/explain/${targetUserId}`);
    return res.data;
  },
};
