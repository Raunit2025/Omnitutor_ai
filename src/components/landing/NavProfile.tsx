import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BoxSelectIcon, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/trpc/react'
import { useRouter } from 'next/navigation'

const NavProfile = () => {
    const router = useRouter();
    const { data: profile, isLoading: isProfileLoading } = api.user.getProfile.useQuery();
    
    // Add local state to track the loading status safely
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true); // Start loading spinner
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });
            
            if (response.ok) {
                toast.success('Logged out successfully');
                router.push('/login');
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('An error occurred during logout');
        } finally {
            setIsLoggingOut(false); // Stop loading spinner
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

    return (
        <div>
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
        </div>
    )
}

export default NavProfile