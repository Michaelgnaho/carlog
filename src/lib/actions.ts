'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fmtDateTime } from '@/lib/dates';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const go = (path: string, key: 'ok' | 'error', msg: string): never => redirect(`${path}?${key}=${encodeURIComponent(msg)}`);
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// Messages we wrote in the database are safe to show. Anything else becomes a plain sentence.
function friendly(error: { code?: string; message: string }, duplicate = 'That already exists.') {
  if (error.code === 'P0001') return error.message;
  if (error.code === '23505') return duplicate;
  return 'Something went wrong. Please try again.';
}

/* ---------------- Sign in / sign up / sign out ---------------- */

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: str(formData, 'email'), password: String(formData.get('password') ?? '') });
  if (error) go('/login', 'error', 'Wrong email or password. Please try again.');
  redirect('/');
}

export async function signUp(formData: FormData) {
  const full_name = str(formData, 'full_name');
  const phone = str(formData, 'phone').replace(/[^\d+]/g, '');
  const email = str(formData, 'email');
  const password = String(formData.get('password') ?? '');
  if (!full_name) go('/signup', 'error', 'Please enter your full name.');
  if (phone.length < 7) go('/signup', 'error', 'Please enter your phone number.');
  if (password.length < 8) go('/signup', 'error', 'Use a password with at least 8 characters.');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name, phone } } });
  if (error) {
    const taken = /already|registered/i.test(error.message);
    go('/signup', 'error', taken ? 'That email already has an account. Try signing in.' : 'We could not create the account. Check the details and try again.');
  }
  // With "Confirm email" switched off (as the README says) the person is signed in straight away
  // and sees the "waiting for approval" screen.
  if (data?.session) redirect('/');
  redirect('/signup?sent=1');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/* ---------------- Take and return ---------------- */

export async function takeVehicle(formData: FormData) {
  const vehicle = str(formData, 'vehicle_id');
  if (!vehicle) go('/take', 'error', 'Please tap the vehicle you are taking.');

  const supabase = await createClient();
  // Drivers are always recorded as themselves. Only the administrator can choose a name.
  const { data, error } = await supabase.rpc('take_vehicle', { p_vehicle: vehicle, p_driver: str(formData, 'driver_id') || null });
  if (error) go('/take', 'error', friendly(error, 'This vehicle is already out.'));

  const row = Array.isArray(data) ? data[0] : null;
  revalidatePath('/', 'layout');
  go('/', 'ok', row ? `Done. ${row.out_vehicle} taken by ${row.out_person} at ${fmtDateTime(row.out_at)}.` : 'Done. Vehicle recorded as out.');
}

export async function returnVehicle(formData: FormData) {
  const movement = str(formData, 'movement_id');
  if (!movement) go('/return', 'error', 'Please tap the vehicle that came back.');

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('return_vehicle', { p_movement: movement, p_returned_by: str(formData, 'returned_by') || null });
  if (error) go('/return', 'error', friendly(error, 'This vehicle has already been returned.'));

  const row = Array.isArray(data) ? data[0] : null;
  revalidatePath('/', 'layout');
  go('/', 'ok', row ? `Done. ${row.out_vehicle} returned by ${row.out_person} at ${fmtDateTime(row.out_at)}.` : 'Done. Vehicle recorded as returned.');
}

/* ---------------- Vehicles (administrator) ---------------- */

export async function addVehicle(formData: FormData) {
  const name = str(formData, 'name');
  const plate = str(formData, 'plate_number').toUpperCase();
  const id = str(formData, 'id');
  const photo = str(formData, 'photo_path');
  if (!name || !plate) go('/manage', 'error', 'Enter the vehicle name and its plate number.');

  const supabase = await createClient();
  const { error } = await supabase.from('vehicles').insert({
    ...(isUuid(id) ? { id } : {}),
    name,
    plate_number: plate,
    photo_path: photo && photo.startsWith(`${id}/`) ? photo : null,
  });
  if (error) {
    if (photo) await supabase.storage.from('vehicle-photos').remove([photo]); // don't leave an orphan photo behind
    go('/manage', 'error', friendly(error, 'A vehicle with that plate number is already on the list.'));
  }
  revalidatePath('/', 'layout');
  go('/manage', 'ok', `${name} added.`);
}

export async function updateVehicle(formData: FormData) {
  const name = str(formData, 'name');
  const plate = str(formData, 'plate_number').toUpperCase();
  if (!name || !plate) go('/manage', 'error', 'The name and plate number cannot be empty.');
  const supabase = await createClient();
  const { error } = await supabase.from('vehicles').update({ name, plate_number: plate }).eq('id', str(formData, 'id'));
  if (error) go('/manage', 'error', friendly(error, 'Another vehicle already has that plate number.'));
  revalidatePath('/', 'layout');
  go('/manage', 'ok', 'Vehicle saved.');
}

export async function setVehiclePhoto(formData: FormData) {
  const id = str(formData, 'id');
  const path = str(formData, 'photo_path');
  if (!isUuid(id) || !path.startsWith(`${id}/`)) go('/manage', 'error', 'That photo could not be saved.');

  const supabase = await createClient();
  const { data: old } = await supabase.from('vehicles').select('photo_path').eq('id', id).maybeSingle();
  const { error } = await supabase.from('vehicles').update({ photo_path: path }).eq('id', id);
  if (error) go('/manage', 'error', 'That photo could not be saved.');
  if (old?.photo_path) await supabase.storage.from('vehicle-photos').remove([old.photo_path]);
  revalidatePath('/', 'layout');
  go('/manage', 'ok', 'Photo saved.');
}

export async function setVehicleActive(formData: FormData) {
  const active = str(formData, 'active') === 'true';
  const supabase = await createClient();
  const { error } = await supabase.from('vehicles').update({ is_active: active }).eq('id', str(formData, 'id'));
  if (error) go('/manage', 'error', friendly(error));
  revalidatePath('/', 'layout');
  go('/manage', 'ok', active ? 'Vehicle is back on the list.' : 'Vehicle removed from the list. Its past records are kept.');
}

/* ---------------- Drivers (administrator) ---------------- */

export async function addDriver(formData: FormData) {
  const name = str(formData, 'name');
  const phone = str(formData, 'phone');
  if (!name) go('/manage', 'error', 'Enter the driver\'s name.');
  const supabase = await createClient();
  const { error } = await supabase.from('drivers').insert({ name, phone: phone || null, status: 'active' });
  if (error) go('/manage', 'error', friendly(error));
  revalidatePath('/', 'layout');
  go('/manage', 'ok', `${name} added.`);
}

export async function updateDriver(formData: FormData) {
  const name = str(formData, 'name');
  if (!name) go('/manage', 'error', 'The name cannot be empty.');
  const supabase = await createClient();
  const { error } = await supabase.from('drivers').update({ name, phone: str(formData, 'phone') || null }).eq('id', str(formData, 'id'));
  if (error) go('/manage', 'error', friendly(error));
  revalidatePath('/', 'layout');
  go('/manage', 'ok', 'Driver saved.');
}

const DRIVER_ACTIONS = {
  approve: { status: 'active', message: 'Approved. They can now take and return vehicles.' },
  decline: { status: 'removed', message: 'Declined. They cannot use CarLog.' },
  remove: { status: 'removed', message: 'Removed from the list. Past records are kept.' },
  restore: { status: 'active', message: 'Back on the list.' },
} as const;

export async function changeDriver(formData: FormData) {
  const intent = str(formData, 'intent') as keyof typeof DRIVER_ACTIONS;
  const action = DRIVER_ACTIONS[intent];
  if (!action) go('/manage', 'error', 'Something went wrong. Please try again.');
  const supabase = await createClient();
  const { error } = await supabase.from('drivers').update({ status: action.status }).eq('id', str(formData, 'id'));
  if (error) go('/manage', 'error', friendly(error));
  revalidatePath('/', 'layout');
  go('/manage', 'ok', action.message);
}

/** For a driver who forgot their password: the administrator sets a new one. */
export async function setDriverPassword(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  if (password.length < 8) go('/manage', 'error', 'The new password needs at least 8 characters.');

  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (isAdmin !== true) go('/manage', 'error', 'Only the administrator can do that.');

  const { data: driver } = await supabase.from('drivers').select('user_id').eq('id', str(formData, 'id')).maybeSingle();
  if (!driver?.user_id) go('/manage', 'error', 'This driver does not have their own login.');

  const admin = createAdminClient();
  if (!admin) go('/manage', 'error', 'To set passwords, add SUPABASE_SERVICE_ROLE_KEY to the app settings (see the README).');
  const { error } = await admin!.auth.admin.updateUserById(driver!.user_id, { password });
  if (error) go('/manage', 'error', 'The password could not be changed. Please try again.');
  go('/manage', 'ok', 'New password saved. Tell the driver.');
}
