
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningInWithProvider, setIsSigningInWithProvider] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleEmailLogin = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, values.email, values.password);
          router.push('/');
        } catch (signUpError: any) {
          toast({ variant: 'destructive', title: 'Sign up failed', description: signUpError.message });
        }
      } else {
        toast({ variant: 'destructive', title: 'Login failed', description: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderLogin = async (provider: GoogleAuthProvider | GithubAuthProvider) => {
    setIsSigningInWithProvider(true);
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Sign in failed', description: error.message });
    } finally {
      setIsSigningInWithProvider(false);
    }
  };


  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
            <div className='flex justify-center mb-4'>
                <Logo />
            </div>
          <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in or create an account to continue.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleEmailLogin)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                 <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in with Email
            </Button>
            </CardContent>
          </form>
        </Form>
        <CardFooter className="flex flex-col gap-4">
            <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleProviderLogin(new GoogleAuthProvider())}
            disabled={isSigningInWithProvider || isLoading}
          >
            {isSigningInWithProvider && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in with Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleProviderLogin(new GithubAuthProvider())}
            disabled={isSigningInWithProvider || isLoading}
          >
             {isSigningInWithProvider && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in with GitHub
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
