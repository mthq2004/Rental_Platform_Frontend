import PropertyDetailPage from "@/components/property-detail/PropertyDetailPage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <PropertyDetailPage slug={slug} />;
}
