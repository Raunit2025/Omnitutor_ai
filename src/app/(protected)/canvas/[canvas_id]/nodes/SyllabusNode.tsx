import React, { useState, useEffect } from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { type SyllabusNodeData, type SyllabusNodeType } from '.'
import { Handle, type NodeProps, Position, useReactFlow } from '@xyflow/react'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import { TOPIC_LIMITS } from '@/constants/limits'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
const SyllabusNode = ({
    data,
}: NodeProps<SyllabusNodeType>) => {
    const { getNodes, setNodes } = useReactFlow();
    const nodes = getNodes();

    const { data: userData } = api.user.getUser.useQuery();
    const [selectedTopicsCount, setSelectedTopicsCount] = useState(0);
    const [showAllChapters, setShowAllChapters] = useState(false);

    useEffect(() => {
        // Count selected topics when component mounts or nodes change
        const node = nodes.find(n => n.type === "syllabus-node");
        if (node) {
            const nodeData = node.data as SyllabusNodeData;
            const count = nodeData.chapters.flatMap(chapter =>
                chapter.topics.filter(topic => topic.selected)).length;
            setSelectedTopicsCount(count);
        }
    }, [nodes]);

    const isChapterSelected = (name: string): boolean => {
        const node = nodes.find(n => n.type === "syllabus-node")
        if (node) {
            const nodeData = node.data as SyllabusNodeData;
            const selectedTopics = nodeData.chapters.flatMap(chapter =>
                chapter.topics.filter(topic => topic.selected)).map(topic => topic.name);
            const chapterTopics = nodeData.chapters.find(chapter =>
                chapter.name === name)?.topics.map(topic => topic.name) || [];

            // Check if all chapter topics are selected and the chapter has topics
            return chapterTopics.length > 0 &&
                chapterTopics.every(topic => selectedTopics.includes(topic));
        }
        return false;
    }

    const handleTopicToggle = (name: string): void => {
        const node = nodes.find(n => n.type === "syllabus-node");
        if (node) {
            const nodeData = { ...node.data } as SyllabusNodeData;

            // Find if the topic is currently selected
            const isTopicSelected = nodeData.chapters.some(chapter =>
                chapter.topics.some(topic => topic.name === name && topic.selected)
            );

            // If user has free plan and trying to select more than 3 topics
            if (userData?.plan === 'free' && !isTopicSelected && selectedTopicsCount >= TOPIC_LIMITS[userData?.plan as keyof typeof TOPIC_LIMITS]) {
                toast.error("Free plan allows maximum 3 topics. Please upgrade for more.");
                return;
            }

            const updatedChapters = nodeData.chapters.map(chapter => ({
                ...chapter,
                topics: chapter.topics.map(topic => ({
                    ...topic,
                    selected: topic.name === name ? !topic.selected : topic.selected
                }))
            }));

            // Create a new data object to ensure proper state update
            const updatedData = {
                ...nodeData,
                chapters: updatedChapters
            };

            setNodes(nodes.map(n => n.id === node.id ? { ...n, data: updatedData } : n));
        }
    }

    const handleChapterToggle = (chapterName: string): void => {
        const node = nodes.find(n => n.type === "syllabus-node");
        if (node) {
            const nodeData = { ...node.data } as SyllabusNodeData;
            const isAllSelected = isChapterSelected(chapterName);

            // If deselecting, we don't need to check limits
            if (isAllSelected) {
                const updatedChapters = nodeData.chapters.map(chapter => {
                    if (chapter.name === chapterName) {
                        return {
                            ...chapter,
                            topics: chapter.topics.map(topic => ({
                                ...topic,
                                selected: false
                            }))
                        };
                    }
                    return chapter;
                });

                const updatedData = {
                    ...nodeData,
                    chapters: updatedChapters
                };

                setNodes(nodes.map(n => n.id === node.id ? { ...n, data: updatedData } : n));
                return;
            }

            // If selecting and user has free plan, check if it would exceed 3 topics
            if (userData?.plan === 'free') {
                const chapter = nodeData.chapters.find(c => c.name === chapterName);
                const unselectedTopicsCount = chapter?.topics.filter(t => !t.selected).length || 0;

                if (selectedTopicsCount + unselectedTopicsCount > TOPIC_LIMITS[userData?.plan as keyof typeof TOPIC_LIMITS]) {
                    toast.error("Free plan allows maximum 3 topics. Please upgrade for more.");
                    return;
                }
            }

            // Toggle all topics in the chapter
            const updatedChapters = nodeData.chapters.map(chapter => {
                if (chapter.name === chapterName) {
                    return {
                        ...chapter,
                        topics: chapter.topics.map(topic => ({
                            ...topic,
                            selected: true
                        }))
                    };
                }
                return chapter;
            });

            const updatedData = {
                ...nodeData,
                chapters: updatedChapters
            };

            setNodes(nodes.map(n => n.id === node.id ? { ...n, data: updatedData } : n));
        }
    }

    useEffect(() => {
        if (selectedTopicsCount > 5) {
            const node = nodes.find(n => n.type === "syllabus-node");
            if (node) {
                setNodes(nodes.map(n => n.id === node.id ? {
                    ...n,
                    data: {
                        ...n.data,
                        chapters: (n.data as SyllabusNodeData).chapters.map((chapter: {
                            name: string;
                            topics: {
                                name: string;
                                selected: boolean;
                            }[];
                        }) => ({
                            ...chapter,
                            topics: chapter.topics.map((topic: {
                                name: string;
                                selected: boolean;
                            }) => ({
                                ...topic,
                                selected: false
                            }))
                        }))
                    }
                } : n));
            }
        }
    }, [userData?.plan, nodes.length])

    // Determine which chapters to display
    const chaptersToDisplay = showAllChapters ? data.chapters : data.chapters.slice(0, 5);
    const hasMoreChapters = data?.chapters?.length > 5;

    return (
        <Card className="rounded-lg p-8 w-[600px] relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-[var(--color-purple)] p-4 rounded-lg transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
                <h2 className="text-2xl text-white">{data.subject} | Syllabus</h2>
            </div>

            <div className="flex justify-between mt-4 transition-opacity duration-300">
                <p className="text-sm">Select the topics you want to cover in this session</p>
                {userData?.plan === 'free' && (
                    <p className="text-[#A99AFD] text-sm transition-colors duration-200 hover:text-[#8B7FEB]">
                        {selectedTopicsCount}/{TOPIC_LIMITS[userData?.plan as keyof typeof TOPIC_LIMITS]} topics selected
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-4 mt-4">
                {data?.chapters?.length > 0 ? (
                    <>
                        <Accordion type="multiple" className="w-full">
                            {chaptersToDisplay.map((chapter, index) => (
                                <AccordionItem
                                    key={chapter.name}
                                    value={chapter.name}
                                    className="border bg-gray-100 rounded-xl px-4 py-2 mb-4 transition-all duration-300 hover:border-[#A99AFD] hover:shadow-[0_0_20px_rgba(169,154,253,0.2)] hover:bg-gray-50 animate-in fade-in slide-in-from-left duration-500"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <AccordionTrigger className="hover:no-underline transition-transform duration-200 hover:translate-x-1">
                                        <div className="w-full pr-4 flex items-start gap-2">
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    type="checkbox"
                                                    className="w-5 h-5 accent-[#A99AFD] rounded-md cursor-pointer transition-all duration-200 hover:scale-110 transform"
                                                    checked={isChapterSelected(chapter.name)}
                                                    onChange={() => handleChapterToggle(chapter.name)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex flex-col">
                                                    <p className="font-normal transition-colors duration-200   text-lg">{chapter.name}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="bg-[#F9FFE8] border border-[#CDCBCB] px-2 py-1 rounded-full font-normal text-sm transition-all duration-200 hover:bg-[#F5F8E4] hover:shadow-sm">
                                                        Chapter {index + 1}
                                                    </p>
                                                    <p className="bg-[#F9FFE8] border border-[#CDCBCB] px-2 py-1 rounded-full font-normal text-sm transition-all duration-200 hover:bg-[#F5F8E4] hover:shadow-sm">
                                                        {chapter.topics.length} topics
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 border-t-2 animate-in slide-in-from-top duration-300">
                                        {chapter.topics.length > 0 ? (
                                            <div className="flex flex-col gap-2 ml-4 mt-2">
                                                {chapter.topics.map((topic, topicIndex) => (
                                                    <label
                                                        key={topic.name}
                                                        className={`flex items-center gap-3 text-base cursor-pointer p-2 rounded-md transition-all duration-300 hover:translate-x-1  animate-in fade-in slide-in-from-left ${topic.selected
                                                            ? 'bg-secondary '
                                                            : ''
                                                            }`}
                                                        style={{ animationDelay: `${topicIndex * 50}ms` }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="accent-[#A99AFD] w-4 h-4 rounded-sm transition-all duration-200 hover:scale-110 transform"
                                                            checked={topic.selected}
                                                            onChange={() => handleTopicToggle(topic.name)}
                                                        />
                                                        <span className="">{topic.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 ml-4 mt-2 p-3 bg-[#2A2A2A] rounded-md flex items-center justify-center transition-all duration-300 hover:bg-[#333333] animate-in fade-in duration-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform duration-300 hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="transition-opacity duration-300">No topics available for this chapter</span>
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        {hasMoreChapters && (
                            <div className="flex justify-center mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAllChapters(!showAllChapters)}
                                    className="transition-all duration-300 hover:bg-[#A99AFD] hover:text-white"
                                >
                                    {showAllChapters ? 'Show Less' : `View All Chapters (${data.chapters.length - 5} more)`}
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="h-56 flex items-center justify-center text-gray-500 animate-in fade-in duration-700">
                        <span className="transition-opacity duration-300">No topics available yet</span>
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!bg-[#A99AFD] !border-2 !border-white transition-all duration-300 hover:!bg-[#8B7FEB] hover:scale-110 hover:shadow-lg"
            />
        </Card>
    )
}

export default SyllabusNode