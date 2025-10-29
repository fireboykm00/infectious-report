# IDSR Platform - Infectious Disease Surveillance & Response

A comprehensive Next.js platform for national health authorities to detect, report, analyze, and respond to infectious disease outbreaks in real-time.

## Project Info

**URL**: https://lovable.dev/projects/11efa166-abfa-4f5b-939b-d769492866f4

## Technologies

This project is built with:

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **Supabase** - Backend as a Service (authentication & database)
- **TanStack Query** - Data fetching and caching
- **Leaflet** - Interactive maps for outbreak visualization

## Getting Started

### Prerequisites

- Node.js 18+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# 1. Clone the repository
git clone <YOUR_GIT_URL>

# 2. Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp .env.example .env
# Edit .env and add your Supabase credentials

# 5. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

Create a `.env` file in the root directory with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Protected dashboard routes
├── src/
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and API functions
│   ├── pages/             # Page components (used by app router)
│   └── integrations/      # Third-party integrations (Supabase)
├── public/                # Static assets
└── supabase/              # Supabase schema and migrations
```

## Migration Note

This project was recently migrated from Vite to Next.js. See [MIGRATION_TO_NEXTJS.md](./MIGRATION_TO_NEXTJS.md) for details.

## Deployment

### Deploy to Vercel (Recommended)

The easiest way to deploy this Next.js app is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy to Other Platforms

You can also deploy to:
- **Netlify** - Full Next.js support
- **Railway** - Node.js hosting
- **Render** - Web services
- **AWS/GCP/Azure** - Container deployment

## Features

- 🔐 **Secure Authentication** - Role-based access control
- 📊 **Real-time Surveillance** - Monitor disease outbreaks
- 🗺️ **Geographic Mapping** - Visualize outbreak locations
- 📈 **Analytics Dashboard** - Data insights and trends
- 🔔 **Smart Alerts** - Automatic notifications
- 📱 **Offline Support** - Continue reporting without connectivity
- 🧪 **Lab Integration** - Manage laboratory test results

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

This project is proprietary software developed for health authorities.

## Support

For support and questions, please contact the development team or open an issue.
