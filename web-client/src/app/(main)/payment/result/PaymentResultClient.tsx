"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Card, Divider, Result, Space, Typography, Tag, Tooltip } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  WalletOutlined,
  FileTextOutlined,
  HomeOutlined,
  CopyOutlined,
  LoadingOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

export default function PaymentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Raw Parameters
  const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
  const vnp_TransactionStatus = searchParams.get("vnp_TransactionStatus");
  const vnp_Amount = searchParams.get("vnp_Amount");
  const vnp_TxnRef = searchParams.get("vnp_TxnRef");
  const vnp_TransactionNo = searchParams.get("vnp_TransactionNo");
  const vnp_OrderInfo = searchParams.get("vnp_OrderInfo");
  const vnp_PayDate = searchParams.get("vnp_PayDate");

  const resultCode = searchParams.get("resultCode");
  const amount = searchParams.get("amount");
  const orderId = searchParams.get("orderId");
  const transId = searchParams.get("transId");
  const message = searchParams.get("message");
  const partnerCode = searchParams.get("partnerCode");

  // Normalized Info State
  const [paymentInfo, setPaymentInfo] = useState<{
    isSuccess: boolean;
    amount: number;
    code: string;
    gateway: "vnpay" | "momo" | "unknown";
    transactionNo: string;
    description: string;
    date: string;
  } | null>(null);

  useEffect(() => {
    // Determine payment gateway and status
    let isSuccess = false;
    let finalAmount = 0;
    let finalCode = "";
    let gateway: "vnpay" | "momo" | "unknown" = "unknown";
    let transactionNo = "";
    let description = "";
    let paymentDate = dayjs().format("DD/MM/YYYY HH:mm:ss");

    if (vnp_ResponseCode !== null) {
      // VNPay Flow
      gateway = "vnpay";
      isSuccess = vnp_ResponseCode === "00" && (vnp_TransactionStatus === "00" || vnp_TransactionStatus === null);
      finalAmount = vnp_Amount ? Number(vnp_Amount) / 100 : 0;
      finalCode = vnp_TxnRef || "";
      transactionNo = vnp_TransactionNo || "";
      description = vnp_OrderInfo ? decodeURIComponent(vnp_OrderInfo).replace(/\+/g, " ") : "Thanh toán qua cổng VNPAY";
      if (vnp_PayDate) {
        // vnp_PayDate format: yyyyMMddHHmmss
        const parsed = dayjs(vnp_PayDate, "YYYYMMDDHHmmss");
        if (parsed.isValid()) {
          paymentDate = parsed.format("DD/MM/YYYY HH:mm:ss");
        }
      }
    } else if (resultCode !== null) {
      // MoMo Flow
      gateway = "momo";
      isSuccess = resultCode === "0";
      finalAmount = amount ? Number(amount) : 0;
      finalCode = orderId || "";
      transactionNo = transId || "";
      description = message ? decodeURIComponent(message).replace(/\+/g, " ") : "Thanh toán qua ví MoMo";
    }

    setPaymentInfo({
      isSuccess,
      amount: finalAmount,
      code: finalCode,
      gateway,
      transactionNo,
      description,
      date: paymentDate,
    });
    setLoading(false);
  }, [
    vnp_ResponseCode,
    vnp_TransactionStatus,
    vnp_Amount,
    vnp_TxnRef,
    vnp_TransactionNo,
    vnp_OrderInfo,
    vnp_PayDate,
    resultCode,
    amount,
    orderId,
    transId,
    message,
    partnerCode,
  ]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <LoadingOutlined className="text-4xl text-indigo-600" spin />
        <Text type="secondary" className="text-base font-medium">
          Đang xác thực thông tin giao dịch...
        </Text>
      </div>
    );
  }

  if (!paymentInfo || paymentInfo.gateway === "unknown") {
    return (
      <div className="mx-auto my-12 max-w-xl p-4">
        <Card className="border-red-100 bg-red-50/20 shadow-xl rounded-3xl p-6 text-center">
          <Result
            status="error"
            title="Không tìm thấy thông tin giao dịch"
            subTitle="Hệ thống không nhận dạng được tham số trả về hoặc phiên thanh toán đã hết hạn."
            extra={[
              <Button
                type="primary"
                key="home"
                icon={<HomeOutlined />}
                className="bg-indigo-600 hover:bg-indigo-500 rounded-xl h-11 px-6 font-semibold"
                onClick={() => router.push("/dashboard")}
              >
                Về trang chủ
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  const isWalletTx =
    !paymentInfo.code.startsWith("DEP") &&
    !paymentInfo.code.startsWith("RENT") &&
    paymentInfo.code.length > 10; // usually UUID topup transaction ID

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-lg w-full">
        {/* Main Card */}
        <Card
          className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/90 backdrop-blur-md relative"
          bodyStyle={{ padding: 0 }}
        >
          {/* Accent Header Banner */}
          <div
            className={`h-3 w-full ${
              paymentInfo.isSuccess
                ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                : "bg-gradient-to-r from-rose-400 to-red-500"
            }`}
          />

          <div className="p-8">
            {/* Header Status */}
            <div className="flex flex-col items-center text-center mb-6">
              {paymentInfo.isSuccess ? (
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <CheckCircleFilled className="text-5xl text-emerald-500" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <CloseCircleFilled className="text-5xl text-rose-500" />
                </div>
              )}
              
              <Title level={2} className="m-0 text-[#1F1B4D] font-bold tracking-tight">
                {paymentInfo.isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
              </Title>
              <Text className="text-slate-400 text-sm mt-1">
                Cảm ơn bạn đã sử dụng dịch vụ của RentalPlatform
              </Text>
            </div>

            {/* Total Paid Highlight */}
            <div className="bg-slate-50 rounded-2xl p-5 mb-6 text-center border border-slate-100/50">
              <Text className="text-xs uppercase tracking-wider text-slate-400 block mb-1">
                Số tiền giao dịch
              </Text>
              <Text className="text-3xl font-extrabold text-[#2D226B]">
                {formatCurrency(paymentInfo.amount)}
              </Text>
            </div>

            {/* Detailed Bill Receipt */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <Text className="text-slate-400 text-sm">Mã giao dịch ứng dụng</Text>
                <div className="flex items-center gap-1.5">
                  <Text strong className="text-[#1F1B4D] text-sm">
                    {paymentInfo.code}
                  </Text>
                  <Tooltip title={copied ? "Đã sao chép!" : "Sao chép mã"}>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined className="text-slate-400 hover:text-indigo-600" />}
                      onClick={() => handleCopy(paymentInfo.code)}
                    />
                  </Tooltip>
                </div>
              </div>

              {paymentInfo.transactionNo && (
                <div className="flex justify-between items-center">
                  <Text className="text-slate-400 text-sm">Mã tham chiếu đối tác</Text>
                  <Text strong className="text-slate-600 text-sm">
                    {paymentInfo.transactionNo}
                  </Text>
                </div>
              )}

              <div className="flex justify-between items-center">
                <Text className="text-slate-400 text-sm">Phương thức thanh toán</Text>
                <Tag
                  color={paymentInfo.gateway === "vnpay" ? "blue" : "magenta"}
                  className="rounded-lg font-bold text-xs uppercase px-2.5 py-0.5 border-0"
                >
                  {paymentInfo.gateway === "vnpay" ? "VNPay Gate" : "Momo Wallet"}
                </Tag>
              </div>

              <div className="flex justify-between items-center">
                <Text className="text-slate-400 text-sm">Thời gian thực hiện</Text>
                <Text className="text-slate-600 text-sm font-medium">
                  {paymentInfo.date}
                </Text>
              </div>

              <div className="flex justify-between items-start gap-4">
                <Text className="text-slate-400 text-sm shrink-0">Thông tin nội dung</Text>
                <Text className="text-slate-600 text-sm text-right max-w-[70%] font-medium">
                  {paymentInfo.gateway === "momo" && !paymentInfo.isSuccess
                    ? "Giao dịch không thành công hoặc bị hủy từ người dùng."
                    : paymentInfo.description || "—"}
                </Text>
              </div>
            </div>

            <Divider className="my-6 border-slate-100" />

            {/* Smart Action Buttons */}
            <div className="flex flex-col gap-3">
              {isWalletTx ? (
                <Button
                  type="primary"
                  icon={<WalletOutlined />}
                  size="large"
                  className="w-full bg-[#5B5BFF] hover:bg-[#4E4EDD] h-12 rounded-xl text-base font-semibold shadow-lg shadow-indigo-100 flex items-center justify-center"
                  onClick={() => router.push("/dashboard/wallet")}
                >
                  Về ví cá nhân <ArrowRightOutlined className="text-xs ml-1" />
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  size="large"
                  className="w-full bg-[#5B5BFF] hover:bg-[#4E4EDD] h-12 rounded-xl text-base font-semibold shadow-lg shadow-indigo-100 flex items-center justify-center"
                  onClick={() =>
                    router.push(
                      paymentInfo.code.startsWith("DEP")
                        ? "/dashboard/contracts"
                        : "/dashboard/payments"
                    )
                  }
                >
                  Xem danh sách hợp đồng/yêu cầu <ArrowRightOutlined className="text-xs ml-1" />
                </Button>
              )}

              <Button
                size="large"
                icon={<HomeOutlined />}
                className="w-full border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-600 h-12 rounded-xl text-base font-medium flex items-center justify-center"
                onClick={() => router.push("/dashboard")}
              >
                Về bảng điều khiển
              </Button>
            </div>
          </div>
        </Card>

        {/* Security badge at bottom */}
        <p className="text-center text-xs text-slate-400 mt-6">
          🔒 Giao dịch được bảo mật bởi Ngân hàng Nhà nước và Cổng thanh toán quốc gia.
        </p>
      </div>
    </div>
  );
}
