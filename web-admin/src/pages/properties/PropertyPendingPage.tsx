import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { approveProperty, getPropertiesByStatus } from '../../stores/slices/property.slice';
import PropertyModerationBoard from '../../components/property/PropertyModerationBoard';

const PropertyPendingPage: React.FC = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate();
    const { properties = [], loading } = useAppSelector(state => state.property)

    useEffect(() => {
        dispatch(getPropertiesByStatus({
            approvalStatus: 'pending',
            page: 1,
            limit: 100
        }))
    }, [dispatch])

    const handleApprove = (propertyId: string) => {
        dispatch(approveProperty({ propertyId, data: { approve: true } }))
    };

    const handleReject = (propertyId: string, reason: string) => {
        dispatch(
            approveProperty({
                propertyId,
                data: {
                    approve: false,
                    reason,
                },
            })
        );
    };


    return (
        <PropertyModerationBoard
            title="Quản Lý Bất Động Sản Chờ Duyệt"
            status="pending"
            properties={properties}
            loading={loading}
            onView={(propertyId) => navigate(`/dashboard/properties/${propertyId}`)}
            onApprove={handleApprove}
            onReject={handleReject}
        />
    );
};

export default PropertyPendingPage;
