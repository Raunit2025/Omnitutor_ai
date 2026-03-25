"use client"
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NotesNodeType } from "./";
import React, { useState, useMemo } from "react";
// import { BlockMath, InlineMath } from 'react-katex';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { correctAndFormatSVG } from "@/lib/utils";
// --- Helper Components ---

// Math rendering with KaTeX (fallback to plain if not available)
function MathBlock({ content }: { content: string }) {
    return (
        <MathJaxContext>
            <div className="bg-purple-50 dark:bg-purple-900/20  rounded p-2 my-2 font-mono text-sm border border-purple-200 dark:border-purple-700 flex items-center gap-2">
                <span className="font-semibold">Math:</span>
                <span className="select-all">
                    {/* In production, use KaTeX/MathJax. For now, just show as TeX */}
                    <MathJax>
                        {content}
                    </MathJax>
                </span>
            </div>
        </MathJaxContext>
    );
}

// Code block with copy button
function CodeBlock({ content }: { content: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };
    return (
        <div className="relative group my-2">
            <pre className="bg-gray-900 dark:bg-gray-800 text-green-200 rounded p-2 text-xs overflow-x-auto border border-gray-700">
                <span className="font-semibold text-green-400">Code:</span>
                <br />
                <code>{content}</code>
            </pre>
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white text-xs px-2 py-1 rounded hover:bg-green-600"
                title="Copy code"
                tabIndex={-1}
            >
                {copied ? "Copied!" : "Copy"}
            </button>
        </div>
    );
}

// Image block: if content is a URL, show image, else show prompt
function ImageBlock({ content }: { content: string }) {
    const isUrl = content.includes("https://")
    return (
        <div className="bg-white rounded-md p-2 my-2 border w-full flex flex-col items-center">
            <span className="font-semibold mb-1">Image:</span>
            {isUrl ? (
                <img
                    width={1000}
                    height={600}
                    src={content.trim()}
                    alt="Note visual"
                    className="max-h-[400px] w-full h-auto rounded-md shadow border"
                    loading="lazy"
                />
            ) : (
                <span className="text-xs text-blue-700 dark:text-blue-200">{content}</span>
            )}
        </div>
    );
}

function SVGBlock({ content }: { content: string }) {
    // Check if content is an SVG tag
    const isSvgContent = content.trim().startsWith('<svg');

    // Process content for markdown formatting
    const html = content.replace(
        /`([^`]+)`/g,
        '<code class="bg-gray-200 dark:bg-gray-700 rounded px-1 text-xs">$1</code>'
    ).replace(
        /\*\*([^*]+)\*\*/g,
        '<b>$1</b>'
    ).replace(
        /\*([^*]+)\*/g,
        '<i>$1</i>'
    );

    // Only process SVG if the content is actually SVG
    const processedContent = isSvgContent ? correctAndFormatSVG(content) : html;

    return (
        <div className="my-2 bg-white  flex  items-center justify-center rounded-md p-2 border ">
            {isSvgContent ? (
                <div
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                    aria-label="SVG diagram"
                    className="w-full h-full"
                />
            ) : (
                <span
                    dangerouslySetInnerHTML={{ __html: html }}
                    className="text-black"
                />
            )}
        </div>
    );
}

// Quiz block with answer reveal
function QuestionBlock({ content }: { content: string }) {
    const [question] = content.split("|A:");
    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200 rounded p-2 my-2 border border-yellow-200 dark:border-yellow-700">
            <span className="font-semibold">Quiz:</span>
            <div className="mt-1">{question?.replace(/^Q:\s*/, "")}</div>
            {/* <details className="mt-1">
                <summary className="cursor-pointer text-xs text-yellow-700 dark:text-yellow-200">Show Answer</summary>
                <div className="mt-1 text-green-700 dark:text-green-300">{answer?.trim() || <span className="italic text-gray-400">No answer provided.</span>}</div>
            </details> */}
        </div>
    );
}

// Text block with markdown support (basic)
function TextBlock({ content }: { content: string }) {
    // Simple markdown: bold, italic, code
    const renderMarkdown = (text: string) => {
        // Replace **bold**, *italic*, `code`
        const html = text
            .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 rounded px-1 text-xs">$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
            .replace(/\*([^*]+)\*/g, '<i>$1</i>');
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    };
    return (
        <div className="my-2 text-sm text-black leading-relaxed">{renderMarkdown(content)}</div>
    );
}

// Block renderer
function renderBlock(block: { type: string; content: string }, idx: number) {
    switch (block.type) {
        case "math":
            return <MathBlock key={idx} content={block.content} />;
        case "code":
            return <CodeBlock key={idx} content={block.content} />;
        case "image":
            return <ImageBlock key={idx} content={block.content} />;
        case "question":
            return <QuestionBlock key={idx} content={block.content} />;
        case "svg":
            return <SVGBlock key={idx} content={block.content} />;
        default:
            return <TextBlock key={idx} content={block.content} />;
    }
}

// --- Main NotesNode Component ---

export function NotesNode({
    data,
}: NodeProps<NotesNodeType>) {

    // Pagination state
    const [pageIdx, setPageIdx] = useState(0);

    // Memoize pages for performance
    const pages = useMemo(() => {
        if (Array.isArray(data.pages) && data.pages.length > 0) {
            return data.pages;
        }
        // Fallback demo page
        return [
            {
                page: 1,
                blocks: [
                    {
                        type: "text",
                        content: `Welcome to your notes on "${data.subject}" for the ${data.exam} exam!`,
                    },
                    {
                        type: "math",
                        content: "E = mc^2",
                    },
                    {
                        type: "code",
                        content: `def energy(mass, c):\n    return mass * c ** 2\n\nprint(energy(2, 3e8))  # Example usage`,
                    },
                    {
                        type: "image",
                        content: "A detailed diagram of Einstein standing at a chalkboard, writing E=mc^2, in a classroom setting.",
                    },
                    {
                        type: "question",
                        content: "Q: What does 'c' represent in the equation E = mc^2?|A: The speed of light in vacuum.",
                    },
                    {
                        type: "text",
                        content: "Keep exploring for more interactive content!",
                    },
                ],
            },
        ];
    }, [data.pages, data.subject, data.exam]);

    const currentPage = pages[pageIdx];

    // Pagination controls
    const canPrev = pageIdx > 0;
    const canNext = pageIdx < pages.length - 1;

    // Download as JSON
    const handleDownload = () => {
        // Create a styled HTML content for PDF
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${data.subject || "Notes"}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
                    h1 { color: #6366f1; margin-bottom: 10px; }
                    h2 { color: #4f46e5; margin-top: 30px; }
                    .page { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
                    .block { margin: 15px 0; }
                    .math { background: #f9fafb; padding: 10px; border-radius: 5px; font-family: monospace; }
                    .code { background: #f1f5f9; padding: 10px; border-radius: 5px; font-family: monospace; white-space: pre; }
                    .question { background: #f0f9ff; padding: 10px; border-radius: 5px; }
                    .answer { color: #0369a1; font-style: italic; margin-top: 5px; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
                </style>
            </head>
            <body>
                <h1>${data.subject || "Study Notes"}</h1>
                <p><strong>Exam:</strong> ${data.exam || "N/A"}</p>
                
                ${pages.map((page, pageIndex) => `
                    <div class="page">
                        <h2>Page ${pageIndex + 1}</h2>
                        ${page.blocks?.map(block => {
            if (block.type === "text") {
                return `<div class="block">${block.content}</div>`;
            } else if (block.type === "math") {
                return `<div class="block math">${block.content}</div>`;
            } else if (block.type === "code") {
                return `<div class="block code">${block.content}</div>`;
            } else if (block.type === "image") {
                return `<div class="block"> <img src="${block.content}" alt="Note visual" class="max-h-[600px] rounded shadow border border-blue-200 dark:border-blue-700" loading="lazy" /></div>`;
            } else if (block.type === "question") {
                const parts = block.content.split('|');
                return `<div class="block question">
                                    <div>${parts[0]}</div>
                                    ${parts[1] ? `<div class="answer">${parts[1]}</div>` : ''}
                                </div>`;
            }
            return '';
        }).join('') || '<p>No content for this page.</p>'}
                    </div>
                `).join('')}
                
                <div class="footer">Generated from ${data.subject || "Study Notes"} - ${new Date().toLocaleDateString()}</div>
            </body>
            </html>
        `;

        // Convert HTML to PDF using browser's print functionality
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(htmlContent);
        printWindow?.document.close();

        // Add a small delay to ensure styles are loaded
        setTimeout(() => {
            printWindow?.print();
            // Close the window after print dialog is closed (optional)
            printWindow?.addEventListener('afterprint', () => {
                printWindow?.close();
            });
        }, 500);
    };

    // Progress bar
    const progress = ((pageIdx + 1) / pages.length) * 100;

    return (
        <Card className="rounded-md p-4 border border-border w-[600px] shadow-md relative bg-gray-100 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
            {/* Header */}
            <div className=" flex items-center justify-between gap-2">
                <div className="flex-1">
                    <div className="font-bold text-base truncate text-primary">{data.subject}</div>
                    <div className="text-xs text-muted-foreground truncate">
                        {data.exam}
                    </div>
                </div>
                <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
                    title="Download notes as PDF"
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                    <span>Download</span>
                </Button>
            </div>

            {/* Progress bar */}

            {/* Page content */}
            <div className="bg-white rounded-md p-4 space-y-2 mb-3">
                {/* Page header if needed */}
                {pages.length > 1 && (
                    <div className="text-xs text-muted-foreground mb-3 text-center">
                        Page {pageIdx + 1} of {pages.length}
                    </div>
                )}

                <div className="min-h-[200px] overflow-y-auto space-y-2">
                    {currentPage?.blocks && currentPage?.blocks?.length > 0 ? (
                        <>
                            {/* Render images and SVGs first */}
                            <div className="space-y-2">
                                {currentPage.blocks
                                    .filter(block => block.type === 'image' || block.type === 'svg')
                                    .map((block, idx) => (
                                        <div key={`visual-${idx}`} className="animate-fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
                                            {renderBlock(block, idx)}
                                        </div>
                                    ))}
                            </div>

                            {/* Render other content */}
                            <div className="space-y-2">
                                {currentPage.blocks
                                    .filter(block => block.type !== 'image' && block.type !== 'svg')
                                    .map((block, idx) => (
                                        <div key={`content-${idx}`} className="animate-fadeIn" style={{ animationDelay: `${(idx + currentPage.blocks.filter(b => b.type === 'image' || b.type === 'svg').length) * 100}ms` }}>
                                            {renderBlock(block, idx)}
                                        </div>
                                    ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-400 italic text-sm my-4 flex items-center justify-center h-full">
                            <div className="text-center">
                                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>No content for this page</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination controls */}
            {pages.length > 1 && (
                <div className="flex items-center justify-between mt-2 px-2">
                    <Button
                        onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
                        disabled={!canPrev}
                        variant="outline"
                        size={"lg"}
                        className="flex items-center gap-1 hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
                    >

                        <span>Previous</span>
                    </Button>

                    <div className="flex items-center gap-2">
                        {pages.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setPageIdx(idx)}
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${pageIdx === idx
                                    ? 'bg-primary scale-125 shadow-sm'
                                    : 'bg-gray-300 dark:bg-gray-700 hover:bg-primary/50 hover:scale-110'
                                    }`}
                                aria-label={`Go to page ${idx + 1}`}
                            />
                        ))}
                    </div>

                    <Button
                        onClick={() => setPageIdx((i) => Math.min(pages.length - 1, i + 1))}
                        disabled={!canNext}
                        variant="purple"
                        size={"lg"}
                        className="flex items-center gap-1 hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
                        aria-label="Next page"
                    >
                        <span>Next</span>

                    </Button>
                </div>
            )}

            {/* Node handles */}
            <Handle
                type="source"
                position={Position.Right}
                className="!bg-primary !border-2 !border-background !w-3 !h-3"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-blue-500 !border-2 !border-background !w-3 !h-3"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
        </Card>
    );
}

export default NotesNode;