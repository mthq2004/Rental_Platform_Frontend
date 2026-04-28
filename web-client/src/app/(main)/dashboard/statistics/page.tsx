"use client";

import React, { useEffect, useMemo } from "react";
import { Card, Button, Typography, Row, Col, Progress, Empty, Tooltip as AntTooltip, Spin } from "antd";
import {
  LineChartOutlined,
  ReloadOutlined,
  WalletOutlined,
  HomeOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { getMyContracts, getMyPayments, getContractStatusCounts } from "@/stores/slices/contract.slice";
import { getOwnerRequests } from "@/stores/slices/contract.slice";
import { motion } from "framer-motion";

const { Text, Title } = Typography;

export default function StatisticsPage() {
  const dispatch = useAppDispatch();
  const { contracts, contractsLoading, contractStatusCounts, payments, paymentsLoading } = useAppSelector((state) => state.contract);

  useEffect(() => {
    dispatch(getMyContracts({ limit: 1000 }));
    dispatch(getMyPayments({ limit: 1000 }));
    dispatch(getContractStatusCounts());
    dispatch(getOwnerRequests());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(getMyContracts({ limit: 1000 }));
    dispatch(getMyPayments({ limit: 1000 }));
    dispatch(getContractStatusCounts());
    dispatch(getOwnerRequests());
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  const stats = useMemo(() => {
    const activeContracts = contracts.filter(c => c.status === "active");
    const totalMonthlyRent = activeContracts.reduce((sum, c) => sum + Number(c.monthlyRent || 0), 0);
    const totalRevenue = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      activeCount: activeContracts.length,
      totalContracts: contracts.length,
      monthlyExpectedRent: totalMonthlyRent,
      totalRevenue: totalRevenue,
      paymentCount: payments.length,
      paidCount: payments.filter(p => p.status === "paid").length,
    };
  }, [contracts, payments]);

  // Derived Chart Data (Mocking a simple Monthly Revenue view from payments if dates available)
  const monthlyRevenue = useMemo(() => {
    const data = Array(6).fill(0); // View last 6 months
    const now = new Date();

    payments.forEach(p => {
      if (p.status !== "paid") return;
      const d = p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt || Date.now());
      const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (monthDiff >= 0 && monthDiff < 6) {
        data[5 - monthDiff] += Number(p.amount || 0);
      }
    });

    return data;
  }, [payments]);

  const monthsLabel = useMemo(() => {
    const res = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      res.push(`T${d.getMonth() + 1}/${d.getFullYear().toString().substring(2)}`);
    }
    return res;
  }, []);

  const totalChartMax = Math.max(...monthlyRevenue, 1);

  if (contractsLoading || paymentsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-5 px-1 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-xl font-semibold text-gray-800 tracking-tight mb-0.5">Thống kê & Phân tích</h2>
          <p className="text-sm text-gray-400">Xem bức tranh toàn cảnh về hoạt động kinh doanh trực quan từ hệ thống.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            className="rounded-lg border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-800 shadow-none"
          >
            Làm mới
          </Button>
        </motion.div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Tổng lợi nhuận thực tế", value: formatMoney(stats.totalRevenue), icon: <WalletOutlined />, color: "from-emerald-400 to-teal-500", shadow: "shadow-emerald-200" },
          { title: "Dòng tiền dự kiến (Tháng)", value: formatMoney(stats.monthlyExpectedRent), icon: <BankOutlined />, color: "from-blue-400 to-indigo-500", shadow: "shadow-blue-200" },
          { title: "Hợp đồng hoạt động", value: `${stats.activeCount} / ${stats.totalContracts}`, icon: <SafetyCertificateOutlined />, color: "from-orange-400 to-red-400", shadow: "shadow-orange-200" },
          { title: "Giao dịch thành công", value: `${stats.paidCount} / ${stats.paymentCount}`, icon: <LineChartOutlined />, color: "from-purple-400 to-pink-500", shadow: "shadow-purple-200" }
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="rounded-2xl border-0 shadow-sm" styles={{ body: { padding: '24px' } }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] text-slate-500 font-medium mb-1">{item.title}</p>
                  <h3 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">{item.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} ${item.shadow} shadow-lg flex items-center justify-center text-white text-xl`}>
                  {item.icon}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-50 px-2 py-1 w-max rounded-md">
                <ArrowUpOutlined /> <span className="pt-0.5">Tốt</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Monthly Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="col-span-1 lg:col-span-2">
          <Card className="rounded-2xl border-slate-100 shadow-sm h-full" styles={{ body: { padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' } }}>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Biểu đồ doanh thu</h3>
              <p className="text-sm text-slate-400">Theo dõi dòng tiền trong vòng 6 tháng qua</p>
            </div>

            <div className="flex-1 min-h-[250px] relative flex items-end justify-between gap-2 pt-10">
              {/* Grid Lines */}
              <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between pointer-events-none">
                {[4, 3, 2, 1, 0].map(v => (
                  <div key={v} className="border-t border-slate-100 w-full flex-1 flex justify-start -mt-[9px]">
                    <span className="text-[10px] text-slate-300 font-medium bg-white pr-2">
                      {formatMoney((totalChartMax / 4) * v).replace(',00', '').replace('₫', '')}
                    </span>
                  </div>
                ))}
              </div>

              {monthlyRevenue.map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end z-10 group cursor-pointer h-full">
                  <div className="w-full flex justify-center h-[calc(100%-24px)] items-end">
                    <AntTooltip title={formatMoney(val)} color="#3b82f6" overlayInnerStyle={{ fontWeight: 'bold' }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(val / totalChartMax) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 + (idx * 0.1) }}
                        className="w-12 sm:w-16 md:w-20 rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 shadow-md group-hover:from-blue-500 group-hover:to-blue-300 transition-colors relative"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 rounded-t-lg"></div>
                      </motion.div>
                    </AntTooltip>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 mt-2 h-4 block">{monthsLabel[idx]}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Contract Status Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="rounded-2xl border-slate-100 shadow-sm h-full" styles={{ body: { padding: '24px' } }}>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Cơ cấu hợp đồng</h3>
              <p className="text-sm text-slate-400">Phân bố trạng thái hợp đồng</p>
            </div>

            <div className="flex justify-center my-6 relative">
              <Progress
                type="dashboard"
                percent={stats.totalContracts > 0 ? Math.round((stats.activeCount / stats.totalContracts) * 100) : 0}
                size={180}
                strokeWidth={12}
                strokeColor={{
                  '0%': '#10b981',
                  '100%': '#34d399',
                }}
                format={(percent) => (
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-slate-800">{percent}%</span>
                    <span className="text-xs font-medium text-slate-400 uppercase mt-1">Đang hoạt động</span>
                  </div>
                )}
              />
            </div>

            <div className="space-y-4 mt-6">
              {contractStatusCounts.length === 0 ? (
                <Empty description="Chưa có dữ liệu" />
              ) : (
                contractStatusCounts.slice(0, 4).map((status, idx) => {
                  const isAc = status.id === "active";
                  const color = isAc ? "bg-emerald-500" : ["canceled", "terminated"].includes(status.id) ? "bg-red-500" : "bg-blue-500";
                  const textLabel = isAc ? "Đang hiệu lực" : status.id === "draft" ? "Hợp đồng nháp" : status.id === "terminated" ? "Đã chấm dứt" : "Khác";

                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <span className="text-sm font-medium text-slate-700">{textLabel} ({status.id})</span>
                      </div>
                      <span className="font-bold text-slate-800">{status.count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}