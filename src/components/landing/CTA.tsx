import Image from 'next/image'
import React from 'react'
import { motion } from 'framer-motion'

const CTA = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, margin: "-50px" }}
            className="rounded-2xl bg-gray-100 p-4 sm:p-6 md:p-8 mx-2 sm:mx-4 my-6 sm:my-8"
        >
            <div className="flex flex-col bg-white p-3 sm:p-4 md:p-6 rounded-2xl lg:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
                {/* Left side - Purple section with icons and branding */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="w-full lg:w-auto flex justify-center lg:justify-start"
                >
                    <Image
                        src={"/assets/cta.png"}
                        width={400}
                        height={400}
                        alt="logo"
                        className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[400px] h-auto object-cover rounded-lg"
                    />
                </motion.div>

                {/* Right side - Content */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="flex-1 text-center lg:text-left"
                >
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 leading-tight px-2 sm:px-0"
                    >
                        Ready for a Personalised Learning Experience?
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed px-2 sm:px-0"
                    >
                        Join thousands of learners already transforming the way they study.
                        With our AI-powered tutor, every lesson is tailored just for you
                        making learning faster, easier, and more effective. Start now and
                        elevate your learning experience like never before.
                    </motion.p>
                </motion.div>
            </div>
        </motion.div>
    )
}

export default CTA