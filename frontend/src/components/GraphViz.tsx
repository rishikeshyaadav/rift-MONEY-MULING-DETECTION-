"use client";

import dynamic from 'next/dynamic';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-spin-slow" />
                    <div className="absolute inset-2 rounded-full border-2 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <div className="absolute inset-4 rounded-full bg-red-500/10 animate-pulse" />
                </div>
                <div className="text-center">
                    <span className="text-gray-400 text-sm tracking-wide block">Initializing Neural Graph...</span>
                    <span className="text-gray-600 text-[10px] tracking-widest uppercase mt-1 block">Building topology matrix</span>
                </div>
            </div>
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
    const graphRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 650 });
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [nodeCount, setNodeCount] = useState(0);
    const [linkCount, setLinkCount] = useState(0);

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: 650,
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
        setNodeCount(nodes.length);
        setLinkCount(links.length);
        return { nodes, links };
    }, [edgeData]);

    const suspiciousMap = useMemo(() => {
        const map = new Map<string, number>();
        suspicious_accounts.forEach(acc => map.set(acc.account_id, acc.suspicion_score));
        return map;
    }, [suspicious_accounts]);

    const suspiciousDetailMap = useMemo(() => {
        const map = new Map<string, SuspiciousAccount>();
        suspicious_accounts.forEach(acc => map.set(acc.account_id, acc));
        return map;
    }, [suspicious_accounts]);

    // Connected nodes for highlight
    const connectedNodes = useMemo(() => {
        if (!selectedNode) return new Set<string>();
        const connected = new Set<string>();
        connected.add(selectedNode);
        edgeData.forEach(edge => {
            if (edge.sender_id === selectedNode) connected.add(edge.receiver_id);
            if (edge.receiver_id === selectedNode) connected.add(edge.sender_id);
        });
        return connected;
    }, [selectedNode, edgeData]);

    const handleNodeClick = useCallback((node: any) => {
        setSelectedNode(prev => prev === node.id ? null : node.id);
        if (graphRef.current) {
            graphRef.current.centerAt(node.x, node.y, 800);
            graphRef.current.zoom(3, 800);
        }
    }, []);

    const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
        const isSuspicious = suspiciousMap.has(node.id);
        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode === node.id;
        const isConnected = connectedNodes.has(node.id);
        const isDimmed = selectedNode && !isConnected;

        const baseRadius = isSuspicious ? 6 : 3.5;
        const radius = isHovered || isSelected ? baseRadius * 1.5 : baseRadius;

        // Outer glow for suspicious nodes (enhanced)
        if (isSuspicious && !isDimmed) {
            // Double-layered glow
            const outerGlow = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, radius * 4);
            outerGlow.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
            outerGlow.addColorStop(0.5, 'rgba(239, 68, 68, 0.08)');
            outerGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius * 4, 0, 2 * Math.PI);
            ctx.fillStyle = outerGlow;
            ctx.fill();

            const innerGlow = ctx.createRadialGradient(node.x, node.y, radius * 0.5, node.x, node.y, radius * 2);
            innerGlow.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
            innerGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius * 2, 0, 2 * Math.PI);
            ctx.fillStyle = innerGlow;
            ctx.fill();
        }

        // Pulsing ring for selected
        if (isSelected) {
            const time = Date.now() / 1000;
            const pulseRadius = radius * (1.8 + Math.sin(time * 3) * 0.3);
            ctx.beginPath();
            ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = isSuspicious ? 'rgba(239, 68, 68, 0.5)' : 'rgba(6, 182, 212, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Secondary pulse ring
            const pulse2 = radius * (2.5 + Math.sin(time * 2) * 0.4);
            ctx.beginPath();
            ctx.arc(node.x, node.y, pulse2, 0, 2 * Math.PI);
            ctx.strokeStyle = isSuspicious ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Node gradient fill
        const grad = ctx.createRadialGradient(
            node.x - radius * 0.3, node.y - radius * 0.3, 0,
            node.x, node.y, radius
        );

        if (isDimmed) {
            grad.addColorStop(0, 'rgba(75, 85, 99, 0.25)');
            grad.addColorStop(1, 'rgba(55, 65, 81, 0.1)');
        } else if (isSuspicious) {
            grad.addColorStop(0, '#ff6b6b');
            grad.addColorStop(1, '#dc2626');
        } else if (isHovered || isSelected) {
            grad.addColorStop(0, '#a5b4fc');
            grad.addColorStop(1, '#6366f1');
        } else {
            grad.addColorStop(0, '#6b7280');
            grad.addColorStop(1, '#4b5563');
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.fill();

        // Border
        if (!isDimmed) {
            ctx.strokeStyle = isSuspicious
                ? 'rgba(248, 113, 113, 0.7)'
                : isHovered || isSelected
                    ? 'rgba(165, 180, 252, 0.5)'
                    : 'rgba(156, 163, 175, 0.2)';
            ctx.lineWidth = isHovered || isSelected ? 2 : 0.6;
            ctx.stroke();
        }

        // Label (enhanced with score badge)
        if (isHovered || isSelected || isSuspicious) {
            const score = suspiciousMap.get(node.id);
            const label = isSuspicious && (isHovered || isSelected) ? `${node.id}  ⚠ ${score}` : node.id;
            const fontSize = isHovered || isSelected ? 11 : 8;
            ctx.font = `600 ${fontSize}px 'Inter', system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textWidth = ctx.measureText(label).width;
            const padding = 5;
            const labelY = node.y - radius - 12;

            // Label background pill
            ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
            ctx.beginPath();
            const rx = node.x - textWidth / 2 - padding;
            const ry = labelY - fontSize / 2 - 3;
            const rw = textWidth + padding * 2;
            const rh = fontSize + 6;
            const cornerRadius = rh / 2;
            ctx.moveTo(rx + cornerRadius, ry);
            ctx.lineTo(rx + rw - cornerRadius, ry);
            ctx.arcTo(rx + rw, ry, rx + rw, ry + cornerRadius, cornerRadius);
            ctx.lineTo(rx + rw, ry + rh - cornerRadius);
            ctx.arcTo(rx + rw, ry + rh, rx + rw - cornerRadius, ry + rh, cornerRadius);
            ctx.lineTo(rx + cornerRadius, ry + rh);
            ctx.arcTo(rx, ry + rh, rx, ry + rh - cornerRadius, cornerRadius);
            ctx.lineTo(rx, ry + cornerRadius);
            ctx.arcTo(rx, ry, rx + cornerRadius, ry, cornerRadius);
            ctx.fill();

            // Label border
            ctx.strokeStyle = isSuspicious ? 'rgba(239, 68, 68, 0.3)' : 'rgba(148, 163, 184, 0.15)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            ctx.fillStyle = isSuspicious ? '#f87171' : '#d1d5db';
            ctx.fillText(label, node.x, labelY);
        }
    }, [suspiciousMap, hoveredNode, selectedNode, connectedNodes]);

    const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        const sourceX = typeof link.source === 'object' ? link.source.x : 0;
        const sourceY = typeof link.source === 'object' ? link.source.y : 0;
        const targetX = typeof link.target === 'object' ? link.target.x : 0;
        const targetY = typeof link.target === 'object' ? link.target.y : 0;

        const isConnectedLink = selectedNode && (connectedNodes.has(sourceId) && connectedNodes.has(targetId));
        const isDimmed = selectedNode && !isConnectedLink;
        const isSuspiciousLink = suspiciousMap.has(sourceId) || suspiciousMap.has(targetId);

        ctx.beginPath();
        ctx.moveTo(sourceX, sourceY);
        ctx.lineTo(targetX, targetY);

        if (isDimmed) {
            ctx.strokeStyle = 'rgba(55, 65, 81, 0.05)';
            ctx.lineWidth = 0.2;
        } else if (isConnectedLink) {
            ctx.strokeStyle = isSuspiciousLink ? 'rgba(239, 68, 68, 0.5)' : 'rgba(6, 182, 212, 0.4)';
            ctx.lineWidth = 2;
        } else if (isSuspiciousLink) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.lineWidth = 1.2;
        } else {
            ctx.strokeStyle = 'rgba(75, 85, 99, 0.12)';
            ctx.lineWidth = 0.5;
        }
        ctx.stroke();

        // Arrowhead (enhanced)
        if (!isDimmed) {
            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const angle = Math.atan2(dy, dx);
            const arrowLen = isConnectedLink ? 7 : 5;
            const arrowX = targetX - Math.cos(angle) * 8;
            const arrowY = targetY - Math.sin(angle) * 8;

            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
                arrowX - arrowLen * Math.cos(angle - Math.PI / 6),
                arrowY - arrowLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                arrowX - arrowLen * Math.cos(angle + Math.PI / 6),
                arrowY - arrowLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = isConnectedLink
                ? (isSuspiciousLink ? 'rgba(239, 68, 68, 0.7)' : 'rgba(6, 182, 212, 0.5)')
                : (isSuspiciousLink ? 'rgba(239, 68, 68, 0.4)' : 'rgba(75, 85, 99, 0.2)');
            ctx.fill();
        }
    }, [selectedNode, connectedNodes, suspiciousMap]);

    // Custom background paint with subtle grid + vignette
    const paintBackground = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
        const w = dimensions.width;
        const h = dimensions.height;

        // Dark background
        ctx.fillStyle = 'rgba(3, 7, 18, 1)';
        ctx.fillRect(0, 0, w, h);

        // Subtle grid pattern
        const gridSize = 40 / globalScale;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.015)';
        ctx.lineWidth = 0.5 / globalScale;

        const startX = Math.floor(-w / globalScale) * gridSize;
        const endX = Math.ceil(w / globalScale) * gridSize;
        const startY = Math.floor(-h / globalScale) * gridSize;
        const endY = Math.ceil(h / globalScale) * gridSize;

        for (let x = startX; x <= endX; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }
        for (let y = startY; y <= endY; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }
    }, [dimensions]);

    return (
        <div className="relative">
            <div ref={containerRef} className="w-full h-[650px] rounded-lg overflow-hidden bg-[#030712] relative graph-container">
                <ForceGraph2D
                    ref={graphRef}
                    graphData={graphData}
                    backgroundColor="rgba(0,0,0,0)"
                    nodeId="id"
                    nodeCanvasObject={paintNode}
                    nodeColor={(node: any) => suspiciousMap.has(node.id) ? '#ef4444' : '#6b7280'}
                    nodeVal={(node: any) => suspiciousMap.has(node.id) ? 8 : 5}
                    nodeRelSize={5}
                    nodeLabel={(node: any) => suspiciousMap.has(node.id) ? `${node.id} | Score: ${suspiciousMap.get(node.id)} ⚠️` : node.id}
                    nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                        const radius = suspiciousMap.has(node.id) ? 12 : 8;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
                        ctx.fillStyle = color;
                        ctx.fill();
                    }}
                    enableNodeDrag={true}
                    linkCanvasObject={paintLink}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={0.005}
                    linkDirectionalParticleWidth={2}
                    linkDirectionalParticleColor={() => '#ef4444'}
                    onNodeHover={(node: any) => setHoveredNode(node ? node.id : null)}
                    onNodeClick={handleNodeClick}
                    onBackgroundClick={() => {
                        setSelectedNode(null);
                        if (graphRef.current) graphRef.current.zoom(1, 600);
                    }}
                    width={dimensions.width}
                    height={dimensions.height}
                    cooldownTicks={150}
                    d3VelocityDecay={0.3}
                    warmupTicks={50}
                />

                {/* Stats Overlay (Top Left) */}
                <div className="absolute top-4 left-4 glass-strong rounded-lg px-4 py-2.5 flex items-center gap-4 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-gray-500 uppercase tracking-wider">Nodes</span>
                        <span className="text-white font-bold">{nodeCount}</span>
                    </div>
                    <div className="w-px h-3 bg-gray-700" />
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        <span className="text-gray-500 uppercase tracking-wider">Edges</span>
                        <span className="text-white font-bold">{linkCount}</span>
                    </div>
                    <div className="w-px h-3 bg-gray-700" />
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-gray-500 uppercase tracking-wider">Flagged</span>
                        <span className="text-red-400 font-bold">{suspicious_accounts.length}</span>
                    </div>
                </div>

                {/* Legend Overlay (Bottom Left) */}
                <div className="absolute bottom-4 left-4 glass-strong rounded-lg px-4 py-3 flex items-center gap-5 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        <span className="text-gray-400">Suspicious</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500" />
                        <span className="text-gray-400">Normal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-3" viewBox="0 0 16 12"><path d="M0 6h12l-4-4M12 6l-4 4" stroke="#6b7280" fill="none" strokeWidth="1.5" /></svg>
                        <span className="text-gray-400">Money Flow</span>
                    </div>
                </div>

                {/* Hover Info Panel (Right) */}
                {hoveredNode && (
                    <div className="absolute top-4 right-4 glass-strong rounded-xl px-5 py-4 min-w-[220px] animate-fade-in-scale shadow-2xl shadow-black/40" style={{ animationDuration: '0.15s' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${suspiciousDetailMap.has(hoveredNode) ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                                {suspiciousDetailMap.has(hoveredNode) ? 'Flagged Account' : 'Account'}
                            </span>
                        </div>
                        <div className="font-mono text-sm text-white font-bold">{hoveredNode}</div>
                        {suspiciousDetailMap.has(hoveredNode) && (
                            <div className="mt-3 pt-3 border-t border-gray-800/50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Risk Score</span>
                                    <span className="text-red-400 font-bold text-lg">
                                        {suspiciousDetailMap.get(hoveredNode)!.suspicion_score}
                                    </span>
                                </div>
                                {/* Mini risk bar */}
                                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                                        style={{ width: `${suspiciousDetailMap.get(hoveredNode)!.suspicion_score}%` }}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {suspiciousDetailMap.get(hoveredNode)!.detected_patterns.map(p => (
                                        <span key={p} className="inline-block px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-[9px] border border-red-500/20 font-medium">
                                            {p.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
