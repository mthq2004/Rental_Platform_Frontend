import { configureStore } from "@reduxjs/toolkit";
import locationReducer from "./slices/location.slice"
import propertyReducer from "./slices/property.slice"
import notificationReduer from "./slices/notification.slice"

export const makeStore = () => {
  return configureStore({
    reducer: {
      location: locationReducer,
      property: propertyReducer,
      notification: notificationReduer
    },
  });
};

export const store = makeStore();

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];