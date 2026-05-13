import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { getPropertiesByStatus, updatePropertyVisibilityForAdmin } from '../../stores/slices/property.slice';
import PropertyModerationBoard from '../../components/property/PropertyModerationBoard';

const PropertyApprovedPage: React.FC = () => {
  const { message } = App.useApp();
  const dispatch = useAppDispatch()
  const navigate = useNavigate();
  const { properties = [], loading } = useAppSelector(state => state.property)

  const fetchData = useCallback(() => {
    dispatch(getPropertiesByStatus({
      approvalStatus: 'approved',
      page: 1,
      limit: 100
    }))
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData])

  const handleToggleVisibility = async (propertyId: string, visible: boolean) => {
    try {
      await dispatch(updatePropertyVisibilityForAdmin({ propertyId, visible })).unwrap();
      message.success(visible ? 'Đã hiển thị tin' : 'Đã ẩn tin');
      fetchData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái hiển thị');
    }
  };

  return (
    <PropertyModerationBoard
      title="Bất Động Sản Đã Duyệt"
      status="approved"
      properties={properties}
      loading={loading}
      onRefresh={fetchData}
      onView={(propertyId) => navigate(`/dashboard/properties/${propertyId}`)}
      onToggleVisibility={handleToggleVisibility}
    />
  );
};

export default PropertyApprovedPage;