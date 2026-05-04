import { configureStore } from "@reduxjs/toolkit";
import locationReducer from "./slices/location.slice"
import propertyReducer from "./slices/property.slice"
import notificationReduer from "./slices/notification.slice"
import authReducer from "./slices/auth.slice"
import bookingReducer from './slices/booking.slice'
import contractReducer from './slices/contract.slice'
import conversationReducer from './slices/conversation.slice'
import messageReducer from "./slices/message.slice"
import customerCategoryReducer from "./slices/customer-category.slice"
import estateReducer from "./slices/estate.slice"
import kycReducer from "./slices/kyc.slice"
import walletReducer from "./slices/wallet.slice"

export const makeStore = () => {
  return configureStore({
    reducer: {
      location: locationReducer,
      property: propertyReducer,
      notification: notificationReduer,
      auth: authReducer,
      booking: bookingReducer,
      contract: contractReducer,
      conversation: conversationReducer,
      message: messageReducer,
      customerCategory: customerCategoryReducer,
      estate: estateReducer,
      kyc: kycReducer,
      wallet: walletReducer,
    },
  });
};

export const store = makeStore();

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];