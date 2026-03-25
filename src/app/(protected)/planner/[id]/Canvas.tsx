"use client"
import { CanvasProvider } from "./CanvasContext";
import { LeftSidebar } from "./LeftSidebar";
import Link from "next/link";
import Image from "next/image";

export function Canvas({ children, isOpen, setIsOpen }: { children: React.ReactNode, isOpen: boolean, setIsOpen: (isOpen: boolean) => void }) {
    return (
        <div className={`h-screen w-screen`}>
            <CanvasProvider >
                <LeftSidebar />
                <main className="w-full h-full">
                    {!isOpen && (
                        <div className="absolute top-5 left-5 flex justify-center gap-4 items-center z-50 md:hidden">
                            <div
                                className="flex items-center  md:gap-28  rounded-lg p-2.5 transition-colors cursor-pointer z-50 shadow-md"
                            >
                                <Link
                                    href="/"
                                    aria-label="Return to dashboard"
                                    title="Return to dashboard"
                                    className="hover:scale-105 transition-all duration-300 cursor-pointer"
                                >
                                    <Image
                                        src="/assets/logo.png"
                                        alt="Logo"
                                        height={30}
                                        width={20}
                                    />
                                </Link>
                                <svg
                                    onClick={() => setIsOpen(!isOpen)}
                                    width="32"
                                    height="21"
                                    viewBox="0 0 32 21"
                                    fill="none"
                                    className="hidden md:block"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <rect
                                        x="0.807692"
                                        y="0.807692"
                                        width="29.8846"
                                        height="19.3846"
                                        rx="3.23077"
                                        stroke="black"
                                        strokeWidth="1.61538"
                                    />
                                    <line
                                        x1="11.3075"
                                        y1="20.1923"
                                        x2="11.3075"
                                        y2="0.807646"
                                        stroke="black"
                                        strokeWidth="1.61538"
                                    />
                                </svg>
                            </div>
                        </div>)}
                    {children}
                </main>
            </CanvasProvider>
        </div>
    )
} 