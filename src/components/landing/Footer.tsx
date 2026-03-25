import Image from 'next/image'
import React from 'react'
import { motion } from 'framer-motion'

const Footer = () => {
    return (
        <footer className="relative  py-16  px-8 overflow-hidden">
            {/* Background watermark text */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
                className="absolute  flex items-end justify-center pointer-events-none"
            >
                <span className="text-[#0000001f] text-[15rem] flex   items-baseline  mt-auto font-bold tracking-wider select-none opacity-50">
                    omnitutor
                </span>
            </motion.div>

            {/* Main footer content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, margin: "-50px" }}
                className="relative z-10 max-w-md"
            >
                {/* Logo and brand */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="flex items-center gap-3 mb-4"
                >
                    {/* Purple triangle logo */}
                    <Image src={"/assets/logo.png"} width={40} height={40} alt="logo" className="w-auto h-[30px] sm:h-[40px]" />
                    <h2 className="text-2xl font-bold text-gray-900">Omnitutor</h2>
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="text-gray-700 text-base leading-relaxed mb-8"
                >
                    An AI Tutor that can<br />
                    literally teach you Anything!
                </motion.p>

                {/* Copyright */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="text-gray-600 text-sm"
                >
                    © Copyright 2025 OmniTutor
                </motion.p>
            </motion.div>
        </footer>
    )
}

export default Footer