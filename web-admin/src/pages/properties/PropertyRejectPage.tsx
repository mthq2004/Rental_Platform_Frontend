import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { getPropertiesByStatus } from '../../stores/slices/property.slice';
import PropertyModerationBoard from '../../components/property/PropertyModerationBoard';

const PropertyRejectedPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate();
  const { properties = [], loading } = useAppSelector(state => state.property)

  const fetchData = useCallback(() => {
    dispatch(getPropertiesByStatus({
      approvalStatus: 'rejected',
      page: 1,
      limit: 100
    }))
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData])

  return (
    <PropertyModerationBoard
      title="Bất Động Sản Bị Từ Chối"
      status="rejected"
      properties={properties}
      loading={loading}
      onRefresh={fetchData}
      onView={(propertyId) => navigate(`/dashboard/properties/${propertyId}`)}
    />
  );
};

export default PropertyRejectedPage;