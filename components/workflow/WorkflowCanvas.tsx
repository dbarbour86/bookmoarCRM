'use client';

import React, { useState } from 'react';
import { WorkflowData, WorkflowVersionData, WorkflowNodeData, WorkflowEdgeData } from '@/lib/db';
import { NodeConfigSidebar } from './NodeConfigSidebar';
import { AddStepModal } from './AddStepModal';
import {
  FormInput,
  MessageSquare,
  Mail,
  Users,
  GitBranch,
  Clock,
  Plus,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Zap,
  ArrowDown,
} from 'lucide-react';

export interface WorkflowCanvasProps {
  workflow: WorkflowData;
  version: WorkflowVersionData;
  onUpdateVersion: (updatedVersion: WorkflowVersionData) => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ workflow, version, onUpdateVersion }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [addStepInsertAfterId, setAddStepInsertAfterId] = useState<string | null>(null);
  const [showAddStepModal, setShowAddStepModal] = useState(false);

  const selectedNode = version.nodesConfig.find((n) => n.id === selectedNodeId) || null;

  // Node Library Drag/Click Handler
  const handleAddNodeFromLibrary = (
    type: 'trigger' | 'action' | 'condition' | 'wait',
    actionType?: string,
    name?: string
  ) => {
    const newNodeId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newNode: WorkflowNodeData = {
      id: newNodeId,
      type,
      name: name || `${type.toUpperCase()}: ${actionType || ''}`,
      actionType,
      config:
        type === 'action' && actionType === 'SEND_SMS'
          ? { message: 'Hi {{contact.firstName}}, thanks for contacting {{business.name}}!' }
          : type === 'wait'
          ? { delayMinutes: 1440, cancellationConditions: ['ESTIMATE_ACCEPTED'] }
          : type === 'condition'
          ? { field: 'rating', operator: 'greater_than', value: 3 }
          : {},
    };

    const updatedNodes = [...version.nodesConfig, newNode];
    let updatedEdges = [...version.edgesConfig];

    // If there's a last node, connect to it automatically
    if (version.nodesConfig.length > 0) {
      const lastNode = version.nodesConfig[version.nodesConfig.length - 1];
      updatedEdges.push({
        id: `e_${lastNode.id}_${newNodeId}`,
        source: lastNode.id,
        target: newNodeId,
      });
    }

    onUpdateVersion({
      ...version,
      nodesConfig: updatedNodes,
      edgesConfig: updatedEdges,
    });

    setSelectedNodeId(newNodeId);
  };

  // Inline Step Insertion Handler
  const handleInsertStepAfter = (
    sourceNodeId: string,
    type: 'action' | 'condition' | 'wait',
    actionType?: string,
    name?: string
  ) => {
    const newNodeId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newNode: WorkflowNodeData = {
      id: newNodeId,
      type,
      name: name || `${type.toUpperCase()}: ${actionType || ''}`,
      actionType,
      config:
        type === 'action' && actionType === 'SEND_SMS'
          ? { message: 'Hi {{contact.firstName}}, thanks for contacting {{business.name}}!' }
          : type === 'wait'
          ? { delayMinutes: 1440, cancellationConditions: ['ESTIMATE_ACCEPTED'] }
          : type === 'condition'
          ? { field: 'rating', operator: 'greater_than', value: 3 }
          : {},
    };

    const targetEdges = version.edgesConfig.filter((e) => e.source === sourceNodeId);

    // Remove old direct edge from sourceNodeId
    let updatedEdges = version.edgesConfig.filter((e) => e.source !== sourceNodeId);

    // Add edge from sourceNodeId -> newNodeId
    updatedEdges.push({
      id: `e_${sourceNodeId}_${newNodeId}`,
      source: sourceNodeId,
      target: newNodeId,
    });

    // Reconnect newNodeId to original targets
    if (targetEdges.length > 0) {
      targetEdges.forEach((te) => {
        updatedEdges.push({
          id: `e_${newNodeId}_${te.target}`,
          source: newNodeId,
          target: te.target,
          label: te.label,
          conditionValue: te.conditionValue,
        });
      });
    }

    const updatedNodes = [...version.nodesConfig, newNode];

    onUpdateVersion({
      ...version,
      nodesConfig: updatedNodes,
      edgesConfig: updatedEdges,
    });

    setSelectedNodeId(newNodeId);
  };

  const handleDeleteNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedNodes = version.nodesConfig.filter((n) => n.id !== nodeId);
    const updatedEdges = version.edgesConfig.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);

    if (selectedNodeId === nodeId) setSelectedNodeId(null);

    onUpdateVersion({
      ...version,
      nodesConfig: updatedNodes,
      edgesConfig: updatedEdges,
    });
  };

  const handleUpdateNodeConfig = (updatedNode: WorkflowNodeData) => {
    const updatedNodes = version.nodesConfig.map((n) => (n.id === updatedNode.id ? updatedNode : n));
    onUpdateVersion({
      ...version,
      nodesConfig: updatedNodes,
    });
  };

  return (
    <div className="flex h-[720px] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative text-slate-100 shadow-2xl">
      {/* Left Sidebar: Node Library */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 p-4 space-y-4 overflow-y-auto shrink-0">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 block mb-1">
            Node Library
          </span>
          <h3 className="font-bold text-xs text-slate-200">Click to Add Step</h3>
        </div>

        {/* Library Categories */}
        <div className="space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Actions
            </span>
            <div className="space-y-1.5">
              <button
                onClick={() => handleAddNodeFromLibrary('action', 'SEND_SMS', 'Send SMS')}
                className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs font-semibold flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span>Send SMS</span>
                </div>
                <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
              </button>

              <button
                onClick={() => handleAddNodeFromLibrary('action', 'SEND_EMAIL', 'Send Email')}
                className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs font-semibold flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Send Email</span>
                </div>
                <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
              </button>

              <button
                onClick={() => handleAddNodeFromLibrary('action', 'MOVE_KANBAN_CARD', 'Move Kanban Card')}
                className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs font-semibold flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Move Stage</span>
                </div>
                <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Logic & Branching
            </span>
            <button
              onClick={() => handleAddNodeFromLibrary('condition', undefined, 'Condition Branch')}
              className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs font-semibold flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                <span>Condition Branch</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
            </button>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Timing & Delay
            </span>
            <button
              onClick={() => handleAddNodeFromLibrary('wait', undefined, 'Wait / Delay')}
              className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs font-semibold flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Wait / Delay</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Center Interactive Visual Canvas */}
      <div className="flex-1 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] p-8 overflow-y-auto flex flex-col items-center">
        <div className="w-full max-w-xl space-y-4 py-4">
          {version.nodesConfig.length === 0 ? (
            <div className="text-center py-20 text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-sky-400 mx-auto" />
              <p className="font-bold text-slate-300">Canvas is empty</p>
              <p className="text-xs">Add a trigger node from the left library to start building your workflow.</p>
            </div>
          ) : (
            version.nodesConfig.map((node, index) => {
              const isSelected = selectedNodeId === node.id;
              const outgoingEdges = version.edgesConfig.filter((e) => e.source === node.id);

              return (
                <React.Fragment key={node.id}>
                  {/* Node Card */}
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full bg-slate-950 rounded-2xl border-2 p-5 shadow-xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-sky-500 ring-4 ring-sky-500/20 scale-[1.02]'
                        : node.type === 'trigger'
                        ? 'border-sky-900/60 hover:border-sky-700'
                        : node.type === 'action'
                        ? 'border-emerald-900/60 hover:border-emerald-700'
                        : node.type === 'condition'
                        ? 'border-amber-900/60 hover:border-amber-700'
                        : 'border-purple-900/60 hover:border-purple-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner ${
                            node.type === 'trigger'
                              ? 'bg-sky-500 text-white'
                              : node.type === 'action'
                              ? 'bg-emerald-500 text-white'
                              : node.type === 'condition'
                              ? 'bg-amber-500 text-white'
                              : 'bg-purple-500 text-white'
                          }`}
                        >
                          {index + 1}
                        </span>

                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            {node.type} {node.actionType ? `• ${node.actionType}` : ''}
                          </span>
                          <h4 className="font-bold text-sm text-slate-100">{node.name}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNodeId(node.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Config
                        </button>
                        {node.type !== 'trigger' && (
                          <button
                            onClick={(e) => handleDeleteNode(node.id, e)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Node Config Summary */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                      {node.type === 'trigger' && (
                        <span className="text-sky-300 font-mono text-[11px]">
                          Event: {node.config?.eventType || version.triggerConfig.eventType}
                          {node.config?.filters && node.config.filters.length > 0
                            ? ` (${node.config.filters.length} rules)`
                            : ''}
                        </span>
                      )}

                      {node.type === 'action' && (
                        <p className="text-slate-300 font-mono text-[11px] truncate">
                          "{node.config?.message || 'Action configured'}"
                        </p>
                      )}

                      {node.type === 'wait' && (
                        <div className="flex items-center gap-2 text-purple-300 text-[11px] font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            Duration: {node.config?.delayMinutes || 1440} mins
                            {node.config?.cancellationConditions?.length
                              ? ` (Cancels on ${node.config.cancellationConditions.join(', ')})`
                              : ''}
                          </span>
                        </div>
                      )}

                      {node.type === 'condition' && (
                        <div className="space-y-1">
                          <span className="text-amber-300 font-mono text-[11px]">
                            Rule: {node.config?.field || 'rating'} {node.config?.operator || '>'} {node.config?.value ?? 3}
                          </span>
                          <div className="flex items-center gap-3 pt-1 text-[10px] font-bold">
                            <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                              YES Branch &rarr;
                            </span>
                            <span className="bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
                              NO Branch &rarr;
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connector Arrow with Inline "+" Add Step Button */}
                  <div className="flex flex-col items-center justify-center my-1 relative group">
                    <div className="w-0.5 h-6 bg-slate-700"></div>

                    <button
                      onClick={() => {
                        setAddStepInsertAfterId(node.id);
                        setShowAddStepModal(true);
                      }}
                      className="w-7 h-7 rounded-full bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white border border-slate-600 shadow-lg flex items-center justify-center transition hover:scale-110 z-10"
                      title="Insert Step Here"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <div className="w-0.5 h-6 bg-slate-700"></div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>

      {/* Right Slide-Out Node Configuration Panel */}
      {selectedNode && (
        <NodeConfigSidebar
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onUpdateNode={handleUpdateNodeConfig}
        />
      )}

      {/* Inline Step Insertion Selector Modal */}
      <AddStepModal
        isOpen={showAddStepModal}
        onClose={() => setShowAddStepModal(false)}
        onSelectStep={(type, actionType, name) => {
          if (addStepInsertAfterId) {
            handleInsertStepAfter(addStepInsertAfterId, type, actionType, name);
          }
        }}
      />
    </div>
  );
};
