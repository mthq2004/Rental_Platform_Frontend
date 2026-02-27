import PropertyDetailPage from "@/components/property-detail/PropertyDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <PropertyDetailPage propertyId={id} />;
}
