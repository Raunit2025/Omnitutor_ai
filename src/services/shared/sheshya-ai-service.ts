import { generateObject, generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";


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

// Shared schemas for AI operations
export const NoteBlockSchema = z.object({
    type: z.enum([
        'text', 'math', 'code', 'list', 'quote', 'image',
        'question', 'video', 'follow_up', 'svg', 'activity', 'assessment', 'reflection'
    ]),
    content: z.string().min(1, "Block content cannot be empty"),
    metadata: z.object({
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        estimatedTime: z.number().optional(),
        bloomsLevel: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']).optional(),
        interactionType: z.enum(['individual', 'pair', 'group', 'class']).optional()
    }).optional()
});

// Enhanced schema for 5Es lesson plan structure
export const FiveEsPhaseSchema = z.object({
    phase: z.enum(['engage', 'explore', 'explain', 'elaborate', 'evaluate']),
    title: z.string().describe('Descriptive title for this phase'),
    objectives: z.array(z.string()).describe('Specific learning objectives for this phase'),
    duration: z.number().describe('Duration in minutes for this phase'),
    activities: z.array(z.string()).describe('Activities for this phase'),
    assessment: z.array(z.string()).describe('Assessment for this phase')
});

export const Enhanced5EsLessonPlanSchema = z.object({
    subject: z.string(),
    class: z.string(),
    chapter: z.string(),
    topics: z.string(),
    duration: z.number().describe('Total lesson duration in minutes'),
    // 5Es Phases
    phases: z.array(FiveEsPhaseSchema).length(5).describe('The five phases of the 5Es model'),
});

export const PagedNoteSchema = z.object({
    page: z.number().int().nonnegative(),
    blocks: z.array(NoteBlockSchema)
});

export const FullNotesSchema = z.object({
    subject: z.string(),
    class: z.string(),
    chapter: z.string(),
    topics: z.string(),
    pages: z.array(PagedNoteSchema)
});



export const TestSchema = z.object({
    testName: z.string(),
    chapters: z.string(),
    topics: z.string(),
    class: z.string(),
    subject: z.string(),
    totalMarks: z.number(),
    totalQuestions: z.number(),
    level: z.union([z.literal('easy'), z.literal('medium'), z.literal('hard'), z.string()]),
    testType: z.enum(['mcq', 'short', 'long', 'fill_in_the_blank', 'true_false', 'mix']),
    questions: z.array(
        z.object({
            question: z.string(),
            options: z.array(z.string()),
            correctAnswer: z.string(),
            ques_type: z.enum(['mcq', 'short', 'long', 'fill_in_the_blank', 'true_false'])
        })
    ),
    duration: z.number()
});

interface ChatResponseBlock {
    type: string;
    content: string;
}

interface ChatResponse {
    header: string;
    body: ChatResponseBlock[];
    footer: ChatResponseBlock[];
}
interface GenerateTestOptions {
    class: string;
    level: string;
    duration: string;
    testInfo: {
        subject: string;
        chapter: string;
        topics: string;
        context: string;
        testType: string;
        numberOfQuestions: number;
        marksPerQuestion: number;
        exampleQuestions?: string[];
        backExerciseQuestions?: string[];
    }[]
}


interface GenerateNotesOptions {
    class: string;
    chapter: string;
    topics: string;
    subject: string;
    context: string;
}

interface GenerateLessonPlanOptions {
    class: string;
    chapter: string;
    topics: string;
    subject: string;
    context: string;
    duration: string;
}

// Type for 5Es Lesson Plan Response
export type FiveEsLessonPlanResponse = z.infer<typeof Enhanced5EsLessonPlanSchema>;


interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
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
    private getBaseSystemPrompt(context?: string): string {
        return `
            You are the best in the world at tutoring, your students loves you and you are the best at what you do. 
            You are also a great teacher and you are able to explain complex concepts in a way that is easy to understand. 
            You always use analogies and real life examples to explain the concepts like you are teaching a 10 year old child.
            
            ${context ? `Context: ${context}` : ''}
            
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
    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }


    async generateNotes(options: GenerateNotesOptions): Promise<NotesResponse> {
        const { class: class_name, chapter, topics, context, subject } = options;

        const { object } = await generateObject({
            model: google('gemini-2.5-flash', {
                useSearchGrounding: true,
            }),
            schema: FullNotesSchema,
            system: `
                You are an expert educator and technical content creator. 
                Your task is to generate clear, structured, and interactive study notes for a canvas-based AI Tutor app. 
                The notes should be highly engaging, modular, and suitable for both UI rendering and export to PDF.
                
                Class: ${class_name}
                Chapter: ${chapter}
                Topics: ${topics}
                Subject: ${subject}

       
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

                context for topic: ${context}

            `,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Create detailed study notes for the specified topic. Include visual elements, examples, and practice questions.`,
                        },
                    ],
                },
            ],
        });

        return await this.processNotesImages(object as NotesResponse);
    }

    async generateLessonPlan(options: GenerateLessonPlanOptions): Promise<FiveEsLessonPlanResponse> {
        const { class: class_name, chapter, topics, context, subject, duration } = options;

        const { object } = await generateObject({
            model: google('gemini-2.5-flash', {
                useSearchGrounding: true,
            }),
            schema: Enhanced5EsLessonPlanSchema,
            system: `
                You are an expert educator and curriculum designer specializing in the 5Es instructional model (Engage, Explore, Explain, Elaborate, Evaluate). 
                Your task is to create a comprehensive, research-based lesson plan that follows constructivist learning principles and promotes deep understanding.

                ## Lesson Context
                - gradeLevel: ${class_name}
                - Chapter: ${chapter}
                - Topics: ${topics}
                - Subject: ${subject}
                - For ${duration} class , 
                - Context: ${context}

                ## 5Es Framework Implementation

                ### 1. ENGAGE (Hook & Activate Prior Knowledge)
                - Create curiosity and interest through compelling questions, demonstrations, or phenomena
                - Activate prior knowledge and identify misconceptions
                - Establish learning goals and relevance
                - Duration: 10-15% of total lesson time

                ### 2. EXPLORE (Discovery & Investigation)
                - Students investigate concepts through hands-on activities
                - Encourage collaboration and scientific thinking
                - Minimal direct instruction - let students discover patterns
                - Duration: 35-40% of total lesson time

                ### 3. EXPLAIN (Concept Introduction & Vocabulary)
                - Introduce formal concepts, vocabulary, and explanations
                - Connect student discoveries to academic language
                - Provide clear, structured content delivery
                - Duration: 20-25% of total lesson time

                ### 4. ELABORATE (Application & Extension)
                - Apply new concepts to different contexts
                - Deepen understanding through challenging applications
                - Connect to real-world scenarios and interdisciplinary links
                - Duration: 15-20% of total lesson time

                ### 5. EVALUATE (Assessment & Reflection)
                - Assess student understanding through varied methods
                - Encourage self-reflection and metacognition
                - Plan for next steps and future learning
                - Duration: 10-15% of total lesson time

                ## Enhanced Block Types & Guidelines
                - **text**: Clear explanations using age-appropriate language and scaffolding strategies
                - **activity**: Hands-on learning experiences aligned with learning objectives
                - **assessment**: Formative and summative assessment tools with clear rubrics
                - **reflection**: Metacognitive prompts and self-assessment opportunities
                - **math**: Mathematical concepts presented through multiple representations
                - **code**: Programming examples with step-by-step explanations (if applicable)
                - **list**: Organized information with clear hierarchies and relationships
                - **quote**: Memorable insights, real-world connections, and expert perspectives
                - **question**: Inquiry-based questions at various cognitive levels (Bloom's Taxonomy)
           
                ## Pedagogical Principles
                - Differentiation for diverse learners and learning styles
                - Scaffolding and gradual release of responsibility
                - Collaborative learning and peer interaction
                - Real-world connections and authentic assessment
                - Technology integration where appropriate
                - Cultural responsiveness and inclusive practices
                - Evidence-based instructional strategies

                ## Assessment Alignment
                - Clear learning objectives with measurable outcomes
                - Formative assessments throughout each phase
                - Summative assessment that demonstrates mastery
                - Self-assessment and peer assessment opportunities
                - Rubrics with specific criteria and performance levels

                Important: Create engaging, interactive content that promotes deep learning and critical thinking. 
                Use research-based instructional strategies and ensure all activities align with learning objectives.

                keep the lesson plan according to the duration of the class. which means it must get easily covered in the class. or else it will be too long and not be able to cover in the class.
            `,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Create a comprehensive 5Es lesson plan for the specified topic. 
                            
                            Structure the lesson plan with:
                            1. A compelling lesson overview with big ideas and essential questions
                            2. Five distinct phases following the 5Es model (Engage, Explore, Explain, Elaborate, Evaluate)
                            3. Detailed activities with clear instructions and expected outcomes
                            4. Multiple assessment strategies including formative and summative assessments
                            5. Differentiation strategies for diverse learners
                            6. Teacher notes and classroom management tips
                            7. Required resources and technology integration
                            8. Extension activities and homework assignments

                            Ensure each phase has appropriate timing, learning objectives, and assessment criteria.
                            Include visual elements, interactive activities, and real-world connections throughout.`,
                        },
                    ],
                },
            ],
        });

        return object
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


    async generateTest(options: GenerateTestOptions) {
        const { class: class_name, level, duration, testInfo } = options;

        // Validate testInfo array
        if (!testInfo || testInfo.length === 0) {
            throw new Error('Test info array cannot be empty');
        }

        // Calculate total questions and validate
        const totalQuestions = testInfo.reduce((sum, section) => sum + section.numberOfQuestions, 0);
        const totalMarks = testInfo.reduce((sum, section) => sum + (section.numberOfQuestions * section.marksPerQuestion), 0);

        // Collect all reference questions from all sections
        const allExampleQuestions = testInfo
            .flatMap(section => section.exampleQuestions || [])
            .filter(q => q.trim().length > 0);

        const allBackExerciseQuestions = testInfo
            .flatMap(section => section.backExerciseQuestions || [])
            .filter(q => q.trim().length > 0);

        const hasExampleQuestions = allExampleQuestions.length > 0;
        const hasBackExerciseQuestions = allBackExerciseQuestions.length > 0;

        // Build comprehensive reference content
        let referenceContent = '';
        if (hasExampleQuestions && hasBackExerciseQuestions) {
            referenceContent = `
                ## Reference Questions Available
                
                **Example Questions from All Chapters:**
                ${allExampleQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}
                
                **Back Exercise Questions from All Chapters:**
                ${allBackExerciseQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}
                
                **Instructions:** Use both example questions and back exercise questions as reference to understand the expected question format, difficulty level, and topic coverage. Create similar-style questions that test the same concepts but with different scenarios or data.
            `;
        } else if (hasExampleQuestions) {
            referenceContent = `
                ## Reference Questions Available
                
                **Example Questions from All Chapters:**
                ${allExampleQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}
                
                **Instructions:** Use these example questions as reference to understand the expected question format, difficulty level, and style. Create similar questions that test the same concepts but with different scenarios or data.
            `;
        } else if (hasBackExerciseQuestions) {
            referenceContent = `
                ## Reference Questions Available
                
                **Back Exercise Questions from All Chapters:**
                ${allBackExerciseQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}
                
                **Instructions:** Use these back exercise questions as reference to understand the expected question format and difficulty level. Create similar-style questions that test the same concepts but with different scenarios or data.
            `;
        } else {
            referenceContent = `
                ## No Reference Questions Available
                
                **Instructions:** Create original questions based on the chapter content and topics. Ensure questions are appropriate for ${class_name} level and cover the specified topics comprehensively.
            `;
        }

        // Build detailed test sections information
        const testSectionsInfo = testInfo.map((section, index) => `
            **Section ${index + 1}: ${section.subject} - ${section.chapter}**
            - Topics: ${section.topics}
            - Question Type: ${section.testType}
            - Number of Questions: ${section.numberOfQuestions}
            - Marks per Question: ${section.marksPerQuestion}
            - Total Marks for Section: ${section.numberOfQuestions * section.marksPerQuestion}
            - Context: ${section.context}
            - Section Reference Questions: ${(section.exampleQuestions || []).length + (section.backExerciseQuestions || []).length} available
        `).join('\n');

        // Build comprehensive test type instructions
        const getTestTypeInstructions = (type: string, marksPerQuestion: number) => {
            const baseInstructions = {
                'mcq': `
                    ## MCQ Instructions (${marksPerQuestion} marks each)
                    - Create Multiple Choice Questions with 4 options each
                    - Provide exactly one correct answer
                    - Make distractors plausible but clearly incorrect
                    - Options should be concise and grammatically consistent
                    - Avoid "All of the above" or "None of the above"
                    - Difficulty should match the marks allocated
                `,
                'short': `
                    ## Short Answer Instructions (${marksPerQuestion} marks each)
                    - Create questions requiring brief, specific answers (1-3 sentences)
                    - Focus on key concepts, definitions, and explanations
                    - Answers should be factual and objective
                    - For options array: use empty array []
                    - correctAnswer should contain the expected short answer
                    - Question complexity should justify ${marksPerQuestion} marks
                `,
                'long': `
                    ## Long Answer Instructions (${marksPerQuestion} marks each)
                    - Create questions requiring detailed explanations (paragraph-length)
                    - Focus on analysis, synthesis, and critical thinking
                    - Questions should test deep understanding and application
                    - For options array: use empty array []
                    - correctAnswer should contain key points or a sample detailed answer
                    - Ensure question depth justifies ${marksPerQuestion} marks
                `,
                'fill_in_the_blank': `
                    ## Fill in the Blank Instructions (${marksPerQuestion} marks each)
                    - Create sentences with strategic blanks to test key concepts
                    - Use ______ to indicate blanks in the question
                    - For options array: provide 4 possible answers including the correct one
                    - Ensure only one option logically completes the sentence
                    - correctAnswer should be the word/phrase that fills the blank
                    - Complexity should match ${marksPerQuestion} marks allocation
                `,
                'true_false': `
                    ## True/False Instructions (${marksPerQuestion} marks each)
                    - Create clear statements that are definitively true or false
                    - Avoid ambiguous or partially true statements
                    - For options array: use ["True", "False"]
                    - correctAnswer should be either "True" or "False"
                    - Test important concepts and common misconceptions
                    - Ensure statement complexity justifies ${marksPerQuestion} marks
                `
            };
            return baseInstructions[type as keyof typeof baseInstructions] || baseInstructions['mcq'];
        };

        // Build instructions for each section
        const sectionInstructions = testInfo.map((section, index) => `
            ### Section ${index + 1} Specific Instructions
            ${getTestTypeInstructions(section.testType, section.marksPerQuestion)}
            
                         **Content Focus for this Section:**
             - Subject: ${section.subject}
             - Chapter: ${section.chapter}
             - Topics: ${section.topics}
            - Context: ${section.context}
            - Questions needed: ${section.numberOfQuestions}
            - Question type: ${section.testType}
        `).join('\n');

        const { object } = await generateObject({
            model: google('gemini-2.5-flash', {
                useSearchGrounding: true,
            }),
            schema: TestSchema,
            messages: [
                {
                    role: 'system',
                    content: `
                        You are an expert test creator and educational assessment specialist. Create comprehensive, well-structured tests that appropriately challenge students while being fair and educational.
                        
                        ## Student Profile
                        - Class: ${class_name}
                        - Difficulty Level: ${level || 'medium'}
                        - Test Duration: ${duration || 20} minutes
                        
                        ## Test Overview
                        - Total Sections: ${testInfo.length}
                        - Total Questions: ${totalQuestions}
                        - Total Marks: ${totalMarks}
                        - level: ${level}
                        - Mixed Question Types: ${[...new Set(testInfo.map(s => s.testType))].join(', ')}
                        
                        ## Test Sections Breakdown
                        ${testSectionsInfo}
                        
                        ## Reference Material
                        ${referenceContent}
                        
                        ${sectionInstructions}
                        
                        ## Comprehensive Test Creation Guidelines
                        
                        ### Question Quality Standards
                        1. **Conceptual Understanding**: Questions should test genuine understanding, not just memorization
                        2. **Application Focus**: Include questions that require applying concepts to new situations
                        3. **Clear Language**: Use precise, unambiguous wording appropriate for ${class_name} level
                        4. **Marks-Based Difficulty**: Question complexity should match allocated marks
                        5. **Balanced Distribution**: 
                           - Easy (30%): Basic recall and understanding
                           - Medium (50%): Application and analysis  
                           - Hard (20%): Synthesis and evaluation
                        
                        ### Multi-Section Format Requirements
                        1. **Section Coherence**: Group questions logically by subject/chapter
                        2. **Type Consistency**: Each question must have correct ques_type field
                        3. **Options Array**: Follow type-specific requirements for options
                        4. **Progressive Difficulty**: Within each section, progress from easier to harder
                        5. **Cross-Section Balance**: Maintain overall difficulty balance across all sections
                        
                        ### Content Coverage Strategy
                        1. **Comprehensive Coverage**: Cover all major topics from all sections
                        2. **Proportional Representation**: Allocate questions proportionally to section importance
                        3. **Inter-Section Connections**: Where appropriate, create questions that connect concepts across sections
                        4. **Real-World Applications**: Use authentic contexts relevant to each subject area
                        
                        ### Quality Assurance for Multi-Section Tests
                        - Each question must have exactly one correct answer
                        - All options should be grammatically consistent (when applicable)
                        - Avoid questions that can be answered without subject knowledge
                        - Ensure questions are free from cultural or gender bias
                        - Verify that difficulty matches both specified level and marks allocation
                        - Ensure ques_type field matches the actual question format
                        - Maintain consistency in terminology across sections
                        - Check for appropriate cognitive load distribution
                        
                        ## Schema Requirements for Multi-Section Test
                        - testName: Create a descriptive name covering all sections
                        - chapters: List all chapters from all sections
                        - topics: Combine all topics from all sections
                        - level: Use the specified difficulty level
                        - assignmentType: ${testInfo.length > 1 ? 'mix' : testInfo[0]?.testType}
                        - questions: Create ${totalQuestions} questions total, distributed as specified
                        - duration: Set to ${duration} minutes
                        
                        ### Question Distribution Strategy
                        ${testInfo.map((section, index) => `
                        - Section ${index + 1} (${section.subject} - ${section.chapter}): ${section.numberOfQuestions} ${section.testType} questions (${section.marksPerQuestion} marks each)
                        `).join('')}
                        
                        ## Special Instructions Based on Available References
                        ${hasExampleQuestions || hasBackExerciseQuestions
                            ? `- **Reference Integration**: Use reference questions to understand expected difficulty and format
                               - **Style Consistency**: Maintain similar complexity across sections
                               - **Concept Expansion**: Build on reference questions while covering all required topics
                               - **Quality Matching**: Ensure new questions meet the same quality standards as references`
                            : `- **Original Creation**: Develop questions based purely on chapter content and topics
                               - **Standard Practices**: Follow educational assessment best practices for ${class_name} level
                               - **Comprehensive Coverage**: Ensure all topics from all sections are represented`
                        }
                        
                        Create an engaging, comprehensive test that appropriately challenges students across all subjects and topics while maintaining academic rigor, fairness, and educational value.
                    `,
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Create a comprehensive ${level} difficulty test covering multiple subjects/chapters with ${totalQuestions} total questions distributed across ${testInfo.length} sections.
                            
                            ## Section-wise Requirements:
                            ${testInfo.map((section, index) => `
                            **Section ${index + 1}:** ${section.numberOfQuestions} ${section.testType} questions on ${section.subject} - ${section.chapter}
                            Topics: ${section.topics}
                            Marks per question: ${section.marksPerQuestion}
                            Context: ${section.context}
                            `).join('\n')}
                            
                            ## Reference Usage:
                            ${hasExampleQuestions || hasBackExerciseQuestions
                                    ? `Use the provided reference questions to guide your question creation across all sections. Maintain similar style and difficulty while creating unique questions that test the same concepts.`
                                    : `Create original questions that comprehensively test understanding of all chapter topics across all sections.`
                                }
                            
                            ## Format Requirements:
                            - Create questions according to each section's specified type (${[...new Set(testInfo.map(s => s.testType))].join(', ')})
                            - Ensure proper ques_type field for each question
                            - Follow type-specific option array requirements
                            - Maintain marks-appropriate difficulty for each question
                            - Progress from basic understanding to application and analysis within each section
                            - Ensure cross-sectional coherence and balanced difficulty distribution
                            
                            Total test duration: ${duration} minutes
                            Total marks: ${totalMarks}`,
                        },
                    ],
                },
            ],
        });

        return object;
    }


    async generateChatResponse({ context, messages }: { context: string, messages: ChatMessage[] }): Promise<ChatResponse> {

        const systemPrompt = this.getBaseSystemPrompt(context);


        // Prepare messages for AI API
        const apiMessages: Array<{
            role: 'user' | 'assistant' | 'system';
            content: string | Array<{ type: string; text: string }>;
        }> = [];


        // Convert conversation messages
        messages.forEach(msg => {
            apiMessages.push({
                role: msg.role,
                content: msg.content
            });
        });

        // Add latest message with files


        const { object } = await generateObject({
            model: google('gemini-2.5-flash-lite-preview-06-17'),
            system: systemPrompt,
            messages: apiMessages as Parameters<typeof generateObject>[0]['messages'],
            schema: ChatNodeSchema,
        });


        const processedObject = await this.processImageBlocks(object as ChatResponse);
        return await this.processSvgs(processedObject);
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
                            model: google('gemini-2.5-flash-lite-preview-06-17'),
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



    async generateFunFactsAboutTopic(topic: string): Promise<string[]> {
        const { object } = await generateObject({
            model: google('gemini-2.5-flash'),
            prompt: `Generate fun facts about the topic "${topic}"`,
            schema: z.array(z.string()).describe('Fun facts about the topic'),
        });
        return object;
    }



}
