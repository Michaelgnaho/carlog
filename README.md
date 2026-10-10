# CarLog: Vehicle Movement Register

One job: record who takes a car, when, who returns it, and when it comes back.

## What people see

- **Drivers** sign up on their own phone. The administrator approves them once. After that, a driver signs in, taps the **picture of the car**, and taps Confirm. Their own name and the time are recorded automatically, so nobody can log a trip under someone else's name.
- **Dashboard:** Available and Currently Out counts, TAKE A VEHICLE, RETURN A VEHICLE, and a photo card for every vehicle showing who has it.
- **Return a Vehicle:** tap the car that is back. The driver's own cars are shown first. The person returning is recorded automatically.
- **My trips (drivers) / Vehicle records (administrator):** drivers see only their own trips. The administrator sees every movement and can search by car, plate, driver or date.
- **Administrator:** approves drivers, adds cars with photos, and can still log a trip for a driver who has no phone.

Built with Next.js 16, Supabase (database, sign-in and photo storage) and Tailwind CSS. No email service is needed.

## Setup, step by step

### 1. Get the code ready
1. Install **Node.js 20 or newer** from nodejs.org (check with `node -v`).
2. Unzip this project into your repo folder so `package.json` sits in the root.
3. In the VS Code terminal run: `npm install`

### 2. Create the backend (Supabase)
1. Create a project at supabase.com and wait until it is ready.
2. Open **SQL Editor > New query**, paste everything from `supabase/schema.sql`, click **Run**. You should see "Success".
3. Go to **Authentication > Sign In / Providers > Email** and make sure:
   - **Allow new users to sign up** is **on** (drivers sign up themselves).
   - **Confirm email** is **off**. The administrator's approval is the check, so drivers do not need email links.
4. Go to **Authentication > Users > Add user > Create new user**. Enter your own email and a password, and tick **Auto Confirm User**. This is the administrator.
5. Back in the **SQL Editor**, run this with your email:
   ```sql
   select make_admin('you@example.com');
   ```
   It should answer "Done. you@example.com is now the administrator."

> **Already ran the first version of CarLog?** Do not run `schema.sql` again. Run `supabase/002_driver_accounts_and_photos.sql` instead. Your cars, drivers and records are kept, and your administrator keeps working.

### 3. Connect the app to Supabase
1. In Supabase open **Project Settings > API** (or **API Keys**).
2. Copy `.env.example` to `.env.local` and fill in the **Project URL** and the **anon / publishable** key.
3. Optional: to let the administrator set a new password for a driver who forgot theirs, also put the **service_role / secret** key in `SUPABASE_SERVICE_ROLE_KEY`. Keep it secret.

### 4. Run it
```
npm run dev
```
Open http://localhost:3000 and sign in as the administrator. Then open **Cars, drivers and approvals** (link at the bottom of the dashboard) and add your cars with photos.

### 5. Test it
1. In a private/incognito window open the app and **Create your account** as a test driver. You will see "Waiting for approval".
2. As administrator, the dashboard shows "1 driver is waiting for your approval". Open it and tap **Approve**.
3. As the test driver, refresh. Tap **TAKE A VEHICLE**, tap a car, **Confirm**. The numbers change.
4. Tap **RETURN A VEHICLE**, tap the car, **Confirm return**.
5. As administrator, open **View Vehicle Records** and search by car, driver or date.

### 6. Put it online
1. Push the project to GitHub (check that `.env.local` is not included).
2. On vercel.com choose **Add New > Project**, pick the repo, add the environment variables from `.env.local`, and click **Deploy**.
3. Give drivers the live address. They open it on their phone, sign up, and use **Add to Home Screen** so it opens like an app.

## Good to know

- **Nobody gets in without approval.** A new sign-up can see nothing and do nothing until the administrator approves them. Removing a driver switches their access off, but keeps their past records.
- **History cannot be edited or deleted from the app.** Take and return times come from the server clock, not the phone.
- **A car can only be out once at a time.** The database refuses a second "take" even if two people tap at the same moment.
- **Photos** are shrunk on the phone before they are uploaded, so large camera photos are fine. Anyone with a photo's direct web address can open it, so do not use photos that show anything private.
- **Forgot password:** the administrator opens the driver on the Cars, drivers and approvals page, taps "Forgot password? Set a new one", and tells the driver the new password (needs the service key from step 3).
- All times are shown in Lagos time.
- If a person forgets to confirm a return, the car stays Out until someone returns it.

## Ideas for later
Turn on CAPTCHA in Supabase (Authentication > Bot and Abuse Protection) if strangers start signing up, download records to Excel, notes or odometer on each trip, an email or SMS to the administrator when someone signs up, a reminder for cars out overnight, a view-only account for the boss.
