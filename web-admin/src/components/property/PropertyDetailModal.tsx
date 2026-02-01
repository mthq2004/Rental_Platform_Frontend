import React from 'react';
import { Home, MapPin, DollarSign, User, CheckCircle, XCircle } from 'lucide-react';
import { type Property } from '../../types/property-new.type';
import { propertyTypeLabels, formatCurrency } from '../../utils/property.utils';

interface PropertyDetailModalProps {
  property: Property | null;
  onClose: () => void;
  onApprove?: (propertyId: string) => void;
  onReject?: (propertyId: string) => void;
  onReactivate?: (propertyId: string) => void;
  actionType?: 'pending' | 'approved' | 'rejected';
}

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value }) => (
  <div className="bg-slate-50 rounded-lg !p-4 border border-slate-200 transition-all hover:bg-blue-50 hover:border-blue-200">
    <div className="text-blue-600 !mb-2">
      {icon}
    </div>
    <div className="text-[10px] text-slate-500 !mb-1 font-medium">
      {label}
    </div>
    <div className="text-sm font-semibold text-slate-800">
      {value}
    </div>
  </div>
);

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  onClose,
  onApprove,
  onReject,
  onReactivate,
  actionType = 'pending'
}) => {
  if (!property) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] !p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-[900px] w-full max-h-[90vh] overflow-auto animate-slideUp shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/98 backdrop-blur-sm !px-6 !py-4 border-b border-slate-200 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-slate-800 !m-0">
            Chi tiết bất động sản
          </h2>
          <button
            onClick={onClose}
            className="bg-slate-100 border border-slate-200 rounded-lg w-9 h-9 flex items-center justify-center cursor-pointer transition-all text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          >
            ✕
          </button>
        </div>

        <div className="!p-6">
          <div className="bg-slate-100 rounded-xl h-80 !mb-6 overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${property.images[0]})` }}
            />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 !mb-4 leading-tight">
            {property.title}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 !mb-6">
            <InfoCard
              icon={<Home size={20} />}
              label="Loại hình"
              value={propertyTypeLabels[property.propertyType]}
            />
            <InfoCard
              icon={<MapPin size={20} />}
              label="Diện tích"
              value={`${property.areaSqm}m²`}
            />
            <InfoCard
              icon={<DollarSign size={20} />}
              label="Giá thuê"
              value={formatCurrency(property.pricePerMonth)}
            />
            <InfoCard
              icon={<User size={20} />}
              label="Chủ nhà"
              value={property.landlord.fullName}
            />
          </div>

          {property.description && (
            <div className="bg-slate-50 rounded-xl !p-4 !mb-4 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 !mb-3">
                Mô tả
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {property.description}
              </p>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl !p-4 !mb-4 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 !mb-3">
              Địa chỉ
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              {property.address}, {property.ward}, {property.district}, {property.city}
            </p>
          </div>

          {actionType === 'rejected' && property.rejectionReason && (
            <div className="bg-red-50 rounded-xl !p-4 !mb-4 border border-red-200">
              <h3 className="text-lg font-semibold text-red-800 !mb-3">
                Lý do từ chối
              </h3>
              <p className="text-red-700 leading-relaxed text-sm">
                {property.rejectionReason}
              </p>
            </div>
          )}

          {actionType === 'pending' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onApprove?.(property.propertyId)}
                className="!py-3 !px-4 bg-emerald-500 border-0 rounded-xl text-white text-base font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-emerald-600 hover:shadow-lg"
              >
                <CheckCircle size={20} />
                Phê duyệt
              </button>
              <button
                onClick={() => onReject?.(property.propertyId)}
                className="!py-3 !px-4 bg-red-500 border-0 rounded-xl text-white text-base font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-red-600 hover:shadow-lg"
              >
                <XCircle size={20} />
                Từ chối
              </button>
            </div>
          )}

          {actionType === 'rejected' && (
            <button
              onClick={() => onReactivate?.(property.propertyId)}
              className="w-full !py-3 !px-4 bg-blue-500 border-0 rounded-xl text-white text-base font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-blue-600 hover:shadow-lg"
            >
              <CheckCircle size={20} />
              Gửi lại phê duyệt
            </button>
          )}
        </div>
      </div>
    </div>
  );
};