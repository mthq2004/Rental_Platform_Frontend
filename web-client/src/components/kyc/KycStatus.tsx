import { Tag } from "antd";

export default function KycStatus({ status }: { status: string }) {
  if (status === "APPROVED") return <Tag color="green">Đã xác thực</Tag>;
  if (status === "REJECTED") return <Tag color="red">Bị từ chối</Tag>;
  return <Tag color="orange">Đang duyệt</Tag>;
}