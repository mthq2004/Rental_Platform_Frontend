import React from 'react';
import { Bed, Bath, Car, TreePine, Layers } from 'lucide-react';
import { BasePropertyCard } from './BasePropertyCard';
import { type Property } from '../../types/property-new.type';

interface HouseCardProps {
  property: Property;
  onCardClick: (property: Property) => void;
  onApprove?: (propertyId: string) => void;
  onReject?: (propertyId: string) => void;
  onReactivate?: (propertyId: string) => void;
  showActions?: boolean;
  actionType?: 'pending' | 'approved' | 'rejected';
  index?: number;
}

export const HouseCard: React.FC<HouseCardProps> = (props) => {
  const { property } = props;

  const {
    areaSqm,
    bedrooms = 0,
    bathrooms = 0,
    totalFloors = 0,
    gardenAreaSqm,
    parkingSpaces = 0,
    frontWidth,
    length,
  } = property as any;

  return (
    <BasePropertyCard {...props}>
      <div className="grid grid-cols-3 gap-2 !mb-3 !p-3 bg-slate-50 rounded-lg border border-slate-100">
        <div className="text-center">
          <div className="text-[10px] text-slate-500 font-medium">Diện tích</div>
          <div className="text-sm font-bold text-blue-600">
            {areaSqm}m²
          </div>
        </div>

        <div className="text-center">
          <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
            <Bed size={12} />
            Phòng ngủ
          </div>
          <div className="text-sm font-bold text-blue-600">
            {bedrooms}
          </div>
        </div>

        <div className="text-center">
          <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
            <Bath size={12} />
            P. Tắm
          </div>
          <div className="text-sm font-bold text-blue-600">
            {bathrooms}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 !mb-3">
        <div className="!p-2 bg-orange-50 rounded-lg border border-orange-200 text-center">
          <div className="text-[10px] text-orange-600 font-medium flex items-center justify-center gap-1">
            <Layers size={12} />
            Số tầng
          </div>
          <div className="text-xs font-bold text-orange-700">
            {totalFloors}
          </div>
        </div>

        <div className="!p-2 bg-green-50 rounded-lg border border-green-200 text-center">
          <div className="text-[10px] text-green-600 font-medium flex items-center justify-center gap-1">
            <TreePine size={12} />
            Sân vườn
          </div>
          <div className="text-xs font-bold text-green-700">
            {gardenAreaSqm ? `${gardenAreaSqm}m²` : 'Không'}
          </div>
        </div>

        <div className="!p-2 bg-blue-50 rounded-lg border border-blue-200 text-center">
          <div className="text-[10px] text-blue-600 font-medium flex items-center justify-center gap-1">
            <Car size={12} />
            Chỗ xe
          </div>
          <div className="text-xs font-bold text-blue-700">
            {parkingSpaces}
          </div>
        </div>
      </div>

      {(frontWidth || length) && (
        <div className="!p-2 !mb-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 font-medium !mb-1">
            Kích thước
          </div>
          <div className="text-xs font-semibold text-slate-700">
            {frontWidth && `Mặt tiền: ${frontWidth}m`}
            {frontWidth && length && ' • '}
            {length && `Chiều dài: ${length}m`}
          </div>
        </div>
      )}
    </BasePropertyCard>
  );
};
