'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Mail, Shield, Settings } from 'lucide-react';
import { TRPCClientError } from '@trpc/client';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NavProfile from '@/components/landing/NavProfile';

export default function AccountPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile')
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        preparing_for: [] as string[],
        current_role: '',
        current_course: '',
        country_name: '',
    });
    const [inputValue, setInputValue] = useState('');

    const { data, isLoading, error, refetch } = api.onboarding.createUser.useQuery(undefined, {
        retry: 1,
        refetchOnWindowFocus: false,
    });

    const { mutateAsync: updatePreparingFor } = api.onboarding.updatePreparingFor.useMutation({
        onSuccess: () => {
            toast.success("Preparing for updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update preparing for");
        }
    });

    const { mutateAsync: updateRole } = api.onboarding.updateRole.useMutation({
        onSuccess: () => {
            toast.success("Role updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update role");
        }
    });

    const { mutateAsync: updateCourse } = api.onboarding.updateCourse.useMutation({
        onSuccess: () => {
            toast.success("Course updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update course");
        }
    });

    const { mutateAsync: updateCountryName } = api.onboarding.updateCountryName.useMutation({
        onSuccess: () => {
            toast.success("Country updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update country");
        }
    });

    useEffect(() => {
        if (data?.user) {
            if (!data.user.onboarded_on) {
                router.push('/onboarding');
            }

            setFormData({
                name: data.user.name || '',
                email: data.user.email || '',
                preparing_for: data.user.preparing_for || [],
                current_role: data.user.current_role || '',
                current_course: data.user.current_course || '',
                country_name: data.user.country_name || '',
            });
        }
    }, [data, router]);

    const logout = api.auth.logout.useMutation({
        onSuccess: () => {
            toast.success('Logged out successfully');
            router.push('/login');
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const updateProfile = api.user.updateProfile.useMutation({
        onSuccess: () => {
            toast.success('Profile updated successfully');
            setIsEditing(false);
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile.mutate(formData);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    };

    useEffect(() => {
        if (error instanceof TRPCClientError) {
            toast.error(error.message);
            router.push('/login');
        }
    }, [error, router]);

    if (error instanceof TRPCClientError) {
        return null;
    }

    return (
        <div className='flex flex-col items-center justify-center w-full h-full'>

            <div className="container max-w-7xl py-10">
                <div className='flex items-center justify-between'>
                    <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
                    <NavProfile />
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="education">Education</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>
                                    Manage your personal information and how it appears on the platform
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center space-x-4">
                                            <Avatar className="h-20 w-20">
                                                <AvatarImage
                                                    src={`https://avatar.vercel.sh/${data?.user?.email}`}
                                                    alt={data?.user?.name || 'User'}
                                                />
                                                <AvatarFallback className="text-lg">
                                                    {data?.user?.name ? getInitials(data?.user?.name) : 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="text-xl font-medium">{data?.user?.name}</h3>
                                                <p className="text-sm text-muted-foreground">{data?.user?.email}</p>
                                            </div>
                                        </div>

                                        <Separator />

                                        {isEditing ? (
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Full Name</Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        placeholder="Your full name"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email Address</Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        placeholder="Your email address"
                                                        disabled
                                                    />
                                                </div>

                                                <div className="flex justify-end space-x-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setIsEditing(false)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        disabled={updateProfile.isPending}
                                                    >
                                                        {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                                                    </Button>
                                                </div>
                                            </form>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                                                        </div>
                                                        <p className="text-base">{data?.user?.name}</p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                                            <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                                                        </div>
                                                        <p className="text-base">{data?.user?.email}</p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                                            <p className="text-sm font-medium text-muted-foreground">Account ID</p>
                                                        </div>
                                                        <p className="text-sm font-mono">{data?.user?.$id}</p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Settings className="h-4 w-4 text-muted-foreground" />
                                                            <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                                            <p className="text-base">Active</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setIsEditing(true)}
                                                    >
                                                        Edit Profile
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="education" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Education Information</CardTitle>
                                <CardDescription>
                                    Manage your educational background and preferences
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="current_role">Role</Label>
                                            <Select
                                                value={formData.current_role}
                                                onValueChange={async (value) => {
                                                    setFormData(prev => ({ ...prev, current_role: value }));
                                                    await updateRole({ current_role: value });
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select your role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="school_student">School Student</SelectItem>
                                                    <SelectItem value="college_student">College Student</SelectItem>
                                                    <SelectItem value="preparing_for_exam">Preparing for Exam</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>



                                        <div className="space-y-2">
                                            <Label htmlFor="current_course">Course</Label>
                                            <Input
                                                id="current_course"
                                                value={formData.current_course}
                                                onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                                    setFormData(prev => ({ ...prev, current_course: e.target.value }));
                                                    await updateCourse({ current_course: e.target.value });
                                                }}
                                                placeholder="Your course"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="preparing_for">Preparing For</Label>
                                            <div className="space-y-2">
                                                <Input
                                                    id="preparing_for"
                                                    type="text"
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ',') {
                                                            e.preventDefault();
                                                            const trimmedValue = inputValue.trim();
                                                            if (trimmedValue && !formData.preparing_for.includes(trimmedValue)) {
                                                                const newItems = [...formData.preparing_for, trimmedValue];
                                                                setFormData(prev => ({ ...prev, preparing_for: newItems }));
                                                                updatePreparingFor({ preparing_for: newItems });
                                                                setInputValue("");
                                                            }
                                                        }
                                                    }}
                                                    placeholder="Type and press Enter or comma to add"
                                                />

                                                {formData.preparing_for.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {formData.preparing_for.map((item, index) => (
                                                            <div key={index} className="bg-[#444] text-white px-3 py-1 rounded-full flex items-center">
                                                                <span className="mr-2">{item}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        const newItems = formData.preparing_for.filter((_, i) => i !== index);
                                                                        setFormData(prev => ({ ...prev, preparing_for: newItems }));
                                                                        await updatePreparingFor({ preparing_for: newItems });
                                                                    }}
                                                                    className="text-xs text-white hover:text-red-400"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country_name">Country</Label>
                                            <Input
                                                id="country_name"
                                                value={formData.country_name}
                                                onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                                    setFormData(prev => ({ ...prev, country_name: e.target.value }));
                                                    await updateCountryName({ country_name: e.target.value });
                                                }}
                                                placeholder="Your country"
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Security Settings</CardTitle>
                                <CardDescription>
                                    Manage your account security and preferences
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-end">
                                    <Button
                                        variant="destructive"
                                        onClick={() => logout.mutate()}
                                        className="flex items-center gap-2"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
