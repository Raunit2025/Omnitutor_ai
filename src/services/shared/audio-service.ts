import { getConfig, getStorage } from "@/lib/server/appwrite";
import { ID } from "node-appwrite";
import { GoogleGenAI } from '@google/genai';
import mime from 'mime';

export interface AudioGenerationOptions {
    text: string;
    voice?: 'Erinome' | 'Chloe' | 'Aria' | 'Dione' | 'Tethys' | 'Helios' | 'Fenrir' | 'Eos' | 'Rhea' | 'Puck';
    model?: string;
    temperature?: number;
}

interface WavConversionOptions {
    numChannels: number;
    sampleRate: number;
    bitsPerSample: number;
}

export class AudioService {
    private static instance: AudioService;
    private genAI: GoogleGenAI;

    private constructor() {
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required');
        }
        this.genAI = new GoogleGenAI({
            apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        });
    }

    public static getInstance(): AudioService {
        if (!AudioService.instance) {
            AudioService.instance = new AudioService();
        }
        return AudioService.instance;
    }

    private createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
        const { numChannels, sampleRate, bitsPerSample } = options;

        const byteRate = sampleRate * numChannels * bitsPerSample / 8;
        const blockAlign = numChannels * bitsPerSample / 8;
        const buffer = Buffer.alloc(44);

        buffer.write('RIFF', 0);                      // ChunkID
        buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
        buffer.write('WAVE', 8);                      // Format
        buffer.write('fmt ', 12);                     // Subchunk1ID
        buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
        buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
        buffer.writeUInt16LE(numChannels, 22);        // NumChannels
        buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
        buffer.writeUInt32LE(byteRate, 28);           // ByteRate
        buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
        buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
        buffer.write('data', 36);                     // Subchunk2ID
        buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size

        return buffer;
    }

    private parseMimeType(mimeType: string): WavConversionOptions {
        const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
        const [_, format] = fileType?.split('/') || [];

        const options: Partial<WavConversionOptions> = {
            numChannels: 1,
            sampleRate: 16000, // Default sample rate
            bitsPerSample: 16, // Default bits per sample
        };

        if (format && format.startsWith('L')) {
            const bits = parseInt(format.slice(1), 10);
            if (!isNaN(bits)) {
                options.bitsPerSample = bits;
            }
        }

        for (const param of params) {
            const [key, value] = param.split('=').map(s => s.trim());
            if (key === 'rate' && value) {
                options.sampleRate = parseInt(value, 10);
            }
        }

        return options as WavConversionOptions;
    }

    private convertToWav(rawData: string, mimeType: string): Buffer {
        const options = this.parseMimeType(mimeType);
        const buffer = Buffer.from(rawData, 'base64');
        const wavHeader = this.createWavHeader(buffer.length, options);
        return Buffer.concat([wavHeader, buffer]);
    }

    async generateAudio(options: AudioGenerationOptions): Promise<string | null> {
        const {
            text,
            voice = "Erinome",
            model = "gemini-2.5-flash-preview-tts",
            temperature = 1
        } = options;

        try {
            const config = {
                temperature,
                responseModalities: ['audio' as const],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: voice,
                        }
                    }
                },
            };

            const contents = [
                {
                    role: 'user' as const,
                    parts: [
                        {
                            text,
                        },
                    ],
                },
            ];

            const response = await this.genAI.models.generateContentStream({
                model,
                config,
                contents,
            });

            const audioChunks: Buffer[] = [];

            for await (const chunk of response) {
                if (!chunk.candidates || !chunk.candidates[0]?.content || !chunk.candidates[0].content.parts) {
                    continue;
                }

                if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                    const inlineData = chunk.candidates[0].content.parts[0].inlineData;
                    let fileExtension = mime.getExtension(inlineData.mimeType || '');
                    let buffer = Buffer.from(inlineData.data || '', 'base64');

                    if (!fileExtension) {
                        fileExtension = 'wav';
                        buffer = this.convertToWav(inlineData.data || '', inlineData.mimeType || '');
                    }

                    audioChunks.push(buffer);
                }
            }

            if (audioChunks.length === 0) {
                console.warn('No audio content generated');
                return null;
            }

            // Combine all audio chunks
            const combinedAudio = Buffer.concat(audioChunks);

            // Upload to storage
            const storage = await getStorage();
            const appwriteConfig = await getConfig();

            const audioFile = new File(
                [combinedAudio],
                "generated-audio.wav",
                { type: "audio/wav" }
            );

            const file = await storage.createFile(appwriteConfig.bucketId, ID.unique(), audioFile);
            return `${appwriteConfig.endpoint}/storage/buckets/${file.bucketId}/files/${file.$id}/view?project=${appwriteConfig.project}`;

        } catch (error) {
            console.error('Audio generation error:', error);
            return null;
        }
    }
} 