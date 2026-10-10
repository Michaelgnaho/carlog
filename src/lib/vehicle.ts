export const photoUrl = (path?: string | null) =>
  path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-photos/${path}` : null;

export type Car = {
  id: string;
  name: string;
  plate_number: string;
  photo_path: string | null;
  is_out: boolean;
  movement_id: string | null;
  taken_by_id: string | null;
  taken_by_name: string | null;
  taken_at: string | null;
};
