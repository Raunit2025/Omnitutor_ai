'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FaGoogle, FaMicrosoft } from 'react-icons/fa';
import { useState } from 'react';

import Link from 'next/link';

import { api } from '@/trpc/react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
    email: z.string(),
    otp: z.string(),
    userId: z.string(),
});

type LoginForm = z.infer<typeof loginSchema>;

const AuthComponent = ({ isLogin = true }: { isLogin?: boolean }) => {
    const router = useRouter();

    const { register, handleSubmit, watch } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });
    const [showPassword, setShowPassword] = useState(false);
    const email = watch('email');

    const login = api.auth.login.useMutation({
        onSuccess: (data) => {
            register('userId', { value: data.userId });
            toast.success('OTP sent successfully');
            // router.push('/canvas');
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const verifyEmail = api.auth.verifyEmail.useMutation({
        onSuccess: (data) => {
            toast.success('Logged in successfully');
            router.push(data.redirect);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const googleSignIn = api.auth.getGoogleOAuthUrl.useMutation({
        onSuccess: (data) => {


            window.location.href = data.url;
        },
        onError: () => {
            toast.error('Failed to initiate Google sign in');
        },
    });

    const onSubmit = (data: LoginForm) => {
        if (!showPassword) {
            setShowPassword(true);
            return;
        }
        verifyEmail.mutate({ userId: data.userId, otp: data.otp });
    };

    const handleContinue = () => {

        if (!email) {
            toast.error('Please enter your email');
            return;
        }
        login.mutate({ email });
        if (!showPassword) {
            setShowPassword(true);
            return;
        }
    };

    return (
        <Card
            className="max-w-[450px] w-full rounded-[24px] border p-5 gap-3  shadow-none   flex flex-col items-center overflow-hidden"
        >
            {/* Banner */}

            <div className="flex flex-col w-full  flex-1 justify-center ">
                <div className='bg-[var(--color-lime)]/60 p-2 mb-4 xl:mb-6 3xl:mb-8 rounded-md border border-gray-200'>    <h1 className="  text-3xl leading-[2.3rem] text-black mb-1 3xl:mb-2">{isLogin ? 'Log in!' : 'Sign up!'}</h1>
                    <p className="text-muted-foreground text-base  font-normal   ">{isLogin ? 'Welcome back! Please enter your details.' : 'Create an account to get started.'}</p>
                </div>  <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 md:gap-4 3xl:gap-5 ">
                    {/* <div className="flex flex-col gap-1 3xl:gap-2">
                        <Label htmlFor="email" className="block text-base   text-black mb-1">Email ID</Label>
                        <Input
                            id="email"
                            type="email"
                            disabled={showPassword}
                            placeholder='Enter your email'
                            className=" h-11 px-4 text-base rounded-md"
                            {...register('email')}
                        />
                    </div>
                    {!showPassword && (
                        <div className="flex items-center justify-end mt-0 mb-1">
                            <span className="text-xs text-black "> {isLogin ? "Don't have an account?" : "Already have an account?"}   {isLogin ? <Link href="/signup" className="text-[var(--color-purple)]  ml-1 hover:underline">Sign up</Link> : <Link href="/login" className="text-[var(--color-purple)]   ml-1 hover:underline">Log in</Link>}</span>
                        </div>
                    )}

                    {showPassword && (
                        <div className="flex flex-col gap-1 3xl:gap-2">
                            <label htmlFor="otp" className="block text-base   text-black mb-1">OTP</label>
                            <Input
                                id="otp"
                                type="number"
                                placeholder='Enter your OTP'
                                className=" h-11 px-4 text-base rounded-md"
                                {...register('otp')}
                            />
                            <div className="flex items-center justify-end mt-0 mb-1">
                                <div className="text-sm text-black "> Don&apos;t get the OTP?  <Button type="button" variant="link" className="text-[var(--color-purple)]  ml-1 hover:underline" onClick={handleContinue}>Resend OTP</Button>  </div>
                            </div>
                        </div>


                    )}


                    <Button
                        type="submit"
                        variant="purple"
                        onClick={handleContinue}
                        className="w-full h-12 cursor-pointer text-lg "
                        style={{ boxShadow: '0 2px 8px 0 #8f7cfb44' }}
                        disabled={login.isPending || (!showPassword && !email)}
                    >
                        {showPassword ? isLogin ? 'Login' : 'Sign up' : 'Continue'}
                    </Button>
                    <div className='flex flex-row gap-2 items-center my-2 md:my-5 3xl:my-6'>
                        <div className='w-full h-[0.6px] bg-[#303030]' />
                        <span className='text-[#303030] text-sm'>or</span>
                        <div className='w-full h-[0.6px] bg-[#303030]' />
                    </div> */}

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 cursor-pointer   text-base flex items-center justify-center gap-3 rounded-md shadow-sm mt-2"
                        onClick={() => googleSignIn.mutate()}
                        disabled={googleSignIn.isPending}
                    >
                        <FaGoogle className="text-lg" /> Continue with Google
                    </Button>
                    <Button
                        type="button"
                        variant="default"
                        className="w-full h-12  hidden cursor-pointer   text-base  items-center justify-center gap-3 rounded-md shadow-sm mt-2"
                        disabled={false}
                    >
                        <FaMicrosoft className="text-lg" /> Continue with Microsoft
                    </Button>
                </form>
                <div className="mt-8  justify-center gap-6 text-sm hidden  font-thin text-[#8f7cfb]">
                    <Link href="#" className="hover:underline">Terms of Use</Link>
                    <span className="text-[#bdbdbd]">|</span>
                    <Link href="#" className="hover:underline">Privacy Policy</Link>
                </div>
            </div>
        </Card>

    )
}

export default AuthComponent