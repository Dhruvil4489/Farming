import { redirect } from 'next/navigation';

export default async function StoreProductRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/fertilizers/${slug}`);
}
