"use client"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "./Canvas";

export default function Layout({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <SidebarProvider defaultOpen={isOpen} onOpenChange={() => setIsOpen(!isOpen)} open={isOpen}>
            <ReactFlowProvider>
                <Canvas isOpen={isOpen} setIsOpen={setIsOpen}>
                    {children}
                </Canvas>
            </ReactFlowProvider>
        </SidebarProvider>
    )
}