import apiClient from "@/utils/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  SearchPropertyParams,
  SearchPropertyResponse,
  PropertyListItem,
  PropertyDetailApiData,
  FeaturedPropertyItem,
} from "@/types/property.type";

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildSearchQuery(params: SearchPropertyParams): string {
  const p = new URLSearchParams();
  if (params.keyword) p.set("keyword", params.keyword);
  if (params.propertyType) p.set("propertyType", params.propertyType);
  if (params.priceMin != null) p.set("priceMin", String(params.priceMin));
  if (params.priceMax != null && params.priceMax > 0) p.set("priceMax", String(params.priceMax));
  if (params.areaMin != null) p.set("areaMin", String(params.areaMin));
  if (params.areaMax != null) p.set("areaMax", String(params.areaMax));
  if (params.city) p.set("city", params.city);
  if (params.district) p.set("district", params.district);
  if (params.bedrooms != null) p.set("bedrooms", String(params.bedrooms));
  if (params.cursor) p.set("cursor", params.cursor);
  if (params.limit) p.set("limit", String(params.limit));
  if (params.sortBy) p.set("sortBy", params.sortBy);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const searchPropertiesThunk = createAsyncThunk(
  "estate/searchProperties",
  async (params: SearchPropertyParams, { rejectWithValue }) => {
    try {
      const qs = buildSearchQuery(params);
      
      const res = await apiClient.get(`/estate/properties/search${qs}`);
      
      return res.data.data as SearchPropertyResponse;
    } catch (error: any) {
      return rejectWithValue(error.message || "Tìm kiếm thất bại");
    }
  }
);

export const fetchSimilarPropertiesThunk = createAsyncThunk(
  "estate/fetchSimilarProperties",
  async (params: SearchPropertyParams, { rejectWithValue }) => {
    try {
      const qs = buildSearchQuery(params);
      const res = await apiClient.get(`/estate/properties/search${qs}`);
      return (res.data.data as SearchPropertyResponse).data as PropertyListItem[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Lấy tin tương tự thất bại");
    }
  }
);

export const getPropertyDetailThunk = createAsyncThunk(
  "estate/getPropertyDetail",
  async (propertyId: string, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/estate/properties/public/${propertyId}`);
      return res.data.data as PropertyDetailApiData;
    } catch (error: any) {
      return rejectWithValue(error.message || "Lấy chi tiết bất động sản thất bại");
    }
  }
);

export const getFeaturedPropertiesThunk = createAsyncThunk(
  "estate/getFeaturedProperties",
  async (limit: number = 12, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/estate/properties/featured?limit=${limit}`);
      return res.data.data as { data: FeaturedPropertyItem[]; nextCursor: string | null; hasMore: boolean; total: number };
    } catch (error: any) {
      return rejectWithValue(error.message || "Lấy tin nổi bật thất bại");
    }
  }
);

export const getListProperty = createAsyncThunk(
  "estate/getListProperty",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/estate/properties`);
      return res.data.data as { data: FeaturedPropertyItem[]; nextCursor: string | null; hasMore: boolean; total: number };
    } catch (error: any) {
      return rejectWithValue(error.message || "Lấy tin nổi bật thất bại");
    }
  }
);

// ─── Favorites ────────────────────────────────────────────────────────────────

export const getFavoritePropertiesThunk = createAsyncThunk(
  "estate/getFavoriteProperties",
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/estate/properties/favorites?page=${page}&limit=${limit}`);
      return res.data.data as { items: PropertyListItem[]; meta: any };
    } catch (error: any) {
      return rejectWithValue(error.message || "Lấy danh sách yêu thích thất bại");
    }
  }
);

export const getFavoriteStatusThunk = createAsyncThunk(
  "estate/getFavoriteStatus",
  async (propertyId: string, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/estate/properties/${propertyId}/favorite-status`);
      return res.data as { propertyId: string; isFavorited: boolean };
    } catch (error: any) {
      return rejectWithValue(error.message || "Kiểm tra trạng thái yêu thích thất bại");
    }
  }
);

export const addFavoriteThunk = createAsyncThunk(
  "estate/addFavorite",
  async (propertyId: string, { rejectWithValue }) => {
    try {
      await apiClient.post(`/estate/properties/${propertyId}/favorite`);
      return { propertyId, isFavorited: true };
    } catch (error: any) {
      return rejectWithValue(error.message || "Thêm yêu thích thất bại");
    }
  }
);

export const removeFavoriteThunk = createAsyncThunk(
  "estate/removeFavorite",
  async (propertyId: string, { rejectWithValue }) => {
    try {
      await apiClient.put(`/estate/properties/${propertyId}/unfavorite`);
      return { propertyId, isFavorited: false };
    } catch (error: any) {
      return rejectWithValue(error.message || "Bỏ yêu thích thất bại");
    }
  }
);

// ─── State ────────────────────────────────────────────────────────────────────

interface EstateState {
  search: {
    loading: boolean;
    data: PropertyListItem[];
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
    error: string | null;
  };
  similar: {
    loading: boolean;
    data: PropertyListItem[];
    error: string | null;
  };
  detail: {
    loading: boolean;
    data: PropertyDetailApiData | null;
    error: string | null;
  };
  featured: {
    loading: boolean;
    data: FeaturedPropertyItem[];
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
    error: string | null;
  };
  favorites: {
    loading: boolean;
    items: PropertyListItem[];
    meta: any;
    error: string | null;
  };
  favoriteStatusMap: Record<string, boolean>;
  favoriteActionLoading: boolean;
}

const initialState: EstateState = {
  search: { loading: false, data: [], nextCursor: null, hasMore: false, total: 0, error: null },
  similar: { loading: false, data: [], error: null },
  detail: { loading: false, data: null, error: null },
  featured: { loading: false, data: [], nextCursor: null, hasMore: false, total: 0, error: null },
  favorites: { loading: false, items: [], meta: null, error: null },
  favoriteStatusMap: {},
  favoriteActionLoading: false,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const estateSlice = createSlice({
  name: "estate",
  initialState,
  reducers: {
    clearDetail: (state) => {
      state.detail = { loading: false, data: null, error: null };
    },
    clearSearch: (state) => {
      state.search = { loading: false, data: [], nextCursor: null, hasMore: false, total: 0, error: null };
    },
  },
  extraReducers: (builder) => {
    // searchPropertiesThunk
    builder
      .addCase(searchPropertiesThunk.pending, (state) => {
        state.search.loading = true;
        state.search.error = null;
      })
      .addCase(searchPropertiesThunk.fulfilled, (state, action) => {
        state.search.loading = false;
        state.search.data = action.payload.data;
        state.search.nextCursor = action.payload.nextCursor;
        state.search.hasMore = action.payload.hasMore;
        state.search.total = action.payload.total;
      })
      .addCase(searchPropertiesThunk.rejected, (state, action) => {
        state.search.loading = false;
        state.search.error = (action.payload as string) || "Tìm kiếm thất bại";
        state.search.data = [];
      });

    // fetchSimilarPropertiesThunk
    builder
      .addCase(fetchSimilarPropertiesThunk.pending, (state) => {
        state.similar.loading = true;
        state.similar.error = null;
      })
      .addCase(fetchSimilarPropertiesThunk.fulfilled, (state, action) => {
        state.similar.loading = false;
        state.similar.data = action.payload;
      })
      .addCase(fetchSimilarPropertiesThunk.rejected, (state, action) => {
        state.similar.loading = false;
        state.similar.error = (action.payload as string) || "Lấy tin tương tự thất bại";
      });

    // getPropertyDetailThunk
    builder
      .addCase(getPropertyDetailThunk.pending, (state) => {
        state.detail.loading = true;
        state.detail.error = null;
      })
      .addCase(getPropertyDetailThunk.fulfilled, (state, action) => {
        state.detail.loading = false;
        state.detail.data = action.payload;
      })
      .addCase(getPropertyDetailThunk.rejected, (state, action) => {
        state.detail.loading = false;
        state.detail.error = (action.payload as string) || "Lấy chi tiết thất bại";
      });

    // getFeaturedPropertiesThunk
    builder
      .addCase(getFeaturedPropertiesThunk.pending, (state) => {
        state.featured.loading = true;
        state.featured.error = null;
      })
      .addCase(getFeaturedPropertiesThunk.fulfilled, (state, action) => {
        state.featured.loading = false;
        state.featured.data = action.payload.data;
        state.featured.nextCursor = action.payload.nextCursor;
        state.featured.hasMore = action.payload.hasMore;
        state.featured.total = action.payload.total;
      })
      .addCase(getFeaturedPropertiesThunk.rejected, (state, action) => {
        state.featured.loading = false;
        state.featured.error = (action.payload as string) || "Lấy tin nổi bật thất bại";
      });

    builder
      .addCase(getListProperty.pending, (state) => {
        state.featured.loading = true;
        state.featured.error = null;
      })
      .addCase(getListProperty.fulfilled, (state, action) => {
        state.featured.loading = false;
        state.featured.data = action.payload.data;
        state.featured.nextCursor = action.payload.nextCursor;
        state.featured.hasMore = action.payload.hasMore;
        state.featured.total = action.payload.total;
      })
      .addCase(getListProperty.rejected, (state, action) => {
        state.featured.loading = false;
        state.featured.error = (action.payload as string) || "Lấy tin nổi bật thất bại";
      });

    // ─── Favorites ──────────────────────────────────────────────────────────
    builder
      .addCase(getFavoritePropertiesThunk.pending, (state) => {
        state.favorites.loading = true;
        state.favorites.error = null;
      })
      .addCase(getFavoritePropertiesThunk.fulfilled, (state, action) => {
        state.favorites.loading = false;
        state.favorites.items = action.payload.items || [];
        state.favorites.meta = action.payload.meta;
      })
      .addCase(getFavoritePropertiesThunk.rejected, (state, action) => {
        state.favorites.loading = false;
        state.favorites.error = (action.payload as string) || "Lấy danh sách yêu thích thất bại";
        state.favorites.items = [];
      });

    builder
      .addCase(getFavoriteStatusThunk.pending, (state) => {
        state.favoriteActionLoading = true;
      })
      .addCase(getFavoriteStatusThunk.fulfilled, (state, action) => {
        state.favoriteActionLoading = false;
        state.favoriteStatusMap[action.payload.propertyId] = action.payload.isFavorited;
      })
      .addCase(getFavoriteStatusThunk.rejected, (state) => {
        state.favoriteActionLoading = false;
      });

    builder
      .addCase(addFavoriteThunk.pending, (state) => {
        state.favoriteActionLoading = true;
      })
      .addCase(addFavoriteThunk.fulfilled, (state, action) => {
        state.favoriteActionLoading = false;
        state.favoriteStatusMap[action.payload.propertyId] = true;
      })
      .addCase(addFavoriteThunk.rejected, (state) => {
        state.favoriteActionLoading = false;
      });

    builder
      .addCase(removeFavoriteThunk.pending, (state) => {
        state.favoriteActionLoading = true;
      })
      .addCase(removeFavoriteThunk.fulfilled, (state, action) => {
        state.favoriteActionLoading = false;
        state.favoriteStatusMap[action.payload.propertyId] = false;
        state.favorites.items = state.favorites.items.filter(i => i.id !== action.payload.propertyId);
      })
      .addCase(removeFavoriteThunk.rejected, (state) => {
        state.favoriteActionLoading = false;
      });
  },
});

export const { clearDetail, clearSearch } = estateSlice.actions;
export default estateSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectSearchState = (state: { estate: EstateState }) => state.estate.search;
export const selectSimilarState = (state: { estate: EstateState }) => state.estate.similar;
export const selectDetailState = (state: { estate: EstateState }) => state.estate.detail;
export const selectFeaturedState = (state: { estate: EstateState }) => state.estate.featured;
export const selectFavoritesState = (state: { estate: EstateState }) => state.estate.favorites;
export const selectFavoriteStatusMap = (state: { estate: EstateState }) => state.estate.favoriteStatusMap;
