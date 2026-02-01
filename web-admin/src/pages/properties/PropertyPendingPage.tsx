import React, { useState, useMemo, useEffect } from 'react';
import type { PropertyTypeFilter, SortOption } from '../../types/property.type';
import { PageHeader } from '../../components/property/PageHeader';
import { FilterBar } from '../../components/property/FilterBar';
import PropertyCardFactory from '../../components/property/PropertyCardFactory';
import { EmptyState } from '../../components/property/EmptyState';
import { PropertyDetailModal } from '../../components/property/PropertyDetailModal';
import type { Property } from '../../types/property-new.type';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { approveProperty, getPropertiesByStatus } from '../../stores/slices/property.slice';

const PropertyPendingPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<PropertyTypeFilter>('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [rejectingProperty, setRejectingProperty] = useState<Property | null>(null);
    const [rejectReason, setRejectReason] = useState('');


    const dispatch = useAppDispatch()
    const { properties = [], loading } = useAppSelector(state => state.property)

    useEffect(() => {
        dispatch(getPropertiesByStatus({
            approvalStatus: 'pending',
            page: 1,
            limit: 100
        }))
    }, [dispatch])

    const filteredProperties = useMemo(() => {
        let filtered = properties.filter(p => {
            const matchesSearch =
                p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.address.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType =
                selectedType === 'all' || p.propertyType === selectedType;

            return matchesSearch && matchesType;
        });

        switch (sortBy) {
            case 'newest':
                return filtered.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
            case 'oldest':
                return filtered.sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
            case 'price_high':
                return filtered.sort((a, b) => b.pricePerMonth - a.pricePerMonth);
            case 'price_low':
                return filtered.sort((a, b) => a.pricePerMonth - b.pricePerMonth);
            default:
                return filtered;
        }
    }, [properties, searchTerm, selectedType, sortBy]);

    if (loading) {
        return <div>Loading...</div>
    }

    const handleApprove = (propertyId: string) => {
        dispatch(approveProperty({ propertyId, data: { approve: true } }))
    };

    const handleReject = (propertyId: string) => {
        const property = properties.find(p => p.propertyId === propertyId);
        if (property) {
            setRejectingProperty(property);
            setRejectReason('');
        }
    };


    const handleConfirmReject = () => {
        if (!rejectingProperty || !rejectReason.trim()) return;

        dispatch(
            approveProperty({
                propertyId: rejectingProperty.propertyId,
                data: {
                    approve: false,
                    rejectionReason: rejectReason,
                },
            })
        );

        setRejectingProperty(null);
        setRejectReason('');
    };


    return (
        <div className="min-h-screen bg-white font-['Outfit'] text-slate-800">
            <PageHeader
                title="Quản Lý Bất Động Sản Chờ Duyệt"
                subtitle={`Tổng ${filteredProperties.length} bất động sản đang chờ phê duyệt`}
            />

            <FilterBar
                searchTerm={searchTerm}
                selectedType={selectedType}
                sortBy={sortBy}
                onSearchChange={setSearchTerm}
                onTypeChange={setSelectedType}
                onSortChange={setSortBy}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProperties.map((property, index) => (
                    <PropertyCardFactory
                        key={property.propertyId}
                        property={property}
                        index={index}
                        showActions
                        actionType="pending"
                        onCardClick={setSelectedProperty}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                ))}
            </div>

            {filteredProperties.length === 0 && <EmptyState />}

            <PropertyDetailModal
                property={selectedProperty}
                onClose={() => setSelectedProperty(null)}
                onApprove={handleApprove}
                onReject={handleReject}
                actionType="pending"
            />

            {rejectingProperty && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl w-full max-w-md !p-6">
                        <h2 className="text-lg font-semibold mb-2">
                            Từ chối bất động sản
                        </h2>

                        <p className="text-sm text-gray-600 !mb-3">
                            Vui lòng nhập lý do từ chối để gửi cho chủ nhà
                        </p>

                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Nhập lý do từ chối..."
                            className="w-full border rounded-lg !p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                            rows={4}
                        />

                        <div className="flex justify-end gap-2 !mt-4">
                            <button
                                onClick={() => setRejectingProperty(null)}
                                className="!px-4 !py-2 rounded-lg border"
                            >
                                Hủy
                            </button>

                            <button
                                disabled={!rejectReason.trim()}
                                onClick={handleConfirmReject}
                                className="!px-4 !py-2 rounded-lg bg-red-500 text-white disabled:opacity-50"
                            >
                                Từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PropertyPendingPage;
