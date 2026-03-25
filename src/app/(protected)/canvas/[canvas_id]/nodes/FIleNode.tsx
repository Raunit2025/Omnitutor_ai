import { useReactFlow, type NodeProps } from "@xyflow/react";
import type { FileNodeType } from ".";
import { FiFile, FiFileText, FiImage, FiDownload, FiEye } from "react-icons/fi";
import { FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileAlt } from "react-icons/fa";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EyeClosed } from "lucide-react";

export default function FileNode({ data }: NodeProps<FileNodeType>) {
    const { fileName, fileSize, fileURL, fileFormat, isSelected, isHidden } = data;
    const [showPreview, setShowPreview] = useState(true);

    const { getNodes, setNodes } = useReactFlow();

    // Function to get appropriate icon based on file format
    const getFileIcon = () => {
        const format = fileFormat.toLowerCase();

        if (format === 'pdf') return <FaFilePdf className="text-red-500" size={24} />;
        if (format === 'doc' || format === 'docx') return <FaFileWord className="text-blue-600" size={24} />;
        if (format === 'xls' || format === 'xlsx') return <FaFileExcel className="text-green-600" size={24} />;
        if (format === 'ppt' || format === 'pptx') return <FaFilePowerpoint className="text-orange-500" size={24} />;
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(format)) return <FiImage className="text-purple-500" size={24} />;
        if (['psd', 'ai', 'eps', 'svg'].includes(format)) return <FaFileAlt className="text-blue-800" size={24} />;
        if (['txt', 'md', 'csv'].includes(format)) return <FiFileText className="text-gray-600" size={24} />;

        return <FiFile className="text-gray-500" size={24} />;
    };

    // Function to format file size
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Check if file is previewable
    const isPreviewable = () => {
        const format = fileFormat.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(format);
    };

    // Render file preview
    const renderPreview = () => {
        if (!showPreview || !fileURL) return null;

        const format = fileFormat.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(format)) {
            return (
                <div className="mt-2 border border-gray-200 rounded overflow-hidden">
                    <img src={fileURL} alt={fileName} className="max-w-full h-auto" />
                </div>
            );
        }
        if (format === 'pdf') {
            return (
                <div>
                    <div className="mt-2 hidden md:block border border-gray-200 rounded overflow-hidden">
                        <iframe src={`${fileURL}#view=FitH`} className="w-full h-[200px]" title={fileName}></iframe>
                    </div>
                    <div className="mt-2 md:hidden">
                        Preview not available for mobile devices
                    </div>
                </div>
            );
        }

        return null;
    };


    const handleSelect = () => {
        const nodes = getNodes();

        const node = nodes.filter(node => node.type === "file").find(node => node.data === data);
        if (node) {
            setNodes(nodes => nodes.map(n => n.id === node.id ? { ...n, data: { ...n.data, isSelected: !isSelected } } : n));
        }
    }

    const handleDelete = () => {
        const nodes = getNodes();
        const node = nodes.filter(node => node.type === "file").find(node => node.data === data);
        if (node) {
            setNodes(nodes => nodes.filter(n => n.id !== node.id));
        }
    }

    const handleHide = () => {
        const nodes = getNodes();
        const node = nodes.filter(node => node.type === "file").find(node => node.data === data);
        if (node) {
            setNodes(nodes => nodes.map(n => n.id === node.id ? { ...n, data: { ...n.data, isHidden: !isHidden } } : n));
        }
    }
    console.log(getNodes())



    return (
        <div className="group relative pt-[60px]">
            <div className="absolute top-0 right-2 z-50  gap-2 rounded-full hidden group-hover:flex">
                <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full hidden group-hover:flex justify-center items-center"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleHide();
                    }}
                >
                    {isHidden ? <FiEye /> : <EyeClosed />}
                </Button>

                <Button
                    size="icon"
                    variant="secondary"
                    className=" rounded-full hidden group-hover:block"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                    }}
                >
                    X
                </Button>
            </div>
            <Card className={`p-3 min-w-[200px] ${isSelected ? 'border-primary' : 'border-transparent'}`} onClick={handleSelect} >
                <div className="flex items-center gap-3">
                    {getFileIcon()}
                    <div className="flex-1 truncate">
                        <h3 className="font-medium truncate" title={fileName}>{fileName}</h3>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span className="uppercase">{fileFormat}</span>
                            <span>•</span>
                            <span>{formatFileSize(fileSize)}</span>
                        </div>
                    </div>
                </div>

                {!isHidden ? renderPreview() : null}

                {fileURL && (
                    <div className="mt-2 text-xs flex items-center gap-3">
                        <a
                            href={fileURL}
                            download={fileName}
                            target="_blank"
                            className=" items-center gap-1 hidden text-blue-500 hover:underline"
                        >
                            <FiDownload size={12} />
                            Download
                        </a>

                        {isPreviewable() && (
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className=" items-center gap-1 hidden text-green-500 hover:underline"
                            >
                                <FiEye size={12} />
                                {showPreview ? 'Hide preview' : 'Show preview'}
                            </button>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}