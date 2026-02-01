import React from 'react';
import { Home, Bed, Bath, Sofa, Wind } from 'lucide-react';
import { BasePropertyCard } from './BasePropertyCard';
import { type ApartmentProperty, type Property } from '../../types/property-new.type';

interface ApartmentCardProps {
  property: ApartmentProperty;
  onCardClick: (property: Property) => void;
  onApprove?: (propertyId: string) => void;
  onReject?: (propertyId: string) => void;
  onReactivate?: (propertyId: string) => void;
  showActions?: boolean;
  actionType?: 'pending' | 'approved' | 'rejected';
  index?: number;
}

export const ApartmentCard: React.FC<ApartmentCardProps> = (props) => {
  const { property } = props;

  return (
    <BasePropertyCard {...props}>
      <div className="grid grid-cols-3 gap-2 !mb-3 !p-3 bg-slate-50 rounded-lg border border-slate-100">
        <div className="text-center">
          <div className="text-[10px] text-slate-500 !mb-0.5 font-medium">Diện tích</div>
          <div className="text-sm font-bold text-blue-600">{property.areaSqm}m²</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-slate-500 !mb-0.5 font-medium flex items-center justify-center gap-1">
            <Bed size={12} />
            PN
          </div>
          <div className="text-sm font-bold text-blue-600">{property.bedrooms || 0}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-slate-500 !mb-0.5 font-medium flex items-center justify-center gap-1">
            <Bath size={12} />
            WC
          </div>
          <div className="text-sm font-bold text-blue-600">{property.bathrooms || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 !mb-3">
        <div className="!p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 text-center">
          <div className="text-[10px] text-blue-600 !mb-0.5 font-medium flex items-center justify-center gap-1">
            <Sofa size={12} />
            P.Khách
          </div>
          <div className="text-xs font-bold text-blue-700">{property.livingRooms || 0}</div>
        </div>
        <div className="!p-2 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200 text-center">
          <div className="text-[10px] text-emerald-600 !mb-0.5 font-medium flex items-center justify-center gap-1">
            <Wind size={12} />
            Ban công
          </div>
          <div className="text-xs font-bold text-emerald-700">{property.balconies || 0}</div>
        </div>
        <div className="!p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 text-center">
          <div className="text-[10px] text-purple-600 !mb-0.5 font-medium flex items-center justify-center gap-1">
            <Home size={12} />
            Tầng
          </div>
          <div className="text-xs font-bold text-purple-700">
            {property.floorNumber || 0}/{property.totalFloors || 0}
          </div>
        </div>
      </div>
    </BasePropertyCard>
  );
};