import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { approveProperty, batchApproveProperties, getPropertiesByStatus } from '../../stores/slices/property.slice';
import PropertyModerationBoard from '../../components/property/PropertyModerationBoard';

const PropertyPendingPage: React.FC = () => {
    const { message } = App.useApp();
    const dispatch = useAppDispatch()
    const navigate = useNavigate();
    const { properties = [], loading } = useAppSelector(state => state.property)

    const fetchData = useCallback(() => {
        dispatch(getPropertiesByStatus({
            approvalStatus: 'pending',
            page: 1,
            limit: 100
        }))
    }, [dispatch]);

    useEffect(() => {
        fetchData();
    }, [fetchData])

    const handleApprove = (propertyId: string) => {
        dispatch(approveProperty({ propertyId, data: { approve: true } })).then(() => {
            message.success('Đã duyệt bất động sản');
            fetchData();
        });
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
        ).then(() => {
            message.success('Đã từ chối bất động sản');
            fetchData();
        });
    };

    const handleBatchApprove = async (ids: string[]) => {
        dispatch(batchApproveProperties({ propertyIds: ids, data: { approve: true } })).then(() => {
            message.success(`Đã duyệt ${ids.length} bất động sản`);
            fetchData();
        }).catch(() => {
            message.error(`Lỗi khi duyệt hàng loạt`);
        });
    };

    const handleBatchReject = async (ids: string[], reason: string) => {
        dispatch(batchApproveProperties({ propertyIds: ids, data: { approve: false, reason } })).then(() => {
            message.success(`Đã từ chối ${ids.length} bất động sản`);
            fetchData();
        }).catch(() => {
            message.error(`Lỗi khi từ chối hàng loạt`);
        });
    };

    return (
        <PropertyModerationBoard
            title="Quản Lý Bất Động Sản Chờ Duyệt"
            status="pending"
            properties={properties}
            loading={loading}
            onRefresh={fetchData}
            onView={(propertyId) => navigate(`/dashboard/properties/${propertyId}`)}
            onApprove={handleApprove}
            onReject={handleReject}
            onBatchApprove={handleBatchApprove}
            onBatchReject={handleBatchReject}
        />
    );
};

export default PropertyPendingPage;
