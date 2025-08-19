import { redirect } from 'next/navigation';

export default function HomePage() {
  // Let middleware handle authentication redirects
  // If user reaches here, redirect to dashboard as default
  redirect('/dashboard');
}
// Hot reload test comment Tue Aug 12 10:39:43 PM CEST 2025
