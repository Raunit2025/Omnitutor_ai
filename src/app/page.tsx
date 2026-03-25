"use client"
import Navbar from '@/components/landing/Navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import Footer from '@/components/landing/Footer'
import CTA from '@/components/landing/CTA'
import Testimonials from '@/components/landing/Testimonials'
import PlannerBox from '@/components/landing/PlannerBox'
import Boxee from '@/components/landing/Boxee'
import { api } from '@/trpc/react'
import Canvases from '@/components/landing/Canvases'
import Plans from '@/components/landing/Plans'
import { useRouter } from 'next/navigation'
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { cn } from '@/lib/utils'
import LoadingWaiting from '@/components/util/LoadingWaiting'

const page = () => {
	const [activeTab, setActiveTab] = useState('learn')
	const [canvasTab, setCanvasTab] = useState('canvases')
	const [loadingDialog, setLoadingDialog] = useState<{
		loading: boolean;
		topic: string;
		funFacts: string[];
		duration: number;
	}>({
		loading: false,
		topic: '',
		funFacts: [],
		duration: 10
	})
	const router = useRouter()
	const { data: userData } = api.user.getUser.useQuery()
	const { data: userProfile } = api.user.getProfile.useQuery()

	useEffect(() => {
		if (userData) {
			if (!userData.onboarded_on) {
				router.push('/onboarding')
			}
		}
	}, [userData])



	return (
		<div className='container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 2xl:px-24'>
			<Navbar />
			{loadingDialog.loading && <LoadingWaiting topic={loadingDialog.topic} funFacts={loadingDialog.funFacts} duration={loadingDialog.duration} />}


			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="flex flex-col items-center justify-center w-full h-full px-2 sm:px-4 md:px-6 lg:px-8 mt-12 sm:mt-16 md:mt-20 lg:mt-24 xl:mt-32"
			>
				{/* <div className='flex '>
					<motion.h1
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="text-4xl md:text-5xl font-bold text-[#1A1A1A]  text-center pb-3 md:pb-5 xl:pb-7 "
					>
						<span className="bg-clip-text  text-[#7D59FF] ">Omnitutor</span> makes
					</motion.h1>

					<ContainerTextFlipDemo />
					<motion.p
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="text-4xl md:text-5xl font-bold text-[#1A1A1A]  text-center pb-3 md:pb-5 xl:pb-7 "
					>
						Faster
					</motion.p>
				</div> */}

				<motion.h1
					initial={{
						opacity: 0,
					}}
					whileInView={{
						opacity: 1,
					}}
					className={cn(
						"text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#1A1A1A] text-center pb-3 md:pb-5 xl:pb-7"
					)}
					layout
				>
					<div className="flex flex-col items-center justify-center gap-1 sm:gap-2 h-[60px] ">
						<div className="flex flex-wrap items-center justify-center">
							<ContainerTextFlip
								className="text-zinc-700 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold"
								words={["Master Any Subject", "Test Your Knowledge", "Revise & Practice", "Plan Your Learning"]}
								interval={2500}
								animationDuration={500}
							/>
							<span className="text-zinc-700 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold whitespace-nowrap mr-2">
								{" "}with {" "}
							</span>
							<span className="bg-gradient-to-r from-[#7D59FF] to-[#6B46C1] bg-clip-text text-transparent text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold">
								Omnitutor
							</span>
						</div>
					</div>
				</motion.h1>
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.8, delay: 0.4 }}
					className="text-center text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl px-4"
				>
					Your personalized AI tutor that breaks <br className="hidden sm:block" /> one concept at a time
				</motion.p>
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5, delay: 0.6 }}
					className="w-full max-w-4xl mb-16"
				>
					<Tabs defaultValue={activeTab} className="w-full" value={activeTab} onValueChange={setActiveTab}>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.8 }}
						>
							<TabsList className="grid grid-cols-2 w-fit mb-8 h-auto bg-[#EFEFEF99] p-2  gap-2 border border-gray-300/50">
								<TabsTrigger
									value="learn"
									className="px-8 py-3 text-base font-medium  data-[state=active]:bg-[var(--color-lime)] data-[state=active]:text-black data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 transition-all duration-200 "
								>
									Learn Anything
								</TabsTrigger>
								<TabsTrigger
									value="plan"
									className="px-8 py-3 text-base font-medium  data-[state=active]:bg-[var(--color-lime)] data-[state=active]:text-black data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 transition-all duration-200  relative"
								>
									Study Planner
									<span className="absolute -top-1 -right-1 bg-[var(--color-lime)] text-black text-xs font-semibold px-2 py-0.5 rounded-full">
										New
									</span>
								</TabsTrigger>

							</TabsList>
						</motion.div>

						<TabsContent value="learn" className=" rounded-md bg-[#EFEFEF99] p-2  gap-2 border border-gray-300/50">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, ease: "easeOut" }}
								className=" text-center"
							>
								<Boxee userData={userData || null} setLoadingDialog={setLoadingDialog} loadingDialog={loadingDialog} />
							</motion.div>
						</TabsContent>

						<TabsContent value="plan" className=" rounded-md bg-[#EFEFEF99] p-2  gap-2 border border-gray-300/50">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, ease: "easeOut" }}
								className=" w-full h-full"
							>
								<PlannerBox setLoadingDialog={setLoadingDialog} loadingDialog={loadingDialog} />
							</motion.div>
						</TabsContent>
					</Tabs>
				</motion.div>
			</motion.div>

			{userProfile && <motion.div
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				className=' p-4 sm:p-6 md:p-8 '
				transition={{ duration: 0.6, ease: "easeOut" }}
				viewport={{ once: true, margin: "-100px" }}
			>
				<Tabs defaultValue={canvasTab} className="w-full" value={canvasTab} onValueChange={setCanvasTab}>

					<TabsList className="grid grid-cols-2 w-fit mb-8 h-auto bg-[#EFEFEF99] p-2  gap-2 border border-gray-300/50">
						<TabsTrigger
							value="canvases"
							className="px-8 py-3 text-base font-medium  data-[state=active]:bg-[var(--color-lime)] data-[state=active]:text-black data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 transition-all duration-200 "
						>
							Your Canvas
						</TabsTrigger>
						<TabsTrigger
							value="plans"
							className="px-8 py-3 text-base font-medium  data-[state=active]:bg-[var(--color-lime)] data-[state=active]:text-black data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 transition-all duration-200  relative"
						>
							Your Plans

						</TabsTrigger>

					</TabsList>

					<TabsContent value="canvases" className=" rounded-md bg-[#EFEFEF99] p-2  gap-2 border border-gray-300/50">
						<Canvases />
					</TabsContent>

					<TabsContent value="plans" className=" rounded-md bg-[#EFEFEF99] p-2  gap-2 border border-gray-300/50">
						<Plans />
					</TabsContent>
				</Tabs>
			</motion.div>}
			<motion.div
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				viewport={{ once: true, margin: "-100px" }}
			>
				<Testimonials />
			</motion.div>

			<motion.div
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				viewport={{ once: true, margin: "-100px" }}
			>
				<CTA />
			</motion.div>

			<motion.div
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				viewport={{ once: true, margin: "-100px" }}
			>
				<Footer />
			</motion.div>
		</div>
	)
}

export default page