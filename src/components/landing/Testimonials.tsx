import React from 'react'
import { motion } from 'framer-motion'

const testimonialsData = [
    {
        id: 1,
        content: {
            highlight1: "Omni",
            text1: " has transformed the way I learn! ",
            highlight2: "The AI Tutor helps me understand difficult topics",
            text2: " with ease."
        },
        quote: "I wish I had this when I was in my school",
        author: "Aditya Bajaj"
    },
    {
        id: 2,
        content: {
            highlight1: "The personalized learning approach",
            text1: " of Omnitutor is incredible! ",
            highlight2: "It adapts to my pace and learning style",
            text2: " perfectly."
        },
        quote: "Finally, a tutor that understands how I learn best",
        author: "Sarah Chen"
    },
    {
        id: 3,
        content: {
            highlight1: "Complex concepts",
            text1: " become so much easier with ",
            highlight2: "Omnitutor's step-by-step explanations",
            text2: ". It's like having a patient teacher 24/7."
        },
        quote: "My grades have improved significantly since I started using it",
        author: "Marcus Johnson"
    }
]

const Testimonials = () => {
    return (
        <div className="px-2 sm:px-4 py-6 sm:py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, margin: "-50px" }}
                className="rounded-2xl bg-gray-100 p-2 sm:p-4 md:p-6 mx-2 sm:mx-4 my-6 sm:my-8 text-2xl font-semibold"
            >
                Loved by thousands of learners
            </motion.div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mx-2 sm:mx-4">
                {testimonialsData.map((testimonial, index) => (
                    <motion.div
                        key={testimonial.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.6,
                            delay: index * 0.1,
                            ease: "easeOut"
                        }}
                        viewport={{ once: true, margin: "-50px" }}
                        whileHover={{
                            y: -5,
                            transition: { duration: 0.2, ease: "easeOut" }
                        }}
                        className="bg-gray-100 rounded-2xl p-4 sm:p-6 cursor-pointer"
                    >
                        <div className="mb-4">
                            <span className="text-purple-600 font-semibold">{testimonial.content.highlight1}</span>
                            <span className="text-gray-700">{testimonial.content.text1}</span>
                            <span className="text-purple-600 font-semibold">{testimonial.content.highlight2}</span>
                            <span className="text-gray-700">{testimonial.content.text2}</span>
                        </div>

                        <div className="mb-4">
                            <p className="text-gray-700 italic">
                                {testimonial.quote}
                            </p>
                        </div>

                        <div className="text-gray-900 font-medium">
                            {testimonial.author}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default Testimonials