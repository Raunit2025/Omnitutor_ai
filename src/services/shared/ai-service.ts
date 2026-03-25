import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

// Shared schemas for AI operations
export const NoteBlockSchema = z.object({
    type: z.enum([
        'text', 'math', 'code', 'list', 'quote', 'image',
        'question', 'video', 'follow_up', 'svg'
    ]),
    content: z.string().min(1, "Block content cannot be empty")
});

export const PagedNoteSchema = z.object({
    page: z.number().int().nonnegative(),
    blocks: z.array(NoteBlockSchema)
});

export const FullNotesSchema = z.object({
    subject: z.string(),
    exam: z.string(),
    country_name: z.string(),
    current_role: z.string(),
    level: z.string(),
    mode: z.string(),
    preferred_language: z.string().optional(),
    chapters: z.string(),
    topics: z.string(),
    pages: z.array(PagedNoteSchema)
});

export const SyllabusSchema = z.object({
    subject: z.string(),
    for: z.string(),
    exam: z.string(),
    chapters: z.array(
        z.object({
            name: z.string(),
            topics: z.array(z.object({
                name: z.string(),
                selected: z.boolean().default(false)
            }))
        })
    )
});

export const TestSchema = z.object({
    testName: z.string(),
    chapters: z.string(),
    topics: z.string(),
    level: z.union([z.literal('easy'), z.literal('medium'), z.literal('hard'), z.string()]),
    assignmentType: z.literal('mcq'),
    correctAnswered: z.number().default(0),
    incorrectAnswered: z.number().default(0),
    skipped: z.number().default(0),
    questions: z.array(
        z.object({
            question: z.string(),
            options: z.array(z.string()),
            correctAnswer: z.string(),
            selectedAnswer: z.string(),
            ques_type: z.union([z.literal('mcq'), z.string()]),
            explanation: z.string()
        })
    ),
    duration: z.number()
});

export const ChatNodeSchema = z.object({
    header: z.string().describe('A 5-10 word header for the conversation.'),
    body: z.array(z.object({
        type: z.string().describe('type of the block like text, svg etc.'),
        content: z.string().describe('describe the content in 2-3 sentences and keep it short')
    })).describe(`keep only 3-4 body blocks at a time and keep it short and concise, and keep it relevant to the conversation`),
    footer: z.array(z.object({
        type: z.string().describe('type of the block like text.'),
        content: z.string().describe('describe the content in 2-3 sentences and keep it short')
    })).describe('Use this as a footer for examples (if any) and questions for proceeding conversations. keep it short and concise, and keep it relevant to the conversation'),
});

export const StudySlideElementSchema = z.object({
    type: z.enum(['text', 'google_images', 'ai_images', 'image', 'audio', 'video', 'svg', 'code', 'question']).describe('type of the block like text, image, audio, video, svg, code, question'),
    content: z.string().describe('content of the block'),
    options: z.object({
        fontSize: z.number().optional(),
        bold: z.boolean().optional(),
        align: z.enum(['left', 'center', 'right']).optional(),
        h: z.string().optional(),
        w: z.string().optional()
    }).optional().describe('options of the block like fontSize, bold, align, h, w'),
});

export const StudySlideSchema = z.object({
    id: z.number().describe('id of the slide'),
    title: z.string().describe('title of the slide'),
    elements: z.array(StudySlideElementSchema).describe('elements of the slide'),
    audio: z.string().optional().describe('audio of the slide'),
});

export const StudySlidesResponseSchema = z.object({
    title: z.string().describe('title of the slides'),
    slides: z.array(StudySlideSchema).describe('slides of the topic')
});
export type SyllabusResponse = {
    subject: string;
    for: string;
    exam: string;
    chapters: {
        name: string;
        topics: {
            name: string;
            selected: boolean;
        }[];
    }[];
}
export interface StudySlidesResponse {
    title: string;
    slides: z.infer<typeof StudySlideSchema>[];
}


export interface StudySlidesHtmlResponse {
    title: string;
    slides: (z.infer<typeof StudySlideSchema> & { html: string })[];
}

// Type definitions
interface GenerateStudySlideOptions {
    estimatedTime: number;
    topic: string;
    target: string;
    userData: UserData;
}

interface GenerateSyllabusOptions {
    topic: string;
    target: string;
    userData: UserData;
}

interface FileContent {
    type: 'file';
    data: string;
    mimeType: string;
}

interface UserData {
    name: string;
    current_role: string;
    current_course: string;
    country_name: string;
}

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface AIContext {
    target?: string;
    topic?: string;
    estimatedTime?: number;
    level?: string;
    numberOfQuestions?: number;
}

interface GenerateChatOptions {
    userData: UserData;
    files?: FileContent[];
    messages: ChatMessage[];
    isInitialSession?: boolean;
    context?: AIContext;

}

interface GenerateNotesOptions {
    userData: UserData;
    files?: FileContent[];
    messages: ChatMessage[];
    context: AIContext;
}

interface GenerateTestOptions {
    userData: UserData;
    files?: FileContent[];
    messages: ChatMessage[];
    context: AIContext
}

interface ChatResponseBlock {
    type: string;
    content: string;
}

interface ChatResponse {
    header: string;
    body: ChatResponseBlock[];
    footer: ChatResponseBlock[];
}

interface NotesPage {
    page: number;
    blocks: Array<{ type: string; content: string }>;
}

interface NotesResponse {
    pages: NotesPage[];
    [key: string]: unknown;
}

interface GoogleSearchResponse {
    items?: Array<{ link: string }>;
}

export class AIService {
    private static instance: AIService;

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    private getBaseSystemPrompt(userData: UserData, context?: AIContext): string {
        return `
            You are the best in the world at tutoring, your students loves you and you are the best at what you do. 
            You are also a great teacher and you are able to explain complex concepts in a way that is easy to understand. 
            You always use analogies and real life examples to explain the concepts like you are teaching a 10 year old child.
            
            Student Profile:
            - Name: ${userData.name}
            - Role: ${userData.current_role}
            - Course: ${userData.current_course}
            - Country: ${userData.country_name}
            ${context?.target ? `- Target: ${context.target}` : ''}
            ${context?.topic ? `- Topic: ${context.topic}` : ''}
            
            ## Block Types & Guidelines
            - **text**: Clear explanations with concrete examples and analogies with human readable format not in latex at all make it in markdown format
            - **math**: they should be in human readable format not in latex
            - **code**: Well-commented code examples in the preferred language
            - **list**: Organized bullet points for key concepts, steps, or properties
            - **quote**: Memorable insights, tips, or real-world applications
            - **question**: Practice questions with varying difficulty levels
            - **example**: Well-commented code examples in easy to understand format
            - **follow_up**: follow up questions for proceeding conversations.
            - **svg**: Use for diagrams, animations, or visualizations that require custom creation (like animated mathematical concepts, flow charts, process diagrams). SVG code must be perfect, accurate, and use dark colors suitable for light backgrounds. Include animations where they enhance understanding.
            - **image**: Use for readily available visual content (like maps, anatomical diagrams, historical figures, or standard illustrations). Provide a specific, optimized Google search query that would return the most relevant image for the content.

            Important: use as much images and diagrams as possible to make it more engaging and interactive.
        `;
    }

    async generateChatResponse(options: GenerateChatOptions): Promise<ChatResponse> {
        const { userData, files = [], messages, isInitialSession = false, context } = options;

        const systemPrompt = this.getBaseSystemPrompt(userData, context);

        // Create content array with text and files
        const createContentArray = (text: string) => [
            { type: 'text', text },
            ...files
        ];

        // Prepare messages for AI API
        const apiMessages: Array<{
            role: 'user' | 'assistant' | 'system';
            content: string | Array<{ type: string; text: string } | FileContent>;
        }> = [];

        if (isInitialSession) {
            const userMessage = `My name is ${userData.name} and I am a ${userData.current_role} doing ${userData.current_course} from ${userData.country_name}. ${files.length > 0 ? 'I want to learn by including attached documents information.' : ''} Hope you will teach me like a great tutor with analogies and real life examples.`;

            apiMessages.push({
                role: 'user',
                content: createContentArray(userMessage)
            });
        } else {
            // Convert conversation messages
            const conversationMessages = messages.slice(0, -1);
            conversationMessages.forEach(msg => {
                apiMessages.push({
                    role: msg.role,
                    content: msg.content
                });
            });

            // Add latest message with files
            const latestMessage = messages[messages.length - 1];
            if (latestMessage) {
                apiMessages.push({
                    role: 'user',
                    content: createContentArray(latestMessage.content)
                });
            }
        }

        const { object } = await generateObject({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            messages: apiMessages as Parameters<typeof generateObject>[0]['messages'],
            schema: ChatNodeSchema,
        });

        const processedObject = await this.processImageBlocks(object as ChatResponse);
        return await this.processSvgs(processedObject);
    }

    async generateNotes(options: GenerateNotesOptions): Promise<NotesResponse> {
        const { userData, files = [], messages = [], context } = options;

        const { object } = await generateObject({
            model: google('gemini-2.5-flash', {
                useSearchGrounding: true,
            }),
            schema: FullNotesSchema,
            system: `
                You are an expert educator and technical content creator. 
                Your task is to generate clear, structured, and interactive study notes for a canvas-based AI Tutor app. 
                The notes should be highly engaging, modular, and suitable for both UI rendering and export to PDF.
                
                Student: ${userData.name} (${userData.current_role})
                ${context.target ? `Target: ${context.target}` : ''}
                ${context.topic ? `Topic: ${context.topic}` : ''}
                ${context.estimatedTime ? `Time: ${context.estimatedTime} minutes` : ''}
       
            ## Block Types & Guidelines
            - **text**: Clear explanations with concrete examples and analogies with human readable format not in latex at all make it in markdown format
            - **math**: they should be in human readable format not in latex
            - **code**: Well-commented code examples in the preferred language
            - **list**: Organized bullet points for key concepts, steps, or properties
            - **quote**: Memorable insights, tips, or real-world applications
            - **question**: Practice questions with varying difficulty levels
            - **example**: Well-commented code examples in easy to understand format
            - **follow_up**: follow up questions for proceeding conversations.
            - **svg**: Use for diagrams, animations, or visualizations that require custom creation (like animated mathematical concepts, flow charts, process diagrams). SVG code must be perfect, accurate, and use dark colors suitable for light backgrounds. Include animations where they enhance understanding.
            - **image**: Use for readily available visual content (like maps, anatomical diagrams, historical figures, or standard illustrations). Provide a specific, optimized Google search query that would return the most relevant image for the content.

                Important: use as much images and diagrams as possible to make it more engaging and interactive.
                
             ## Context Reference
                        Previous conversation context (for understanding student's knowledge level only):
                        ${messages.length > 0 ? JSON.stringify(messages) : 'No previous context'}
                        
                        Note: Use this context only to gauge the student's understanding level. Do not base notes directly on previous messages or create notes that reference prior conversations.
                      
                Create comprehensive notes that adapt to the student's level and include practical examples.
            `,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Create detailed study notes for the specified topic. Include visual elements, examples, and practice questions.`,
                        },
                        ...files,
                    ],
                },
            ],
        });

        return await this.processNotesImages(object as NotesResponse);
    }

    async generateTest(options: GenerateTestOptions) {
        const { userData, files = [], messages = [], context } = options;

        const { object } = await generateObject({
            model: google('gemini-2.5-flash', {
                useSearchGrounding: true,
            }),
            schema: TestSchema,
            messages: [
                {
                    role: 'system',
                    content: `
                        You are an expert test creator and educational assessment specialist. Create comprehensive, well-structured MCQ tests that appropriately challenge students while being fair and educational.
                        
                        ## Student Profile
                        - Name: ${userData.name}
                        - Role: ${userData.current_role}
                        - Course: ${userData.current_course}
                        - Country: ${userData.country_name}
                        
                        ## Test Parameters
                        - Target: ${context.target || 'General Assessment'}
                        - Topic: ${context.topic || 'Comprehensive Review'}
                        - Difficulty Level: ${context.level || 'medium'}
                        - Number of Questions: ${context.numberOfQuestions || 10}
                        - Estimated Duration: ${context.estimatedTime || 20} minutes
                        
                        ## Test Creation Guidelines
                        1. **Question Quality**: Each question should test understanding, not just memorization
                        2. **Option Variety**: Provide 4 distinct, plausible options with one clearly correct answer
                        3. **Difficulty Distribution**: Balance easy, medium, and hard questions appropriately
                        4. **Clear Language**: Use precise, unambiguous wording
                        5. **Comprehensive Coverage**: Cover different aspects of the topic
                        6. **Educational Value**: Include detailed explanations that teach concepts
                        
                        ## Context Reference
                        Previous conversation context (for understanding student's knowledge level only):
                        ${messages.length > 0 ? JSON.stringify(messages) : 'No previous context'}
                        
                        Note: Use this context only to gauge the student's understanding level. Do not base test questions directly on previous messages or create questions that reference prior conversations.
                        
                        Create an engaging, educational test that challenges the student appropriately while maintaining academic rigor.
                    `,
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Create a ${context.level} difficulty MCQ test with ${context.numberOfQuestions || 10} questions covering ${context.topic}. Each question should have 4 unique options with clear explanations.`,
                        },
                        ...files,
                    ],
                },
            ],
        });

        return object;
    }

    async generateSimpleText(prompt: string, files: FileContent[] = []): Promise<string> {
        const { text } = await generateText({
            model: google('gemini-2.5-flash'),
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: prompt,
                        },
                        ...files,
                    ],
                },
            ],
        });

        return text;
    }

    private async processImageBlocks(object: ChatResponse): Promise<ChatResponse> {
        const processBlocks = async (blocks: ChatResponseBlock[]): Promise<ChatResponseBlock[]> => {
            return Promise.all(blocks.map(async (block) => {
                if (block.type === 'image') {
                    try {
                        const response = await fetch(
                            `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH}&cx=24f8c1309bf1f4dd7&q=${block.content}&searchType=image&num=1`
                        );
                        const data = await response.json() as GoogleSearchResponse;
                        const imageUrl = data.items?.[0]?.link;

                        return {
                            ...block,
                            content: imageUrl || block.content
                        };
                    } catch (error) {
                        console.error('Error fetching image:', error);
                        return block;
                    }
                }
                return block;
            }));
        };

        return {
            ...object,
            body: await processBlocks(object.body || []),
            footer: await processBlocks(object.footer || []),
        };
    }
    private async processSvgs(object: ChatResponse): Promise<ChatResponse> {
        const processBlocks = async (blocks: ChatResponseBlock[]): Promise<ChatResponseBlock[]> => {
            return Promise.all(blocks.map(async (block) => {
                if (block.type === 'svg') {
                    try {
                        const { object: svgObject } = await generateObject({
                            model: google('gemini-2.5-flash'),
                            prompt: `Create a perfect SVG diagram based on this description: ${block.content}
                            
                            Requirements:
                            - Generate complete, valid SVG code
                            - Use dark colors suitable for light backgrounds
                            - Optimize for container dimensions (max-width: 1000px, max-height: 600px)
                            - Include proper viewBox for responsive scaling
                            - Use clear, readable labels and text
                            - Include animations where they enhance understanding
                            - Make it educational and visually appealing
                            - Ensure all elements are properly sized and positioned`,
                            schema: z.object({
                                svgCode: z.string().describe('Complete, valid SVG code for the diagram')
                            }),
                        });

                        return {
                            ...block,
                            content: svgObject.svgCode
                        };
                    } catch (error) {
                        console.error('Error generating SVG:', error);
                        return block;
                    }
                }
                return block;
            }));
        };

        return {
            ...object,
            body: await processBlocks(object.body || []),
            footer: await processBlocks(object.footer || []),
        };
    }

    private async processNotesImages(object: NotesResponse): Promise<NotesResponse> {
        return {
            ...object,
            pages: await Promise.all(object.pages.map(async (page) => ({
                ...page,
                blocks: await Promise.all(page.blocks.map(async (block) => {
                    if (block.type === 'image') {
                        try {
                            const response = await fetch(
                                `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH}&cx=24f8c1309bf1f4dd7&q=${block.content}&searchType=image&num=1`
                            );
                            const data = await response.json() as GoogleSearchResponse;
                            const imageUrl = data.items?.[0]?.link;

                            return {
                                ...block,
                                content: imageUrl || block.content
                            };
                        } catch (error) {
                            console.error('Error generating image:', error);
                            return block;
                        }
                    }
                    return block;
                }))
            })))
        };
    }

    extractTextFromObject(object: ChatResponse): string {
        return object.body
            .filter(block => !['svg', 'image', 'video'].includes(block.type))
            .map(block => block.content)
            .join("\n") +
            "\n" +
            object.footer
                .filter(block => !['svg', 'image', 'video'].includes(block.type))
                .map(block => block.content)
                .join("\n");
    }
    async generateStudySlide(options: GenerateStudySlideOptions): Promise<StudySlidesResponse> {
        const { target, topic, userData, estimatedTime } = options;

        const systemPrompt = this.getBaseSystemPrompt(userData);

        const { object } = await generateObject({
            model: google('gemini-2.5-flash', {
                useSearchGrounding: true,
            }),
            system: systemPrompt,
            prompt: `Create comprehensive, engaging study slides for "${topic}" targeting ${target} level, designed for ${estimatedTime} minutes of study time.

            ## Content Strategy
            - Break down complex concepts into digestible, slide-sized chunks
            - Use progressive disclosure: start with overview, then dive into details
            - Include real-world applications and relatable analogies
            - Balance theoretical knowledge with practical examples
            - Ensure logical flow between slides for optimal learning progression

            ## Visual Enhancement Guidelines
            - **Prioritize Visual Learning**: Include diagrams, images, or SVGs on every slide where applicable
            - **Google Images**: Use specific, educational search queries (e.g., "mitochondria diagram labeled", "Renaissance art examples", "chemical bonding molecular structure")
            - **SVG Diagrams**: Create detailed, accurate visualizations with specific descriptions:
              * Process flows: "step-by-step diagram showing [process] with numbered stages and directional arrows"
              * Concept maps: "hierarchical diagram illustrating [concept] relationships with connecting lines and labels"
              * Mathematical visualizations: "graph displaying [function/equation] with clearly marked axes, scales, and key points"
              * Scientific illustrations: "cross-section diagram of [structure] with anatomical labels and color coding"

            ## Technical Specifications
            - **Container Constraints**: Max width 1000px, max height 600px per slide
            - **Responsive Design**: Use percentage-based sizing and flexible layouts
            - **Typography**: Maintain readability with appropriate font sizes (min 14px for body text)
            - **Content Density**: Limit to 3-5 key points per slide to avoid cognitive overload
            - **Accessibility**: Ensure sufficient color contrast and alternative text descriptions

            ## Quality Assurance
            - Verify all image search queries are specific and educational
            - Ensure SVG descriptions are technically accurate and implementable
            - Cross-reference content accuracy with established educational sources
            - Maintain consistency in terminology and visual style across slides
            - Include slide transitions that support learning flow

            ## Learning Depth Requirements
            - **Comprehensive Coverage**: These slides are for active learning, not quick revision - provide thorough explanations
            - **Progressive Complexity**: Start with foundational concepts and build to advanced applications
            - **Deep Understanding**: Include underlying principles, mechanisms, and theoretical frameworks
            - **Critical Thinking**: Incorporate analysis, synthesis, and evaluation opportunities
            - **Practical Application**: Show how concepts apply in real-world scenarios and professional contexts
            - **Interconnections**: Highlight relationships between different concepts and topics
            - **Mastery-Oriented**: Design content to achieve genuine understanding at the specified target level
            - **Target Level**: ${target}
            - **Topic**: ${topic}
            - **Estimated Time**: ${estimatedTime ?? 10} minutes
            
            
            
            Generate slides that transform passive reading into active, visual learning experiences.`,

            schema: StudySlidesResponseSchema,
        });


        const processedSlides = await this.processStudySlideGoogleImages(object);
        const svgProcessedSlides = await this.processStudySlideSvgs(processedSlides);
        // const vertexProcessedSlides = await this.processStudySlideVertexImages(svgProcessedSlides);
        return svgProcessedSlides;
    }

    async generateSyllabus(options: GenerateSyllabusOptions): Promise<SyllabusResponse> {
        const { topic, target, userData } = options;

        const { object: syllabus } = await generateObject({
            model: google('gemini-2.5-flash', {
                useSearchGrounding: true,
            }),
            schema: SyllabusSchema,
            prompt: `Generate a comprehensive and structured syllabus for the topic "${topic}" at ${target} level.
            
            Student Context:
            - Role: ${userData.current_role}
            - Course: ${userData.current_course}
            - Country: ${userData.country_name}
            
            Requirements:
            - Organize content into logical chapters and subtopics
            - Ensure appropriate depth and complexity for the target level
            - Include both theoretical foundations and practical applications
            - Structure topics in a progressive learning sequence
            - Consider local educational standards and curriculum requirements
            - Provide a balanced coverage of all essential concepts
            - Mark all topics unselected by default for user to select
            
            The syllabus should be detailed enough to guide a complete learning journey from foundational concepts to advanced understanding.`
        });

        return syllabus;
    }
    extractTextFromStudySlide(object: StudySlidesResponse, page: number = 0): string {
        return object.slides[page]?.elements.filter(element => element.type !== 'svg' && element.type !== 'image' && element.type !== 'video' && element.type !== 'ai_images' && element.type !== 'google_images').map(element => element.content).join("\n") || "";
    }
    private async processStudySlideImages(object: StudySlidesResponse): Promise<StudySlidesResponse> {
        return {
            ...object,
            slides: await Promise.all(object.slides.map(async (slide) => ({
                ...slide,
                elements: await Promise.all(slide.elements.map(async (element) => {
                    if (element.type === 'image') {
                        try {
                            const response = await fetch(
                                `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH}&cx=24f8c1309bf1f4dd7&q=${element.content}&searchType=image&num=1`
                            );
                            const data = await response.json() as GoogleSearchResponse;
                            const imageUrl = data.items?.[0]?.link;

                            return {
                                ...element,
                                content: imageUrl || element.content
                            };
                        } catch (error) {
                            console.error('Error generating image:', error);
                            return element;
                        }
                    }
                    return element;
                }))
            })))
        };
    }
    private async processStudySlideVertexImages(object: StudySlidesResponse): Promise<StudySlidesResponse> {
        return {
            ...object,
            slides: await Promise.all(object.slides.map(async (slide) => ({
                ...slide,
                elements: await Promise.all(slide.elements.map(async (element) => {
                    if (element.type === 'ai_images') {
                        try {
                            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/image/vertex`, {
                                method: 'POST',
                                body: JSON.stringify({
                                    prompt: element.content
                                })
                            });
                            const data = await response.json() as { images: string[] };
                            const imageUrl = data.images.join(", ");

                            return {
                                ...element,
                                content: imageUrl || element.content
                            };
                        } catch (error) {
                            console.error('Error generating image:', error);
                            return element;
                        }
                    }
                    return element;
                }))
            })))
        };
    }

    private async processStudySlideGoogleImages(object: StudySlidesResponse): Promise<StudySlidesResponse> {
        return {
            ...object,
            slides: await Promise.all(object.slides.map(async (slide) => ({
                ...slide,
                elements: await Promise.all(slide.elements.map(async (element) => {
                    if (element.type === 'google_images') {
                        try {
                            const response = await fetch(
                                `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH}&cx=24f8c1309bf1f4dd7&q=${element.content}&searchType=image&num=3`
                            );
                            const data = await response.json() as GoogleSearchResponse;
                            const imageUrl = data.items?.[0]?.link + ", " + data.items?.[1]?.link + ", " + data.items?.[2]?.link;

                            return {
                                ...element,
                                content: imageUrl || element.content
                            };
                        } catch (error) {
                            console.error('Error generating image:', error);
                            return element;
                        }
                    }
                    return element;
                }))
            })))
        };
    }

    private async processStudySlideSvgs(object: StudySlidesResponse): Promise<StudySlidesResponse> {
        return {
            ...object,
            slides: await Promise.all(object.slides.map(async (slide) => ({
                ...slide,
                elements: await Promise.all(slide.elements.map(async (element) => {
                    if (element.type === 'svg') {
                        try {
                            const { object: svgObject } = await generateObject({
                                model: google('gemini-2.5-flash'),
                                prompt: `Create a perfect SVG diagram based on this description: ${element.content}
                                
                                Requirements:
                                - Generate complete, valid SVG code
                                - Use dark colors suitable for light backgrounds
                                - Optimize for container dimensions (max-width: 1000px, max-height: 600px)
                                - Include proper viewBox for responsive scaling
                                - Use clear, readable labels and text
                                - Include animations where they enhance understanding
                                - Make it educational and visually appealing
                                - Ensure all elements are properly sized and positioned`,
                                schema: z.object({
                                    svgCode: z.string().describe('Complete, valid SVG code for the diagram')
                                }),
                            });

                            return {
                                ...element,
                                content: svgObject.svgCode
                            };
                        } catch (error) {
                            console.error('Error generating SVG:', error);
                            return element;
                        }
                    }
                    return element;
                }))
            })))
        };
    }

    async generateStudySlideHtml(options: StudySlidesResponse): Promise<StudySlidesHtmlResponse> {
        const { slides, title } = options;

        const slidesContent = slides.map((slide, index) => {
            const elementsContent = slide.elements.map(element => {
                switch (element.type) {
                    case 'text':
                        return `Text: ${element.content}`;
                    case 'image':
                        return `Image: ${element.content}`;
                    case 'svg':
                        return `SVG Code: ${element.content}`;
                    case 'code':
                        return `Code Block: ${element.content}`;
                    case 'question':
                        return `Question: ${element.content}`;
                    case 'audio':
                        return `Audio: ${element.content}`;
                    case 'video':
                        return `Video: ${element.content}`;
                    default:
                        return `${element.type}: ${element.content}`;
                }
            }).join('\n');

            return `Slide ${index + 1}:
Title: ${slide.title}
Elements:
${elementsContent}
---`;
        }).join('\n\n');

        const prompt = `Convert these slides into beautiful HTML format:

${slidesContent}

For each slide, create beautiful, responsive HTML that incorporates all the elements. 
Use modern CSS styling with gradients, shadows, and animations where appropriate.
Make them visually appealing and educational. Include all SVG code inline.
For images, use the provided URLs as src attributes.
For code blocks, use proper syntax highlighting.

IMPORTANT: Each slide should be contained within appropriate dimensions:
- Maximum width: 100% of container or 1000px
- Maximum height: 600px with overflow handling
- Use responsive design with proper padding and margins
- Ensure content is readable and well-structured within these constraints
- Use flexbox or grid layout for proper spacing
- Include proper viewport meta considerations

Return an array of HTML strings, one for each slide. Each HTML should be complete and self-contained with proper container sizing.`;

        try {
            const { object } = await generateObject({
                model: google('gemini-2.5-flash'),
                prompt,
                schema: z.object({
                    htmlSlides: z.array(z.string()).describe('Array of beautiful HTML code for each slide with proper container sizing')
                }),
            });

            const processedSlides = slides.map((slide, index) => ({
                ...slide,
                html: object.htmlSlides[index] || '<div style="max-width: 1000px; max-height: 600px; padding: 20px; margin: 0 auto; box-sizing: border-box;">Error generating HTML for this slide</div>'
            }));

            return {
                title,
                slides: processedSlides
            };
        } catch (error) {
            console.error('Error generating HTML for slides:', error);
            const fallbackSlides = slides.map((slide) => ({
                ...slide,
                html: '<div style="max-width: 1000px; max-height: 600px; padding: 20px; margin: 0 auto; box-sizing: border-box; display: flex; align-items: center; justify-content: center; background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">Error generating HTML for this slide</div>'
            }));

            return {
                title,
                slides: fallbackSlides
            };
        }
    }

    async generateFunFactsAboutTopic(topic: string): Promise<string[]> {
        const { object } = await generateObject({
            model: google('gemini-2.5-flash'),
            prompt: `Generate fun facts about the topic "${topic}"`,
            schema: z.array(z.string()).describe('Fun facts about the topic'),
        });
        return object;
    }
}
