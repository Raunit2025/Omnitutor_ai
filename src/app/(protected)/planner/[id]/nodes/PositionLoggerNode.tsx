import { Handle, Position, type NodeProps } from "@xyflow/react";
import ReactMarkdown from 'react-markdown';

import { type PositionLoggerNode } from "./";

export function PositionLoggerNode({
    data,
}: NodeProps<PositionLoggerNode>) {

    return (
        <div className="bg-background rounded-md p-2 border border-border max-w-[1200px]">
            {data.label === "NA" ? (
                <div className="flex justify-center items-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
            ) : (
                data.label && <div className="markdown-content"><ReactMarkdown>{data.label}</ReactMarkdown></div>
            )}
            <Handle type="source" position={Position.Right} />
            <Handle type="target" position={Position.Left} />
        </div>
    );
}
