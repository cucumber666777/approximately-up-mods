# Approximately Up Mods site

Static GitHub Pages catalog for Approximately Up mods.

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase-schema.sql` from this repository.
3. Open Project Settings -> API and copy:
   - Project URL
   - anon public key
4. Paste them into `supabase-config.js`:

```js
window.AU_SUPABASE = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR-ANON-PUBLIC-KEY"
};
```

After that the site uses Supabase Auth for accounts, Storage for `.zip`/`.dll` mod files and screenshots, and the `mods` table for published catalog entries. Users can delete only their own uploaded mods.

For the simplest upload flow, open Supabase Authentication -> Providers -> Email and turn off Confirm email. Otherwise new users must confirm their email before uploading.
