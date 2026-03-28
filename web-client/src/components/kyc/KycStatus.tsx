import { Tag } from "antd";

export default function KycStatus({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "verified") return <Tag color="green">Đã xác thực</Tag>;
  if (normalizedStatus === "rejected") return <Tag color="red">Bị từ chối</Tag>;
  if (normalizedStatus === "in_review") return <Tag color="gold">Đang thẩm định</Tag>;
  if (normalizedStatus === "expired") return <Tag color="default">Hết hạn</Tag>;
  return <Tag color="default">Chờ xác thực</Tag>;
}