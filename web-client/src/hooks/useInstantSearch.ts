"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import apiClient from "@/utils/api";

interface InstantSearchPropertyCard {
  id: string;
  title: string;
  image: string;
  price: string;
  district: string;
  city: string;
  slug: string;
}

interface ExtractedFilters {
  propertyType?: string | null;
  district?: string | null;
  city?: string | null;
  priceMax?: number | null;
  priceMin?: number | null;
  bedrooms?: number | null;
  keyword?: string | null;
}

interface InstantSearchResult {
  keywords: string[];
  properties: InstantSearchPropertyCard[];
  filters: ExtractedFilters | null;
  loading: boolean;
}

/**
 * Custom hook for AI-powered instant search.
 * Debounces input and calls the ai-service instant search endpoint.
 *
 * @param query - Current search input text
 * @param mode - "home" (keywords only) or "search" (keywords + properties)
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 */
export function useInstantSearch(
  query: string,
  mode: "home" | "search" = "home",
  debounceMs: number = 300
): InstantSearchResult {
  const [result, setResult] = useState<InstantSearchResult>({
    keywords: [],
    properties: [],
    filters: null,
    loading: false,
  });

  // Abort controller ref for cancelling in-flight requests
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(
    async (q: string, searchMode: "home" | "search") => {
      if (!q || q.trim().length < 1) {
        setResult({ keywords: [], properties: [], filters: null, loading: false });
        return;
      }

      // Cancel previous request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      setResult((prev) => ({ ...prev, loading: true }));

      try {
        const params = new URLSearchParams({
          q: q.trim(),
          mode: searchMode,
        });

        const data = await apiClient.get(
          `/ai/api/v1/search/instant?${params.toString()}`
        );

        setResult({
          keywords: data?.keywords || [],
          properties: data?.properties || [],
          filters: data?.filters || null,
          loading: false,
        });
      } catch (error: any) {
        // Don't update state if request was aborted
        if (error?.name === "AbortError") return;

        console.warn("[useInstantSearch] Error:", error?.message);
        setResult((prev) => ({
          ...prev,
          loading: false,
        }));
      }
    },
    []
  );

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setResult({ keywords: [], properties: [], filters: null, loading: false });
      return;
    }

    const timer = setTimeout(() => {
      fetchSuggestions(query, mode);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [query, mode, debounceMs, fetchSuggestions]);

  return result;
}

export type { InstantSearchPropertyCard, ExtractedFilters, InstantSearchResult };
