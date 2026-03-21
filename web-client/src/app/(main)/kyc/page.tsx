import { Be_Vietnam_Pro } from "next/font/google";
import KycFlowMock from "@/components/kyc/KycFlowMock";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function KycPage() {
  return (
    <div className={beVietnamPro.className}>
      <KycFlowMock />
    </div>
  );
}