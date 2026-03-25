'use client';

import Image from 'next/image';
import AuthComponent from '../components/AuthComponent';

export default function LoginPage() {

    return (
        <div
            className="min-h-screen w-full flex items-center lg:justify-between justify-center bg-cover bg-center bg-no-repeat sm:p-5"
        >

            {/* Card Content */}

            <div className='bg-gray-100 sm:p-8 rounded-lg border border-gray-200 w-full'>

                <div className='bg-white rounded-lg border  border-gray-200 w-full p-5'>

                    <div className='flex flex-col lg:flex-row items-center justify-center w-full gap-5 max-w-[1280px] mx-auto'>   <div className='flex flex-col items-center justify-center w-full lg:w-[44%]'>
                        <AuthComponent isLogin={false} />
                    </div>
                        <div className='hidden lg:flex w-[56%]  items-center justify-center'>
                            <Image src="/assets/auth/signup.png" alt="background" width={1000} height={1000} className='h-full w-full max-w-[500px] object-cover' />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
} 