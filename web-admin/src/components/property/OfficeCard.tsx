import React from 'react';
import { Building2, Maximize2, Layers, Car, ShieldCheck } from 'lucide-react';
import { BasePropertyCard } from './BasePropertyCard';
import { type Property } from '../../types/property-new.type';

interface OfficeCardProps {
  property: Property;
  onCardClick: (property: Property) => void;
  onApprove?: (propertyId: string) => void;
  onReject?: (propertyId: string) => void;
  onReactivate?: (propertyId: string) => void;
  showActions?: boolean;
  actionType?: 'pending' | 'approved' | 'rejected';
  index?: number;
}

export const OfficeCard: React.FC<OfficeCardProps> = (props) => {
  const { property } = props;

  const {
    areaSqm,
    floorNumber,
    totalFloors,
    parkingFee,
    managementFee,
    hasFireCertificate,
    amenities,
  } = property as any;

  return (
    <BasePropertyCard {...props}>
      <div className="grid grid-cols-3 gap-2 !mb-3 !p-3 bg-slate-50 rounded-lg border border-slate-100">
        <div className="text-center">
          <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
            <Maximize2 size={12} />
            Diện tích
          </div>
          <div className="text-sm font-bold text-blue-600">
            {areaSqm}m²
          </div>
        </div>

        <div className="text-center">
          <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
            <Layers size={12} />
            Tầng
          </div>
          <div className="text-sm font-bold text-blue-600">
            {floorNumber ?? '—'} / {totalFloors ?? '—'}
          </div>
        </div>

        <div className="text-center">
          <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
            <Building2 size={12} />
            Loại
          </div>
          <div className="text-sm font-bold text-blue-600">
            Văn phòng
          </div>
        </div>
      </div>

      {(parkingFee || managementFee) && (
        <div className="grid grid-cols-2 gap-2 !mb-3">
          {managementFee && (
            <div className="!p-2 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="text-[10px] text-indigo-600 font-medium">
                Phí quản lý
              </div>
              <div className="text-xs font-bold text-indigo-700">
                {managementFee} đ
              </div>
            </div>
          )}

          {parkingFee && (
            <div className="!p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                <Car size={12} />
                Phí đậu xe
              </div>
              <div className="text-xs font-bold text-blue-700">
                {parkingFee} đ
              </div>
            </div>
          )}
        </div>
      )}

      {(amenities?.length || hasFireCertificate) && (
        <div className="!p-2 !mb-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 font-medium !mb-1.5">
            Tiện ích
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hasFireCertificate && (
              <div className="!px-2 !py-0.5 bg-red-100 rounded-md text-red-700 text-[10px] font-semibold flex items-center gap-1">
                <ShieldCheck size={10} />
                PCCC
              </div>
            )}

            {amenities?.slice(0, 3).map((a: any) => (
              <div
                key={a.id}
                className="!px-2 !py-0.5 bg-emerald-100 rounded-md text-emerald-700 text-[10px] font-semibold"
              >
                {a.name}
              </div>
            ))}

            {amenities && amenities.length > 3 && (
              <div className="text-[10px] text-slate-500">
                +{amenities.length - 3} tiện ích
              </div>
            )}
          </div>
        </div>
      )}
    </BasePropertyCard>
  );
};
