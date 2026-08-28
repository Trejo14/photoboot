import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { env } from "@/lib/env";
import { PhotoViewer } from "@/components/photo-viewer";
import type { PhotoSummary } from "@photobooth/types";

interface Props {
  params: Promise<{ photoId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { photoId } = await params;
  return { title: `Foto ${photoId}` };
}

export default async function ShortPhotoPage({ params }: Props) {
  const { photoId } = await params;

  let photo: PhotoSummary | null = null;
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/photos/${photoId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { photo: PhotoSummary };
      photo = data.photo;
    }
  } catch {
    photo = null;
  }

  if (!photo) {
    notFound();
  }

  return <PhotoViewer photo={photo} />;
}
