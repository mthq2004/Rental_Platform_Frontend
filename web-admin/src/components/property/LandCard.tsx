import React from 'react';
import { Maximize2, Ruler, MapPin } from 'lucide-react';
import { BasePropertyCard } from './BasePropertyCard';
import { type Property } from '../../types/property-new.type';

interface LandCardProps {
  property: Property;
  onCardClick: (property: Property) => void;
  onApprove?: (propertyId: string) => void;
  onReject?: (propertyId: string) => void;
  onReactivate?: (propertyId: string) => void;
  showActions?: boolean;
  actionType?: 'pending' | 'approved' | 'rejected';
  index?: number;
}

export const LandCard: React.FC<LandCardProps> = (props) => {
  const { property } = props;

  const {
    areaSqm,
    frontWidth,
    length,
    roadWidth,
    isCornerLot,
    direction,
    legalStatus,
  } = property as any;

  return (
    <BasePropertyCard {...props}>
      <div className="grid grid-cols-2 gap-2 !mb-3 !p-3 bg-slate-50 rounded-lg border border-slate-100">
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
            <Ruler size={12} />
            Mặt tiền
          </div>
          <div className="text-sm font-bold text-blue-600">
            {frontWidth ? `${frontWidth}m` : '—'}
          </div>
        </div>
      </div>

      {(length || roadWidth) && (
        <div className="grid grid-cols-2 gap-2 !mb-3">
          {length && (
            <div className="!p-2 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-[10px] text-amber-600 font-medium">
                Chiều dài
              </div>
              <div className="text-xs font-bold text-amber-700">
                {length}m
              </div>
            </div>
          )}

          {roadWidth && (
            <div className="!p-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-[10px] text-emerald-600 font-medium">
                Đường trước đất
              </div>
              <div className="text-xs font-bold text-emerald-700">
                {roadWidth}m
              </div>
            </div>
          )}
        </div>
      )}

      {(direction || legalStatus) && (
        <div className="grid grid-cols-2 gap-2 !mb-3">
          {direction && (
            <div className="!p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                <MapPin size={12} />
                Hướng
              </div>
              <div className="text-xs font-bold text-blue-700">
                {direction}
              </div>
            </div>
          )}

          {legalStatus && (
            <div className="!p-2 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-[10px] text-purple-600 font-medium">
                Pháp lý
              </div>
              <div className="text-xs font-bold text-purple-700">
                {legalStatus}
              </div>
            </div>
          )}
        </div>
      )}

      {isCornerLot && (
        <div className="!p-2 !mb-3 bg-red-50 rounded-lg border border-red-200 text-center">
          <span className="text-red-600 font-semibold text-xs">
            Đất góc (2 mặt tiền)
          </span>
        </div>
      )}
    </BasePropertyCard>
  );
};
