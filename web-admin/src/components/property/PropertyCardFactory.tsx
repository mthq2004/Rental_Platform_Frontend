import React from 'react';
import { type Property } from '../../types/property-new.type';
import { ApartmentCard } from './ApartmentCard';
import { HouseCard } from './HouseCard';
import { LandCard } from './LandCard';
import { OfficeCard } from './OfficeCard';
import { RoomCard } from './RoomCard';

interface PropertyCardFactoryProps {
  property: Property;
  onCardClick: (property: Property) => void;
  onApprove?: (propertyId: string) => void;
  onReject?: (propertyId: string) => void;
  onReactivate?: (propertyId: string) => void;
  showActions?: boolean;
  actionType?: 'pending' | 'approved' | 'rejected';
  index?: number;
}

export const PropertyCardFactory: React.FC<PropertyCardFactoryProps> = (props) => {
  const { property } = props;

  switch (property.propertyType) {
    case 'apartment':
      return <ApartmentCard {...props} property={property} />;

    case 'house':
      return <HouseCard {...props} property={property} />;

    case 'land':
      return <LandCard {...props} property={property} />;

    case 'office':
      return <OfficeCard {...props} property={property} />;
    case 'room':
      return <RoomCard {...props} property={property} />;
  }
};

export default PropertyCardFactory;