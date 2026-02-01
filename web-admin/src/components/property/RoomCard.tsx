import React from 'react';
import { Bath, ChefHat, Sofa } from 'lucide-react';
import { BasePropertyCard } from './BasePropertyCard';
import { type RoomProperty, type Property } from '../../types/property-new.type';

interface RoomCardProps {
  property: RoomProperty;
  onCardClick: (property: Property) => void;
  onApprove?: (propertyId: string) => void;
  onReject?: (propertyId: string) => void;
  onReactivate?: (propertyId: string) => void;
  showActions?: boolean;
  actionType?: 'pending' | 'approved' | 'rejected';
  index?: number;
}

export const RoomCard: React.FC<RoomCardProps> = (props) => {
  const { property } = props;

  return (
    <BasePropertyCard {...props}>
      <div className="grid grid-cols-3 gap-2 !mb-3 !p-3 bg-slate-50 rounded-lg border border-slate-100">
        <div className="text-center">
          <div className="text-[10px] text-slate-500 !mb-0.5 font-medium">
            Diện tích
          </div>
          <div className="text-sm font-bold text-blue-600">
            {property.areaSqm}m²
          </div>
        </div>

        <div className="text-center">
          <div className="text-[10px] text-slate-500 !mb-0.5 font-medium flex items-center justify-center gap-1">
            <Bath size={12} />
            WC
          </div>
          <div className="text-sm font-bold text-blue-600">
            {property.bathrooms || 0}
          </div>
        </div>

        <div className="text-center">
          <div className="text-[10px] text-slate-500 !mb-0.5 font-medium flex items-center justify-center gap-1">
            <ChefHat size={12} />
            Bếp
          </div>
          <div className="text-sm font-bold text-blue-600">
            {property.kitchens || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 !mb-3">
        <div className="!p-2 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200 text-center">
          <div className="text-[10px] text-emerald-600 !mb-0.5 font-medium flex items-center justify-center gap-1">
            <Sofa size={12} />
            Nội thất
          </div>
          <div className="text-xs font-bold text-emerald-700 capitalize">
            {property.furnitureStatus || 'Không rõ'}
          </div>
        </div>
      </div>
    </BasePropertyCard>
  );
};
