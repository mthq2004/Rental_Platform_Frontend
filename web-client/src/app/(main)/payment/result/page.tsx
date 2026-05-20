import { Suspense } from "react";
import PaymentResultClient from "./PaymentResultClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Đang tải kết quả thanh toán...
        </div>
      }
    >
      <PaymentResultClient />
    </Suspense>
  );
}