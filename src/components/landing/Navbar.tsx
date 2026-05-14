"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Skeleton } from '../ui/skeleton'
import { BookOpenIcon, BoxIcon, BoxSelectIcon, LogOut, User, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: profile, isLoading: isProfileLoading } = api.user.getProfile.useQuery();

    // Replaced TRPC with safe local state to bypass Vercel build errors
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            // Point to our new custom API route!
            const response = await fetch('/api/logout', {
                method: 'POST',
            });
            
            if (response.ok) {
                toast.success('Logged out successfully');
                router.push('/login');
                router.refresh(); // Forces Next.js to lock the pages
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout. Please try again.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    const getInitials = (name: string): string => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="border border-[#E2E1D9] bg-[#EFEFEF99] rounded-[10px] min-h-[9vh] w-full flex flex-col md:flex-row items-center justify-center md:justify-between px-4 sm:px-6 relative z-10 top-[35px]"
        >
            {/* Main navbar content */}
            <div className='flex items-center justify-between w-full md:w-auto py-4 md:py-0 md:gap-10'>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="flex items-center gap-2"
                >
                    <Image src={"/assets/logo.png"} width={40} height={40} alt="logo" className="w-auto h-[30px] sm:h-[40px]" />
                    <h1 className="text-lg sm:text-xl text-[#1A1A1A] font-bold">Omnitutor</h1>
                </motion.div>

                {/* Desktop navigation links */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    className="hidden md:flex items-center gap-6 lg:gap-8"
                >
                    <Link href="/pricing" className="text-[#1A1A1A] hover:text-[#754DFA] transition-colors text-sm lg:text-base">Pricing</Link>
                    <Link href="/tutorials" className="text-[#1A1A1A] hover:text-[#754DFA] transition-colors text-sm lg:text-base">Tutorials</Link>
                    <Link href="/support" className="text-[#1A1A1A] hover:text-[#754DFA] transition-colors text-sm lg:text-base">Support</Link>
                </motion.div>


                {/* Mobile menu button */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                    className="md:hidden flex items-center gap-2"
                >

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMobileMenu}
                        className="p-2"
                        aria-label="Toggle menu"
                    >
                        <motion.div
                            animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </motion.div>
                    </Button>
                </motion.div>
            </div>

            {/* Loading skeleton */}
            {isProfileLoading && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                    className="hidden md:flex items-center gap-3"
                >
                    <Skeleton className="h-8 w-16 bg-gray-200" />
                    <Skeleton className="h-8 w-16 bg-gray-200" />
                </motion.div>
            )}

            {/* Desktop auth buttons */}
            {!isProfileLoading && !profile?.name && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                    className="hidden md:flex items-center gap-3"
                >
                    <Link href="/signup">
                        <Button size="lg" variant="ghost" className="px-4 py-2 hover:underline text-sm lg:text-base">
                            Signup
                        </Button>
                    </Link>

                    <Link href="/login">
                        <Button size="lg" variant="lime" className="px-4 py-2 text-sm lg:text-base">
                            Login
                        </Button>
                    </Link>
                </motion.div>
            )}

            {/* Desktop user dropdown */}
            {!isProfileLoading && profile?.name && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                    className="hidden md:block"
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-8 w-8 rounded-full"
                                aria-label="User menu"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={profile?.email ? `https://avatar.vercel.sh/${profile.name}` : undefined}
                                        alt={profile?.name || 'User'}
                                    />
                                    <AvatarFallback>
                                        {profile?.name
                                            ? getInitials(profile.name)
                                            : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className='flex items-center gap-2 justify-between'>
                                My Account
                                <span className="text-sm text-muted-foreground">{profile?.name}</span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild>
                                <Link href="/" className="cursor-pointer flex items-center">
                                    <BoxSelectIcon className="mr-2 h-4 w-4" />
                                    Dashboard
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/account" className="cursor-pointer flex items-center">
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-500 flex items-center"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </motion.div>
            )}

            {/* Mobile menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="md:hidden w-full border-t border-[#E2E1D9] mt-4 py-4 overflow-hidden"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                            className="flex flex-col gap-4 "
                        >
                            {/* Loading skeleton for mobile */}
                            {isProfileLoading && (
                                <div className="flex flex-col gap-3 pt-3 border-t border-[#E2E1D9]">
                                    <Skeleton className="h-10 w-full bg-gray-200" />
                                    <Skeleton className="h-10 w-full bg-gray-200" />
                                </div>
                            )}

                            {/* User menu items for mobile */}
                            {!isProfileLoading && profile?.name && (
                                <div className="flex flex-col gap-3 ">
                                    <Link
                                        href="/"
                                        className="flex items-center py-2 text-[#1A1A1A] hover:text-[#754DFA] transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <BoxSelectIcon className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>

                                    <Link
                                        href="/account"
                                        className="flex items-center py-2 text-[#1A1A1A] hover:text-[#754DFA] transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </Link>

                                </div>
                            )}
                            <div className=" flex-col gap-3 pt-3 border-t hidden border-[#E2E1D9]">
                                <Link
                                    href="/pricing"
                                    className="text-[#1A1A1A] hover:text-[#754DFA] transition-colors py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Pricing
                                </Link>
                                <Link
                                    href="/tutorials"
                                    className="text-[#1A1A1A] hover:text-[#754DFA] transition-colors py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Tutorials
                                </Link>
                                <Link
                                    href="/support"
                                    className="text-[#1A1A1A] hover:text-[#754DFA] transition-colors py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Support
                                </Link>
                            </div>

                            {!isProfileLoading && profile?.name && (
                                <div className="flex flex-col gap-3 pt-3 border-t border-[#E2E1D9]">


                                    <button
                                        className="flex items-center py-2 text-red-600 hover:text-red-500 transition-colors"
                                        onClick={() => {
                                            handleLogout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        disabled={isLoggingOut}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                                    </button>
                                </div>
                            )}

                            {!isProfileLoading && !profile?.name && (
                                <div className="flex flex-col gap-3 pt-3 border-t border-[#E2E1D9]">
                                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button size="default" variant="ghost" className="w-full justify-center hover:underline">
                                            Signup
                                        </Button>
                                    </Link>

                                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button size="default" variant="lime" className="w-full justify-center">
                                            Login
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    )
}

export default Navbar