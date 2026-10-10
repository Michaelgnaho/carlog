import { createBrowserSupabase } from '@/lib/supabase/browser';

const MAX_SIDE = 1200;

/** Shrinks a phone photo (often 5 MB or more) to a small JPEG before it is uploaded. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('shrink failed'))), 'image/jpeg', 0.82)
  );
}

/** Uploads a car photo and returns its storage path. */
export async function uploadVehiclePhoto(vehicleId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose a photo (a picture file).');
  let blob: Blob;
  try {
    blob = await shrink(file);
  } catch {
    throw new Error('That picture could not be opened. Try a different photo.');
  }
  const path = `${vehicleId}/${Date.now()}.jpg`;
  const { error } = await createBrowserSupabase().storage.from('vehicle-photos').upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw new Error('The photo could not be uploaded. Check your internet and try again.');
  return path;
}
