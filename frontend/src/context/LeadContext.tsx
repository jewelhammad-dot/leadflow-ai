import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api, ApiError } from '../api/client';
import type {
  Lead,
  LeadCreatePayload,
  LeadQualification,
  LeadUpdatePayload,
  LeadWithLatestQualification,
  MetricsSummary,
} from '../types';
import { useAuth } from './AuthContext';

interface LeadContextType {
  leads: LeadWithLatestQualification[];
  isLoading: boolean;
  isQualifying: Record<number, boolean>;
  error: string | null;
  metrics: MetricsSummary;
  refreshLeads: () => Promise<void>;
  createLead: (payload: LeadCreatePayload) => Promise<Lead>;
  updateLead: (id: number, payload: LeadUpdatePayload) => Promise<Lead>;
  deleteLead: (id: number) => Promise<void>;
  qualifyLead: (id: number) => Promise<LeadQualification>;
  fetchLeadHistory: (id: number) => Promise<LeadQualification[]>;
  clearError: () => void;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export const LeadProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [leads, setLeads] = useState<LeadWithLatestQualification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isQualifying, setIsQualifying] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchQualificationsForLeads = useCallback(async (rawLeads: Lead[]) => {
    const enriched = await Promise.all(
      rawLeads.map(async (lead) => {
        try {
          const history = await api.getQualifications(lead.id);
          const latest = history.length > 0 ? history[0] : null;
          return {
            ...lead,
            latestQualification: latest,
            qualificationsHistory: history,
          };
        } catch {
          return {
            ...lead,
            latestQualification: null,
            qualificationsHistory: [],
          };
        }
      })
    );
    return enriched;
  }, []);

  const refreshLeads = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const rawLeads = await api.getLeads();
      const enrichedLeads = await fetchQualificationsForLeads(rawLeads);
      setLeads(enrichedLeads);
    } catch (err: any) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to fetch leads.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchQualificationsForLeads]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshLeads();
    } else {
      setLeads([]);
    }
  }, [isAuthenticated, refreshLeads]);

  const createLead = useCallback(async (payload: LeadCreatePayload): Promise<Lead> => {
    try {
      const newLead = await api.createLead(payload);
      const enriched: LeadWithLatestQualification = {
        ...newLead,
        latestQualification: null,
        qualificationsHistory: [],
      };
      setLeads((prev) => [enriched, ...prev]);
      return newLead;
    } catch (err: any) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to create lead.';
      setError(msg);
      throw err;
    }
  }, []);

  const updateLead = useCallback(async (
    id: number,
    payload: LeadUpdatePayload
  ): Promise<Lead> => {
    try {
      const updated = await api.updateLead(id, payload);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                ...updated,
              }
            : l
        )
      );
      return updated;
    } catch (err: any) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to update lead.';
      setError(msg);
      throw err;
    }
  }, []);

  const deleteLead = useCallback(async (id: number): Promise<void> => {
    try {
      await api.deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to delete lead.';
      setError(msg);
      throw err;
    }
  }, []);

  const qualifyLead = useCallback(async (id: number): Promise<LeadQualification> => {
    setIsQualifying((prev) => ({ ...prev, [id]: true }));
    setError(null);
    try {
      const qualification = await api.qualifyLead(id);
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id === id) {
            const updatedHistory = [
              qualification,
              ...(l.qualificationsHistory || []),
            ];
            return {
              ...l,
              latestQualification: qualification,
              qualificationsHistory: updatedHistory,
            };
          }
          return l;
        })
      );
      return qualification;
    } catch (err: any) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'AI Qualification encountered an error. Please verify OpenRouter API configuration.';
      setError(msg);
      throw err;
    } finally {
      setIsQualifying((prev) => ({ ...prev, [id]: false }));
    }
  }, []);

  const fetchLeadHistory = useCallback(async (id: number): Promise<LeadQualification[]> => {
    try {
      const history = await api.getQualifications(id);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                latestQualification: history.length > 0 ? history[0] : null,
                qualificationsHistory: history,
              }
            : l
        )
      );
      return history;
    } catch (err: any) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Failed to retrieve qualification history.';
      setError(msg);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Compute live intelligence metrics based on real database entries
  const metrics = useMemo<MetricsSummary>(() => {
    const totalLeads = leads.length;
    let hotLeads = 0;
    let warmLeads = 0;
    let coldLeads = 0;
    let totalScore = 0;
    let scoredCount = 0;

    leads.forEach((lead) => {
      if (lead.latestQualification) {
        const cls = (lead.latestQualification.classification || '').toUpperCase();
        if (cls === 'HOT') hotLeads += 1;
        else if (cls === 'WARM') warmLeads += 1;
        else if (cls === 'COLD') coldLeads += 1;

        totalScore += Number(lead.latestQualification.score) || 0;
        scoredCount += 1;
      }
    });

    const unqualifiedLeads = totalLeads - scoredCount;
    const averageScore =
      scoredCount > 0 ? Math.round((totalScore / scoredCount) * 10) / 10 : 0;
    const qualificationRate =
      totalLeads > 0 ? Math.round((scoredCount / totalLeads) * 100) : 0;

    return {
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      unqualifiedLeads,
      averageScore,
      qualificationRate,
    };
  }, [leads]);

  const contextValue = useMemo<LeadContextType>(
    () => ({
      leads,
      isLoading,
      isQualifying,
      error,
      metrics,
      refreshLeads,
      createLead,
      updateLead,
      deleteLead,
      qualifyLead,
      fetchLeadHistory,
      clearError,
    }),
    [
      leads,
      isLoading,
      isQualifying,
      error,
      metrics,
      refreshLeads,
      createLead,
      updateLead,
      deleteLead,
      qualifyLead,
      fetchLeadHistory,
      clearError,
    ]
  );

  return (
    <LeadContext.Provider value={contextValue}>
      {children}
    </LeadContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadProvider');
  }
  return context;
};
