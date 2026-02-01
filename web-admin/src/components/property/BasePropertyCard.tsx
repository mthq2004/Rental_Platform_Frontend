import React from 'react';
import { MapPin, Eye, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { type Property } from '../../types/property-new.type';
import { propertyTypeLabels, formatCurrency, formatDate, getTimeAgo } from '../../utils/property.utils';

interface BasePropertyCardProps {
  property: Property;
  onCardClick: (property: Property) => void;
  onApprove?: (propertyId: string) => void;
  onReject?: (propertyId: string) => void;
  onReactivate?: (propertyId: string) => void;
  showActions?: boolean;
  actionType?: 'pending' | 'approved' | 'rejected';
  index?: number;
  children?: React.ReactNode;
}

export const BasePropertyCard: React.FC<BasePropertyCardProps> = ({
  property,
  onCardClick,
  onApprove,
  onReject,
  onReactivate,
  showActions = true,
  actionType = 'pending',
  index = 0,
  children
}) => {
  return (
    <div
      className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-blue-300 animate-slideUp"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => onCardClick(property)}
    >
      <div className="relative h-48 bg-slate-100 overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-500 hover:scale-105"
          style={{ backgroundImage: `url(${property.images[0]})` }}
        />

        <div className="absolute top-3 left-3 !px-3 !py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-semibold text-blue-600 border border-blue-200 shadow-sm">
          {propertyTypeLabels[property.propertyType]}
        </div>

        <div className="absolute top-3 right-3 !px-3 !py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-medium text-slate-600 flex items-center gap-1.5 shadow-sm">
          <Clock size={12} />
          {getTimeAgo(property.createdAt)}
        </div>

        {actionType === 'rejected' && property.rejectionReason && (
          <div className="absolute bottom-3 left-3 right-3 !px-3 !py-2 bg-red-500/95 backdrop-blur-sm rounded-lg text-xs font-medium text-white shadow-sm">
            <div className="font-semibold !mb-1">Lý do từ chối:</div>
            <div className="line-clamp-2">{property.rejectionReason}</div>
          </div>
        )}
      </div>

      <div className="!p-4">
        <h3 className="text-lg font-semibold text-slate-800 !mb-2 line-clamp-2 leading-snug">
          {property.title}
        </h3>

        <div className="flex items-start gap-2 !mb-3 text-slate-500 text-xs">
          <MapPin size={14} className="mt-0.5 flex-shrink-0" />
          <span className="leading-relaxed line-clamp-2">
            {property.address}, {property.ward}, {property.district}, {property.city}
          </span>
        </div>
        {children}
        <div className="flex items-center justify-between !mb-3 !p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div>
            <div className="text-[10px] text-slate-500 !mb-0.5">Giá thuê/tháng</div>
            <div className="text-lg font-bold text-blue-600 tracking-tight">
              {formatCurrency(property.pricePerMonth)}
            </div>
          </div>
          {property.furnitureStatus && (
            <div className="!px-2 !py-1 bg-blue-100 rounded-md text-[10px] font-semibold text-blue-600">
              {property.furnitureStatus}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 !mb-3 !p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-sm text-white">
            {property.landlord.fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 truncate">
              {property.landlord.fullName}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {property.landlord.phone}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 !mb-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Eye size={14} />
            {property.viewCount || 0}
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            {formatDate(property.createdAt)}
          </div>
        </div>

        {showActions && (
          <div>
            {actionType === 'pending' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove?.(property.propertyId);
                  }}
                  className="!py-2 !px-3 bg-emerald-500 border-0 rounded-lg text-white text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:bg-emerald-600 hover:shadow-md"
                >
                  <CheckCircle size={16} />
                  Phê duyệt
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject?.(property.propertyId);
                  }}
                  className="!py-2 !px-3 bg-red-500 border-0 rounded-lg text-white text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:bg-red-600 hover:shadow-md"
                >
                  <XCircle size={16} />
                  Từ chối
                </button>
              </div>
            )}

            {actionType === 'approved' && property.approvedAt && (
              <div className="!p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="text-[10px] text-emerald-600 font-medium !mb-1">
                  Đã duyệt bởi: {property.approvedBy || 'Admin'}
                </div>
                <div className="text-xs text-emerald-700 font-semibold">
                  {formatDate(property.approvedAt.toString())}
                </div>
              </div>
            )}

            {actionType === 'rejected' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReactivate?.(property.propertyId);
                }}
                className="w-full !py-2 !px-3 bg-blue-500 border-0 rounded-lg text-white text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:bg-blue-600 hover:shadow-md"
              >
                <CheckCircle size={16} />
                Gửi lại phê duyệt
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};