import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth.slice";
import propertyReducer from "./slices/property.slice";
import notificationReducer from "./slices/notification.slice";
import conversationReducer from './slices/conversation.slice'
import messageReducer from "./slices/message.slice"
import customerCategoryReducer from "./slices/customer-category.slice"
import estateReducer from "./slices/estate.slice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      property: propertyReducer,
      notification: notificationReducer,
      conversation: conversationReducer,
      message: messageReducer,
      customerCategory: customerCategoryReducer,
      estate: estateReducer,
    },
  });
};
export const store = makeStore();

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

