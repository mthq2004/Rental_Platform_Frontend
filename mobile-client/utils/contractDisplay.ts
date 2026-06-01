/**
 * Hiển thị hợp đồng thuê — dùng chung list / detail / property.
 * Ưu tiên contract.property, sau đó contractData, cuối cùng propertyId.
 */

export type ContractStatusKey = string

export const CONTRACT_STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; iconName?: string }
> = {
  draft: { label: 'Nháp', bg: '#EEF2FF', text: '#4338CA' },
  pending_tenant: { label: 'Chờ người thuê ký', bg: '#FFF7ED', text: '#C2410C' },
  tenant_signed: { label: 'Người thuê đã ký', bg: '#ECFEFF', text: '#0E7490' },
  pending_landlord: { label: 'Chờ chủ nhà ký', bg: '#F5F3FF', text: '#6D28D9' },
  owner_signed: { label: 'Chủ nhà đã ký', bg: '#F0FDF4', text: '#15803D' },
  fully_signed: { label: 'Đã ký hoàn tất', bg: '#E0F2FE', text: '#0369A1' },
  active: { label: 'Đang hiệu lực', bg: '#DCFCE7', text: '#166534' },
  expired: { label: 'Hết hạn', bg: '#F3F4F6', text: '#374151' },
  terminated: { label: 'Đã chấm dứt', bg: '#FEE2E2', text: '#B91C1C' },
  superseded: { label: 'Đã thay thế', bg: '#F1F5F9', text: '#64748B' },
  renewed: { label: 'Đã gia hạn', bg: '#E0E7FF', text: '#3730A3' },
  cancelled: { label: 'Đã hủy', bg: '#F3F4F6', text: '#4B5563' },
}

export type ContractSourceBadge = {
  label: string
  hint: string
  bg: string
  text: string
  border: string
}

export function formatContractMoney(value: unknown): string {
  const parsed = Number(value || 0)
  if (!Number.isFinite(parsed)) return '—'
  return new Intl.NumberFormat('vi-VN').format(parsed)
}

export function formatContractDate(value?: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleDateString('vi-VN')
}

export function getContractData(contract: any): Record<string, unknown> {
  const raw = contract?.contractData
  if (!raw || typeof raw !== 'object') return {}
  return raw as Record<string, unknown>
}

export function getPropertyDisplay(contract: any) {
  const data = getContractData(contract)
  const prop = contract?.property
  const title =
    prop?.title ||
    prop?.name ||
    contract?.propertyName ||
    data['property.name'] ||
    data['property.title'] ||
    (contract?.propertyId ? `BĐS #${String(contract.propertyId).slice(0, 8)}…` : 'Bất động sản')
  const address =
    prop?.address ||
    contract?.propertyAddress ||
    data['property.address'] ||
    [prop?.ward, prop?.district, prop?.city].filter(Boolean).join(', ') ||
    [data['property.ward'], data['property.district'], data['property.city']].filter(Boolean).join(', ') ||
    ''
  const imageUrl =
    prop?.imageUrl ||
    prop?.images?.[0]?.uri ||
    contract?.propertyImageUrl ||
    (typeof data['property.imageUrl'] === 'string' ? data['property.imageUrl'] : undefined)
  const type =
    prop?.propertyType ||
    data['property.type'] ||
    contract?.template?.templateCategory ||
    ''
  return { title: String(title), address: String(address || 'Chưa có địa chỉ'), imageUrl, type: String(type) }
}

export function getTenantDisplay(contract: any): string {
  return (
    contract?.tenant?.name ||
    contract?.tenant?.fullName ||
    getContractData(contract)['tenant.name'] ||
    getContractData(contract)['tenant.fullName'] ||
    contract?.tenantId?.slice?.(0, 8) ||
    '—'
  )
}

export function getOwnerDisplay(contract: any): string {
  return (
    contract?.owner?.name ||
    contract?.owner?.fullName ||
    getContractData(contract)['owner.name'] ||
    getContractData(contract)['owner.fullName'] ||
    '—'
  )
}

export function getTemplateDisplay(contract: any): string {
  return (
    contract?.template?.templateName ||
    contract?.templateName ||
    getContractData(contract)['contract.templateName'] ||
    'Mẫu hợp đồng'
  )
}

export function getContractSource(contract: any): ContractSourceBadge {
  if (contract?.parentContractId) {
    const parentCode = contract?.parentContract?.contractCode
    const ver = contract?.version != null ? `v${contract.version}` : ''
    return {
      label: `Chỉnh sửa ${ver}`.trim(),
      hint: parentCode ? `Bản sửa từ ${parentCode}` : 'Bản chỉnh sửa hợp đồng đang hiệu lực',
      bg: '#FFFBEB',
      text: '#B45309',
      border: '#FDE68A',
    }
  }
  if (contract?.renewedFromContractId || contract?.renewedFrom) {
    const fromCode = contract?.renewedFrom?.contractCode
    return {
      label: 'Gia hạn',
      hint: fromCode ? `Gia hạn từ ${fromCode}` : 'Hợp đồng gia hạn',
      bg: '#EFF6FF',
      text: '#1D4ED8',
      border: '#BFDBFE',
    }
  }
  if (contract?.fromRequestId || contract?.rentalRequest) {
    const code = contract?.rentalRequest?.requestCode || contract?.fromRequestId
    return {
      label: 'Yêu cầu thuê',
      hint: code ? `Từ yêu cầu ${code}` : 'Tạo từ yêu cầu thuê nhà',
      bg: '#EEF2FF',
      text: '#4338CA',
      border: '#C7D2FE',
    }
  }
  return {
    label: 'Hợp đồng gốc',
    hint: contract?.version != null && contract.version > 1 ? `Phiên bản v${contract.version}` : 'Tạo mới trực tiếp',
    bg: '#F8FAFC',
    text: '#475569',
    border: '#E2E8F0',
  }
}

export function getUserRoleOnContract(
  contract: any,
  userId?: string | null
): 'owner' | 'tenant' | null {
  if (!userId) return null
  if (contract?.ownerId === userId) return 'owner'
  if (contract?.tenantId === userId) return 'tenant'
  return null
}

export function getRoleBadge(
  contract: any,
  userId?: string | null
): { label: string; bg: string; text: string } | null {
  const role = getUserRoleOnContract(contract, userId)
  if (role === 'owner') return { label: 'Bạn là chủ nhà', bg: '#DBEAFE', text: '#1D4ED8' }
  if (role === 'tenant') return { label: 'Bạn là người thuê', bg: '#DCFCE7', text: '#166534' }
  return null
}

export function getContractPeriodLabel(contract: any): string {
  return `${formatContractDate(contract?.startDate)} → ${formatContractDate(contract?.endDate)}`
}

export function openContractEditorRoute(contract: any) {
  const tid = contract?.templateId
  if (!tid) return null
  if (contract?.parentContractId) {
    return {
      pathname: '/(rental)/contract-builder' as const,
      params: { templateId: tid, contractId: contract.rentalId },
    }
  }
  const reqId = contract?.fromRequestId || contract?.rentalRequest?.requestId
  if (reqId) {
    return {
      pathname: '/(rental)/contract-builder' as const,
      params: { templateId: tid, requestId: reqId, contractId: contract.rentalId },
    }
  }
  return {
    pathname: '/(rental)/contract-builder' as const,
    params: { templateId: tid, contractId: contract.rentalId },
  }
}
