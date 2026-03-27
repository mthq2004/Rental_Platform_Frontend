import React, { useEffect } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { getPropertiesByStatus, updatePropertyVisibilityForAdmin } from '../../stores/slices/property.slice';
import PropertyModerationBoard from '../../components/property/PropertyModerationBoard';

const PropertyApprovedPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { properties = [], loading } = useAppSelector(state => state.property)
  
  useEffect(() => {
    dispatch(getPropertiesByStatus({
      approvalStatus: 'approved',
      page: 1,
      limit: 100
    }))
  }, [dispatch])

  const handleToggleVisibility = async (propertyId: string, visible: boolean) => {
    try {
      await dispatch(updatePropertyVisibilityForAdmin({ propertyId, visible })).unwrap();
      messageApi.success(visible ? 'Đã hiển thị tin' : 'Đã ẩn tin');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái hiển thị');
    }
  };

  return (
    <>
      {contextHolder}
      <PropertyModerationBoard
        title="Bất Động Sản Đã Duyệt"
        status="approved"
        properties={properties}
        loading={loading}
        onView={(propertyId) => navigate(`/dashboard/properties/${propertyId}`)}
        onToggleVisibility={handleToggleVisibility}
      />
    </>
  );
};

export default PropertyApprovedPage;