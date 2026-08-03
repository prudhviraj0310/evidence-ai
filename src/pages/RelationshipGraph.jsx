import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, Loader, Zap, Inbox } from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { ProcessingLoader } from '../components/ScanEffect';

const typeConfig = {
  victim: { color: '#ff0040', icon: '👤', glow: '0 0 20px rgba(255,0,64,0.4)' },
  suspect: { color: '#ff2d55', icon: '🔴', glow: '0 0 20px rgba(255,45,85,0.4)' },
  phone: { color: '#ffaa00', icon: '📱', glow: '0 0 15px rgba(255,170,0,0.3)' },
  vehicle: { color: '#a855f7', icon: '🚗', glow: '0 0 15px rgba(168,85,247,0.3)' },
  location: { color: '#00d4ff', icon: '📍', glow: '0 0 15px rgba(0,212,255,0.3)' },
  evidence: { color: '#00ff88', icon: '📄', glow: '0 0 15px rgba(0,255,136,0.3)' },
};

function CustomNode({ data }) {
  const cfg = typeConfig[data.type] || typeConfig.evidence;
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }}
      className="px-3 py-2 rounded-xl text-center cursor-pointer min-w-[100px]"
      style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}40`, boxShadow: cfg.glow }}>
      <div className="text-lg mb-0.5">{cfg.icon}</div>
      <div className="text-[10px] font-bold text-white truncate">{data.label}</div>
      <div className="text-[8px] font-mono mt-0.5" style={{ color: cfg.color }}>{data.detail}</div>
    </motion.div>
  );
}

const nodeTypes = { custom: CustomNode };

export default function RelationshipGraph() {
  const { relationships, evidence, buildRelationships, loading } = useCase();

  // Convert AI response nodes to React Flow format
  const rfNodes = useMemo(() => {
    return (relationships.nodes || []).map(n => ({
      id: n.id,
      position: { x: n.x || Math.random() * 600 + 50, y: n.y || Math.random() * 400 + 50 },
      data: { label: n.label, type: n.type, detail: n.detail },
      type: 'custom',
    }));
  }, [relationships.nodes]);

  const rfEdges = useMemo(() => {
    const strengthColors = { strong: '#ff2d55', medium: '#ffaa00', weak: '#00d4ff' };
    return (relationships.edges || []).map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.strength === 'strong',
      style: { stroke: strengthColors[e.strength] || '#666', strokeWidth: e.strength === 'strong' ? 2 : 1 },
    }));
  }, [relationships.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Update when relationships change
  useMemo(() => {
    if (rfNodes.length > 0) setNodes(rfNodes);
    if (rfEdges.length > 0) setEdges(rfEdges);
  }, [rfNodes, rfEdges]);

  const handleGenerate = async () => {
    try { await buildRelationships(); } catch (e) { console.error(e); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 h-[calc(100vh-56px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-white flex items-center gap-3">
            <GitBranch size={22} className="text-neon-blue" /> RELATIONSHIP MAP
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">
            {nodes.length > 0 ? `${nodes.length} nodes • ${edges.length} connections` : 'Generate from evidence using AI'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {nodes.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              {Object.entries(typeConfig).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="text-xs">{val.icon}</span>
                  <span className="text-[9px] font-mono text-gray-600 uppercase">{key}</span>
                </div>
              ))}
            </div>
          )}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleGenerate}
            disabled={loading.relationships || evidence.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-mono tracking-wider disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
            {loading.relationships ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
            {nodes.length > 0 ? 'REGENERATE' : 'BUILD GRAPH'}
          </motion.button>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-white/5" style={{ background: '#0a0a0f' }}>
        {loading.relationships ? (
          <div className="flex items-center justify-center h-full"><ProcessingLoader label="MAPPING RELATIONSHIPS" /></div>
        ) : nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Inbox size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-sm text-gray-500">{evidence.length === 0 ? 'Upload evidence first' : 'Click "Build Graph" to map relationships'}</p>
            </div>
          </div>
        ) : (
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }} style={{ background: 'transparent' }}>
            <Background color="#1a1a2e" gap={30} size={1} />
            <Controls />
          </ReactFlow>
        )}
      </div>
    </motion.div>
  );
}
