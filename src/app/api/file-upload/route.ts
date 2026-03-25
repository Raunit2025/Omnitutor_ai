import { getConfig, getStorage } from '@/lib/server/appwrite';
import { NextRequest, NextResponse } from 'next/server';
import { ID } from 'node-appwrite';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files');

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
        }

        const storage = await getStorage();
        const config = await getConfig();

        const uploadedFiles = [];
        const MAX_FILE_SIZE = 20 * 1024 * 1024; // 2 MB in bytes

        for (const fileItem of files) {
            const file = fileItem as File;

            // Check if file size exceeds the limit
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json({
                    error: `File ${file.name} exceeds the maximum size limit of 2 MB`
                }, { status: 400 });
            }

            const uploadedFile = await storage.createFile(
                config.bucketId,
                ID.unique(),
                file
            );

            const fileUrl = `${config.endpoint}/storage/buckets/${uploadedFile.bucketId}/files/${uploadedFile.$id}/view?project=${config.project}`;

            uploadedFiles.push({
                fileId: uploadedFile.$id,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                fileUrl: fileUrl
            });
        }

        return NextResponse.json({
            success: true,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        return NextResponse.json(
            { error: 'Failed to upload files' },
            { status: 500 }
        );
    }
}