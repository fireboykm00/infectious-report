# Migration from Vite React to Next.js App Router

This project has been migrated from Vite + React to Next.js 15 with App Router and TypeScript.

## What Changed

### Dependencies
- **Removed**: Vite, React Router DOM, and all Vite-related packages
- **Added**: Next.js 15, next/navigation hooks
- **Updated**: ESLint configuration for Next.js

### Environment Variables
Environment variables have been renamed to follow Next.js conventions:
- `VITE_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Action Required**: Update your `.env` file with the new variable names.

### File Structure
- **Removed**: `index.html`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`
- **Added**: `app/` directory with Next.js App Router structure
- **Updated**: All components now use Next.js navigation (`next/link`, `next/navigation`)

### Routing
The app now uses Next.js App Router instead of React Router:
- `/` → `app/page.tsx`
- `/auth` → `app/auth/page.tsx`
- `/dashboard` → `app/dashboard/page.tsx`
- `/dashboard/report` → `app/dashboard/report/page.tsx`
- And so on...

### Configuration Files
- **Removed**: `eslint.config.js`, `tsconfig.app.json`, `tsconfig.node.json`
- **Added**: `next.config.mjs`, `.eslintrc.json`, `next-env.d.ts`
- **Updated**: `tsconfig.json` for Next.js

## How to Run

### 1. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Update Environment Variables
Copy `.env.example` to `.env` and update with your values:
```bash
cp .env.example .env
```

Then update the variable names in your `.env` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Run Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

## Key Differences from Vite

1. **Server Components**: Next.js uses Server Components by default. Components that use hooks or browser APIs need the `'use client'` directive at the top.

2. **Navigation**: Use `next/link` and `next/navigation` hooks instead of `react-router-dom`.

3. **Environment Variables**: Use `process.env.NEXT_PUBLIC_*` for client-side variables instead of `import.meta.env.VITE_*`.

4. **Import Paths**: The `@/` alias still works and points to the `src/` directory.

5. **SSR by Default**: Pages are server-side rendered by default, which improves performance and SEO.

## Component Updates

All components have been updated to work with Next.js:
- Navigation links use `next/link` with `href` prop
- Navigation hooks use `useRouter()` and `usePathname()` from `next/navigation`
- Client components have `'use client'` directive
- Environment variables use `process.env.NEXT_PUBLIC_*`

## Troubleshooting

### Build Errors
If you encounter build errors:
1. Delete `node_modules` and `.next` folder
2. Run `npm install` again
3. Run `npm run build`

### Type Errors
Next.js generates types in `.next/types/`. If you see type errors:
1. Run `npm run dev` to generate types
2. Restart your TypeScript server in VS Code

### Environment Variables Not Working
Make sure:
1. Variables are prefixed with `NEXT_PUBLIC_` for client-side access
2. The dev server is restarted after changing `.env`
3. Variables are defined in `.env` file (not `.env.example`)

## Additional Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Migrating from Vite](https://nextjs.org/docs/app/building-your-application/upgrading/from-vite)
