"use client";

import dynamic from 'next/dynamic';
import { useMemo, useRef, useEffect, useState } from 'react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mr-3" />
            Loading Graph Visualization...
        </div>
    ),
});

interface SuspiciousAccount {
    account_id: string;
    suspicion_score: number;
    detected_patterns: string[];
    ring_id?: string;
}

interface EdgeData {
    transaction_id: string;
    sender_id: string;
    receiver_id: string;
    amount: number;
    timestamp: string;
}

interface GraphVizProps {
    suspicious_accounts: SuspiciousAccount[];
    edgeData: EdgeData[];
}

export default function GraphViz({ suspicious_accounts, edgeData }: GraphVizProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: 600,
                });
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const graphData = useMemo(() => {
        const nodesSet = new Set<string>();
        edgeData.forEach(edge => {
            nodesSet.add(edge.sender_id);
            nodesSet.add(edge.receiver_id);
        });

        const nodes = Array.from(nodesSet).map(id => ({ id }));

        const links = edgeData.map(edge => ({
            source: edge.sender_id,
            target: edge.receiver_id,
            amount: edge.amount,
            transaction_id: edge.transaction_id,
        }));

        return { nodes, links };
    }, [edgeData]);

    const suspiciousSet = useMemo(() => {
        return new Set(suspicious_accounts.map(acc => acc.account_id));
    }, [suspicious_accounts]);

    return (
        <div ref={containerRef} className="w-full h-[600px] border border-gray-800 rounded-lg overflow-hidden bg-black relative">
            <ForceGraph2D
                graphData={graphData}
                backgroundColor="#000000"
                nodeId="id"
                nodeColor={(node: any) => suspiciousSet.has(node.id) ? '#ef4444' : '#9ca3af'}
                nodeRelSize={4}
                nodeVal={(node: any) => suspiciousSet.has(node.id) ? 6 : 2}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.25}
                linkColor={() => '#374151'}
                width={dimensions.width}
                height={dimensions.height}
                cooldownTicks={100}
                nodeLabel={(node: any) => `${node.id}${suspiciousSet.has(node.id) ? ' ⚠️ SUSPICIOUS' : ''}`}
            />
        </div>
    );
}
