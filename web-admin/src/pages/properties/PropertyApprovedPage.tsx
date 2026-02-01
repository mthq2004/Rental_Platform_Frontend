import React, { useState, useMemo, useEffect } from 'react';
import type { PropertyTypeFilter, SortOption } from '../../types/property.type';
import { PageHeader } from '../../components/property/PageHeader';
import { FilterBar } from '../../components/property/FilterBar';
import { EmptyState } from '../../components/property/EmptyState';
import { PropertyDetailModal } from '../../components/property/PropertyDetailModal';
import type { Property } from '../../types/property-new.type';
import PropertyCardFactory from '../../components/property/PropertyCardFactory';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { getPropertiesByStatus } from '../../stores/slices/property.slice';

const PropertyApprovedPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<PropertyTypeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const dispatch = useAppDispatch()
    const { properties = [], loading } = useAppSelector(state => state.property)
  
    useEffect(() => {
      dispatch(getPropertiesByStatus({
        approvalStatus: 'approved',
        page: 1,
        limit: 100
      }))
    }, [dispatch])

  const filteredProperties = useMemo(() => {
    let filtered = properties.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || p.propertyType === selectedType;
      return matchesSearch && matchesType;
    });

    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => b.pricePerMonth - a.pricePerMonth);
    } else if (sortBy === 'price_low') {
      filtered.sort((a, b) => a.pricePerMonth - b.pricePerMonth);
    }

    return filtered;
  }, [properties, searchTerm, selectedType, sortBy]);

  if(loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-white font-['Outfit'] text-slate-800">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <PageHeader
        title="Bất Động Sản Đã Duyệt"
        subtitle={`Tổng ${filteredProperties.length} bất động sản đã được phê duyệt`}
      />

      <div>
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
              actionType="approved"
              onCardClick={setSelectedProperty}
            />
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <EmptyState
            title="Không có bất động sản đã duyệt"
            message="Chưa có bất động sản nào được phê duyệt"
          />
        )}
      </div>

      <PropertyDetailModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        actionType="approved"
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.6s ease-out both;
        }

        select option {
          background: #ffffff;
          color: #1e293b;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default PropertyApprovedPage;