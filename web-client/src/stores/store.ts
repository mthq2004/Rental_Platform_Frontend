import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth.slice";
import propertyReducer from "./slices/property.slice";
import notificationReducer from "./slices/notification.slice";
import conversationReducer from './slices/conversation.slice'
import messageReducer from "./slices/message.slice"
import customerCategoryReducer from "./slices/customer-category.slice"
import estateReducer from "./slices/estate.slice";
import bookingReducer from "./slices/booking.slice";
import contractReducer from "./slices/contract.slice";
import templateReducer from "./slices/template-contract.slice";
import kycReducer from "./slices/kyc.slice";
import smartcaReducer from "./slices/smartca.slice";
import walletReducer from "./slices/wallet.slice";
import bulkImportReducer from "./slices/bulk-import.slice";

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
      booking: bookingReducer,
      contract: contractReducer,
      template: templateReducer,
      kyc: kycReducer,
      smartca: smartcaReducer,
      wallet: walletReducer,
      bulkImport: bulkImportReducer,
    },
  });
};
export const store = makeStore();

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

