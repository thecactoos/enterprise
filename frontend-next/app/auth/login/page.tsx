'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../../stores/auth-store';
import { useToast } from '../../../stores/ui-store';
import { useHydration } from '../../../hooks/use-hydration';
import { authApi } from '../../../lib/api-functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const isHydrated = useHydration();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  
  const [isLoading, setIsLoading] = useState(false);
  // Only access store after hydration to prevent SSR mismatch
  const setAuth = useAuthStore((state) => state.setAuth);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // Don't proceed if not hydrated yet
    if (!isHydrated) return;
    
    setIsLoading(true);
    
    try {
      console.log('Attempting login for:', data.email);
      const authResponse = await authApi.login(data);
      
      console.log('Login response received:', { 
        hasUser: !!authResponse.user, 
        hasAccessToken: !!authResponse.accessToken,
        tokenLength: authResponse.accessToken?.length,
        userEmail: authResponse.user?.email 
      });
      
      // Validate response before setting auth
      if (!authResponse.user || !authResponse.accessToken) {
        throw new Error('Nieprawidłowa odpowiedź serwera - brak danych uwierzytelnienia');
      }
      
      if (authResponse.accessToken === 'undefined' || authResponse.accessToken === 'null') {
        throw new Error('Serwer zwrócił nieprawidłowy token');
      }
      
      // Set auth in Zustand store
      setAuth({
        user: authResponse.user,
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      });
      
      console.log('Auth set successfully, redirecting to:', redirectUrl);
      toast.success('Pomyślnie zalogowano!');
      
      // Small delay to ensure auth state is set before redirect
      setTimeout(() => {
        router.push(redirectUrl);
      }, 100);
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Błąd logowania';
      toast.error('Błąd logowania', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading during hydration to prevent flash
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 overflow-x-visible">
      <div className="w-full max-w-md space-y-8 overflow-x-visible">
        {/* Header with Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Grow with <span className="text-primary">me</span> digitally
          </h1>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardDescription className="text-center">
              Nie masz konta?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-primary hover:text-primary/80 underline underline-offset-4"
              >
                Zarejestruj się
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Adres email</Label>
                <Input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Wprowadź adres email"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Hasło</Label>
                <Input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Wprowadź hasło"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <Label htmlFor="remember-me" className="text-sm font-normal">
                    Zapamiętaj mnie
                  </Label>
                </div>

                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-4"
                >
                  Zapomniałeś hasła?
                </Link>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logowanie...
                  </>
                ) : (
                  'Zaloguj się'
                )}
              </Button>
            </form>

          </CardContent>
        </Card>

        {/* Animated Cactus Logo - Full Page Animation */}
        <div className="relative h-32 w-full">
          {/* Define SVG filter once */}
          <svg width="0" height="0" className="absolute">
            <defs>
              <filter id="filter0_d_402_4429" x="0.0419922" y="0.724121" width="252.855" height="415.51" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dy="4"/>
                <feGaussianBlur stdDeviation="19"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_402_4429"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_402_4429" result="shape"/>
              </filter>
            </defs>
          </svg>

          {/* Individual triangles positioned across the entire screen */}
          {/* Left side triangles */}
          <svg className="absolute animate-[flyInLeft_2s_ease-out_0.1s_both]" style={{left: 'calc(50% - 20px)', top: '20px', width: '20px', height: '20px'}} viewBox="90 130 52 32" fill="none">
            <path d="M90.7136 132.842L39.0303 162.299L39.362 102.811L90.7136 132.842Z" fill="#277037" filter="url(#filter0_d_402_4429)" transform="translate(-39, -102)"/>
          </svg>
          
          <svg className="absolute animate-[flyInLeft_2s_ease-out_0.3s_both]" style={{left: 'calc(50% - 30px)', top: '60px', width: '25px', height: '25px'}} viewBox="39 230 52 37" fill="none">
            <path d="M39.107 236.552L90.7902 207.095L90.4586 266.582L39.107 236.552Z" fill="#99CB8C" filter="url(#filter0_d_402_4429)" transform="translate(-39, -207)"/>
          </svg>
          
          <svg className="absolute animate-[flyInLeft_2s_ease-out_0.5s_both]" style={{left: 'calc(50% - 25px)', top: '40px', width: '22px', height: '28px'}} viewBox="38 171 53 61" fill="none">
            <path d="M90.0482 202.289L38.042 231.171L39.0323 171.691L90.0482 202.289Z" fill="#18C615" filter="url(#filter0_d_402_4429)" transform="translate(-38, -171)"/>
          </svg>
          
          <svg className="absolute animate-[flyInLeft_2s_ease-out_0.2s_both]" style={{left: 'calc(50% - 35px)', top: '35px', width: '23px', height: '30px'}} viewBox="39 137 53 60" fill="none">
            <path d="M39.4971 166.575L91.1804 137.119L90.8487 196.606L39.4971 166.575Z" fill="#00AB59" filter="url(#filter0_d_402_4429)" transform="translate(-39, -137)"/>
          </svg>

          {/* Center/Mixed triangles */}
          <svg className="absolute animate-[flyInRight_2s_ease-out_0.4s_both]" style={{left: 'calc(50% + 5px)', top: '45px', width: '26px', height: '30px'}} viewBox="100 172 53 60" fill="none">
            <path d="M100.724 201.977L152.154 172.08L152.331 231.568L100.724 201.977Z" fill="#277037" filter="url(#filter0_d_402_4429)" transform="translate(-100, -172)"/>
          </svg>
          
          <svg className="absolute animate-[flyInLeft_2s_ease-out_0.7s_both]" style={{left: 'calc(50% + 8px)', top: '15px', width: '24px', height: '30px'}} viewBox="100 103 53 60" fill="none">
            <path d="M100.797 132.527L152.554 103.201L152.072 162.687L100.797 132.527Z" fill="#BCE9A6" filter="url(#filter0_d_402_4429)" transform="translate(-100, -103)"/>
          </svg>

          {/* Right side triangles */}
          <svg className="absolute animate-[flyInRight_2s_ease-out_0.2s_both]" style={{left: 'calc(50% + 15px)', top: '25px', width: '24px', height: '30px'}} viewBox="151 138 53 60" fill="none">
            <path d="M151.651 167.807L100.221 197.704L100.045 138.216L151.651 167.807Z" fill="#00AB59" filter="url(#filter0_d_402_4429)" transform="translate(-100, -138)"/>
          </svg>
          
          <svg className="absolute animate-[flyInRight_2s_ease-out_0.4s_both]" style={{left: 'calc(50% + 20px)', top: '50px', width: '24px', height: '28px'}} viewBox="151 206 53 60" fill="none">
            <path d="M151.271 235.889L99.8415 265.786L99.6651 206.298L151.271 235.889Z" fill="#80BB8D" filter="url(#filter0_d_402_4429)" transform="translate(-99, -206)"/>
          </svg>
          
          <svg className="absolute animate-[flyInRight_2s_ease-out_0.3s_both]" style={{left: 'calc(50% + 25px)', top: '30px', width: '26px', height: '30px'}} viewBox="163 137 52 60" fill="none">
            <path d="M163.067 167.368L214.497 137.472L214.674 196.959L163.067 167.368Z" fill="#99CB8C" filter="url(#filter0_d_402_4429)" transform="translate(-163, -137)"/>
          </svg>
          
          <svg className="absolute animate-[flyInRight_2s_ease-out_0.5s_both]" style={{left: 'calc(50% + 30px)', top: '10px', width: '25px', height: '30px'}} viewBox="163 68 52 60" fill="none">
            <path d="M163.139 97.9184L214.897 68.5929L214.415 128.079L163.139 97.9184Z" fill="#80BB8D" filter="url(#filter0_d_402_4429)" transform="translate(-163, -68)"/>
          </svg>

          {/* Far right triangles */}
          <svg className="absolute animate-[flyInRight_2s_ease-out_0.7s_both]" style={{left: 'calc(50% + 35px)', top: '20px', width: '25px', height: '25px'}} viewBox="213 103 52 60" fill="none">
            <path d="M213.994 133.199L162.564 163.096L162.388 103.608L213.994 133.199Z" fill="#00AB59" filter="url(#filter0_d_402_4429)" transform="translate(-162, -103)"/>
          </svg>
          
          <svg className="absolute animate-[flyInRight_2s_ease-out_0.9s_both]" style={{left: 'calc(50% + 38px)', top: '45px', width: '26px', height: '28px'}} viewBox="213 171 52 60" fill="none">
            <path d="M213.614 201.281L162.184 231.178L162.008 171.69L213.614 201.281Z" fill="#18C615" filter="url(#filter0_d_402_4429)" transform="translate(-162, -171)"/>
          </svg>

          {/* Hover effect container */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform duration-500 w-20 h-32 pointer-events-none">
          </div>
        </div>
      </div>
    </div>
  );
}