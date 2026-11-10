"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Node,
  Edge,
} from "@xyflow/react";
import { ClaimNode } from "./ClaimNode";
import { SourceNode } from "./SourceNode";
import { NodeInspectorDrawer } from "./NodeInspectorDrawer";
import { api } from "@/lib/api";
import { Filter, Layers, RefreshCw, ZoomIn, Search } from "lucide-react";

const nodeTypes = {
  claimNode: ClaimNode,
  sourceNode: SourceNode,
};

interface EvidenceGraphProps {
  projectId: string;
}

export function EvidenceGraph({ projectId }: EvidenceGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedSourceText, setSelectedSourceText] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchGraphData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getGraph(projectId);
      setNodes(data.nodes);
      setEdges(data.edges);
    } catch (err) {
      console.error("Failed to load evidence graph:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, setNodes, setEdges]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Handle node selection
  const onNodeClick = useCallback(
    async (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      if (node.data.node_type === "CLAIM" && node.data.source_id) {
        try {
          const src = await api.request<any>(`/projects/${projectId}/sources/${node.data.source_id}`);
          setSelectedSourceText(src.raw_text);
        } catch {
          setSelectedSourceText("");
        }
      } else if (node.data.node_type === "SOURCE") {
        setSelectedSourceText(node.data.full_raw_text || node.data.raw_text || "");
      }
    },
    [projectId]
  );

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchState =
        stateFilter === "ALL" ||
        (n.data.node_type === "CLAIM" && n.data.state === stateFilter) ||
        (n.data.node_type === "SOURCE" && stateFilter === "ALL");

      const matchSearch =
        !searchQuery ||
        (n.data.title && n.data.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.data.name && n.data.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.data.quote && n.data.quote.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchState && matchSearch;
    });
  }, [nodes, stateFilter, searchQuery]);

  return (
    <div className="relative w-full h-[calc(100vh-10rem)] rounded-2xl glass-panel overflow-hidden border border-white/10">
      {/* Top Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-[#0D1527]/90 backdrop-blur-xl p-2 rounded-xl border border-white/10 shadow-xl">
        {/* State Filters */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-2">
          {["ALL", "VERIFIED", "INFERRED", "CONFLICTING", "MISSING"].map((st) => (
            <button
              key={st}
              onClick={() => setStateFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                stateFilter === st
                  ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search claims or quotes..."
            className="w-48 pl-8 pr-3 py-1 bg-surface-raised rounded-lg text-xs text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchGraphData}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors"
          title="Reload Graph"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
        </button>
      </div>

      {/* React Flow Viewport */}
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{
          animated: false,
          style: { stroke: "#00F0FF", strokeWidth: 1.5, opacity: 0.7 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1E293B" />
        <Controls position="bottom-right" />
        <MiniMap
          position="bottom-left"
          nodeColor={(n) => {
            if (n.data.node_type === "SOURCE") return "#A855F7";
            if (n.data.state === "VERIFIED") return "#10B981";
            if (n.data.state === "INFERRED") return "#38BDF8";
            if (n.data.state === "CONFLICTING") return "#F59E0B";
            if (n.data.state === "MISSING") return "#EF4444";
            return "#64748B";
          }}
          maskColor="rgba(8, 12, 20, 0.7)"
          className="!bg-[#0D1527] !border !border-white/10 !rounded-xl"
        />
      </ReactFlow>

      {/* Side Inspector Drawer */}
      <NodeInspectorDrawer
        selectedNode={selectedNode}
        sourceText={selectedSourceText}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
