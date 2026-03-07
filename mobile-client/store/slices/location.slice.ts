import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from 'axios';

export const getProvinces = createAsyncThunk(
  "location/getProvinces",
  async () => {
    const res = await axios.get("https://provinces.open-api.vn/api/p/");
    return res.data;
  }
);

// Lấy quận / huyện theo tỉnh
export const getDistricts = createAsyncThunk(
  "location/getDistricts",
  async (provinceCode: string) => {
    const res = await axios.get(
      `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
    );
    return res.data.districts;
  }
);

// Lấy phường / xã theo quận
export const getWards = createAsyncThunk(
  "location/getWards",
  async (districtCode: string) => {
    const res = await axios.get(
      `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
    );
    return res.data.wards;
  }
);

export const locationSlice = createSlice({
  name: "location",
  initialState: {
    provinces: [],
    districts: [],
    wards: [],
  },
  reducers: {
    clearDistrictsAndWards: (state) => {
      state.districts = [];
      state.wards = [];
    },
    clearWards: (state) => {
      state.wards = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProvinces.fulfilled, (state, action) => {
        state.provinces = action.payload;
      })
      .addCase(getDistricts.fulfilled, (state, action) => {
        state.districts = action.payload;
      })
      .addCase(getWards.fulfilled, (state, action) => {
        state.wards = action.payload;
      });
  },
});

export const { clearDistrictsAndWards, clearWards } =
  locationSlice.actions;

export default locationSlice.reducer;
