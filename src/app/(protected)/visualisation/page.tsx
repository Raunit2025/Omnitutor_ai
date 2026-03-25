'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Maximize2, Eye, Settings, Sparkles, Zap, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const Page = () => {
    const [code, setCode] = useState('');
    const [explanation, setExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    // Example prompts for inspiration
    const examplePrompts = [
        "Rotating cube",
        "Solar system",
        "Particle galaxy",
        "3D terrain",
        "DNA helix",
        "Neon tunnel"
    ];

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            toast.error('Please enter a prompt');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const response = await fetch('/api/threejs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            setCode(data.code);
            setExplanation(data.explanation);
            toast.success('3D visualization generated successfully!', {
                icon: '🎨',
                duration: 3000,
            });

            // Scroll to preview section after generation
            setTimeout(() => {
                if (previewRef.current) {
                    previewRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 100);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate code';
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Error generating code:', err);
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isLoading) {
            handleGenerate();
        }
    };

    const handleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleExampleClick = (example: string) => {
        setPrompt(example);
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isFullscreen]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple/10 via-background to-teal/10">
            <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 md:py-6 max-w-7xl">
                {/* Mobile-optimized Header */}


                <div className="pt-12 sm:pt-14 md:pt-16 mb-4 sm:mb-6 md:mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 md:mb-4 px-2">
                            3D Visualisation Studio
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl px-2">
                            Create stunning visualizations with AI. From simple geometries to complex interactive scenes.
                        </p>
                    </div>
                </div>

                {/* Mobile-optimized Input Card */}
                <Card className="mb-4 sm:mb-6 md:mb-8 shadow-xl border border-purple/20 bg-card/80 backdrop-blur-sm mx-2 sm:mx-0">
                    <CardHeader className="pb-2 sm:pb-3 md:pb-4 px-3 sm:px-4 md:px-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                            <Zap className="h-4 w-4 text-teal" />
                            Generate Your Vision
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-4 md:px-6">
                        <div className="space-y-3 sm:space-y-4 md:space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="prompt" className="text-xs sm:text-sm md:text-base font-medium">
                                    Describe your 3D visualization
                                </Label>
                                <Textarea
                                    id="prompt"
                                    placeholder="E.g., A rotating cube, particle system, interactive scene..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoading}
                                    className="min-h-[60px] sm:min-h-[80px] md:min-h-[100px] resize-none focus:ring-2 focus:ring-purple border-2 border-purple/30 text-xs sm:text-sm md:text-base"
                                    rows={isMobile ? 2 : 3}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Press Ctrl/Cmd + Enter to generate
                                </p>
                            </div>

                            {/* Mobile-optimized Example Prompts */}
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Quick Examples
                                </Label>
                                <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
                                    {examplePrompts.map((example, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="cursor-pointer hover:bg-purple/20 transition-colors px-2 py-1 text-xs border border-purple/30 whitespace-nowrap"
                                            onClick={() => handleExampleClick(example)}
                                        >
                                            {example}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                variant="lime"
                                disabled={isLoading || !prompt.trim()}
                                className="w-full h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                        <span className="hidden sm:inline">Generating your visualization...</span>
                                        <span className="sm:hidden">Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline">Generate Visualization</span>
                                        <span className="sm:hidden">Generate</span>
                                    </>
                                )}
                            </Button>

                            {error && (
                                <div className="mt-2 sm:mt-3 md:mt-4 p-2 sm:p-3 md:p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 bg-destructive rounded-full flex-shrink-0 mt-1"></div>
                                        <span className="text-xs sm:text-sm break-words">{error}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Mobile-optimized Results */}
                {(code || explanation) && (
                    <div
                        ref={previewRef}
                        className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-2' : 'mx-2 sm:mx-0'}`}
                        id="visualisation-container"
                    >
                        <Card className={`shadow-xl border border-teal/20 bg-card/90 backdrop-blur-sm ${isFullscreen ? 'h-full rounded-lg' : ''}`}>
                            <CardHeader className="pb-2 px-3 sm:px-4 md:px-6">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                                        <Eye className="h-4 w-4 text-teal" />
                                        <span className="hidden sm:inline">Your 3D Visualization</span>
                                        <span className="sm:hidden">Preview</span>
                                    </CardTitle>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleFullscreen}
                                            className="h-6 sm:h-7 md:h-8 border-purple/30 hover:bg-purple/10 px-1.5 sm:px-2 md:px-3"
                                        >
                                            {isFullscreen ? (
                                                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                            ) : (
                                                <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Tabs defaultValue="preview" className="w-full">
                                    <TabsContent value="preview" className="mt-0">
                                        <div className={`relative border border-purple/20 rounded-lg overflow-hidden mx-2 sm:mx-3 md:mx-6 mb-2 sm:mb-3 md:mb-6 ${isFullscreen
                                            ? 'h-[calc(100vh-120px)]'
                                            : isMobile
                                                ? 'h-[250px] sm:h-[300px]'
                                                : 'h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh]'
                                            }`}>
                                            <iframe
                                                ref={iframeRef}
                                                srcDoc={code}
                                                width="100%"
                                                height="100%"
                                                className="h-full w-full bg-background"
                                                title="Three.js Preview"
                                                sandbox="allow-scripts allow-same-origin"
                                            />
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                {explanation && !isFullscreen && (
                                    <div className="mx-2 sm:mx-3 md:mx-6 mb-2 sm:mb-3 md:mb-6">
                                        <Separator className="mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-purple/50 to-teal/50" />
                                        <div className="space-y-2">
                                            <Label className="font-medium flex items-center gap-2 text-xs sm:text-sm md:text-base">
                                                <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-purple" />
                                                Technical Details
                                            </Label>
                                            <div className="bg-muted/50 border border-purple/20 p-2 sm:p-3 md:p-4 rounded-lg">
                                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                                                    {explanation}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Page;