import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ReactFlow, Background, Controls, Handle, Position, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, Loader, Zap, Inbox, Sparkles } from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { ProcessingLoader } from '../components/ScanEffect';

const typeConfig = {
  victim: { color: '#8B2E2E', pinColor: '#E8463A', icon: '🕊', label: 'VICTIM', border: '#B33A32' },
  suspect: { color: '#8B2E2E', pinColor: '#E8463A', icon: '🎯', label: 'SUSPECT', border: '#B33A32' },
  person: { color: '#B08A52', pinColor: '#C5A66A', icon: '👤', label: 'PERSON', border: '#B08A52' },
  phone: { color: '#B9792E', pinColor: '#B08A52', icon: '📱', label: 'COMM', border: '#B9792E' },
  device: { color: '#B9792E', pinColor: '#B08A52', icon: '💳', label: 'DEVICE', border: '#B9792E' },
  vehicle: { color: '#5D3D28', pinColor: '#8A6042', icon: '🚗', label: 'VEHICLE', border: '#7A5135' },
  location: { color: '#4C7657', pinColor: '#5A9468', icon: '📍', label: 'LOCATION', border: '#4C7657' },
  evidence: { color: '#4C7657', pinColor: '#5A9468', icon: '📄', label: 'EVIDENCE', border: '#4C7657' },
};

function CustomNode({ data }) {
  const cfg = typeConfig[data.type] || typeConfig.evidence;
  const isSuspect = data.type === 'suspect';
  const isVictim = data.type === 'victim';

  return (
    <div style={{
      background: '#F4ECD8',
      color: '#1A140E',
      borderRadius: 2,
      padding: '12px 14px',
      minWidth: 120,
      maxWidth: 160,
      position: 'relative',
      boxShadow: '3px 4px 12px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
      border: `1px solid ${isSuspect ? '#B33A32' : '#D4C5A9'}`,
      fontFamily: "'IBM Plex Serif', Georgia, serif",
      userSelect: 'none',
    }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      {/* Realistic Push Pin at top center */}
      <div style={{
        position: 'absolute', top: -7, left: '50%',
        transform: 'translateX(-50%)',
        width: 14, height: 14, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, #fff, ${cfg.pinColor} 50%, #4A0E0E 100%)`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.6)',
        zIndex: 10,
      }} />

      {/* Top Tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, marginTop: 2 }}>
        <span style={{ fontSize: 13 }}>{cfg.icon}</span>
        <span style={{
          fontSize: 8, fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 800, letterSpacing: '0.12em',
          color: isSuspect ? '#8B2E2E' : '#7A5135',
          textTransform: 'uppercase',
        }}>
          {cfg.label}
        </span>
      </div>

      {/* Node label in typewriter / ink style */}
      <div style={{
        fontSize: 12, fontWeight: 800,
        color: isSuspect ? '#8B2E2E' : '#1A140E',
        lineHeight: 1.2,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {data.label}
      </div>

      {/* Detail notes */}
      {data.detail && (
        <div style={{
          fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
          color: '#5D4936', marginTop: 4,
          borderTop: '1px dashed #D4C5A9', paddingTop: 3,
          lineHeight: 1.2,
        }}>
          {data.score > 0 ? `RISK ${data.score}% · ` : ''}{data.detail}
        </div>
      )}

      {/* Prime suspect stamp watermark */}
      {isSuspect && data.score > 60 && (
        <div style={{
          position: 'absolute', bottom: 2, right: 2,
          fontSize: 7, fontWeight: 900,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(179, 58, 50, 0.4)',
          letterSpacing: '0.15em',
          transform: 'rotate(-12deg)',
          pointerEvents: 'none',
        }}>
          SUSPECT
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

export default function RelationshipGraph() {
  const { relationships, evidence, buildRelationships, loading } = useCase();

  // Convert AI response nodes to React Flow format
  const rfNodes = useMemo(() => {
    return (relationships.nodes || []).map(n => ({
      id: n.id,
      position: { x: n.x ?? 400, y: n.y ?? 300 },
      data: { label: n.label, type: n.type, detail: n.detail, score: n.score },
      type: 'custom',
    }));
  }, [relationships.nodes]);

  // Red string edge styling
  const rfEdges = useMemo(() => {
    return (relationships.edges || []).map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.strength === 'strong',
      style: {
        stroke: '#8B2E2E', // Classic detective red string
        strokeWidth: e.strength === 'strong' ? 3 : 2,
        strokeDasharray: e.strength === 'weak' ? '6 4' : undefined,
        opacity: 0.85,
      },
      labelStyle: {
        fill: '#FFF8E9',
        fontSize: 9,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
      },
      labelBgStyle: {
        fill: '#2E1C12',
        stroke: '#B08A52',
        strokeWidth: 1,
      },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 2,
    }));
  }, [relationships.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  useMemo(() => {
    if (rfNodes.length > 0) setNodes(rfNodes);
    if (rfEdges.length > 0) setEdges(rfEdges);
  }, [rfNodes, rfEdges]);

  const handleGenerate = async () => {
    try { await buildRelationships(); } catch (e) { console.error(e); }
  };

  return (
    <div style={{ padding: '24px 32px', height: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#8B2E2E', boxShadow: '0 0 6px #8B2E2E',
            }} />
            <h2 style={{
              fontSize: 24, fontWeight: 800,
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              color: '#FFF8E9', letterSpacing: '-0.01em',
            }}>
              The Investigation Evidence Board
            </h2>
          </div>
          <p style={{
            fontSize: 11, color: '#A89278',
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: 4,
          }}>
            {nodes.length > 0 ? `${nodes.length} PINNED NODES · ${edges.length} RED STRING CORRELATIONS` : 'CROSS-EVIDENCE TOPOLOGY CORRELATOR'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Legend index card */}
          {nodes.length > 0 && (
            <div style={{
              display: 'flex', gap: 12, alignItems: 'center',
              padding: '6px 14px', borderRadius: 2,
              background: 'rgba(244, 236, 216, 0.08)',
              border: '1px solid rgba(176, 138, 82, 0.3)',
            }}>
              {Object.entries(typeConfig).slice(0, 5).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11 }}>{val.icon}</span>
                  <span style={{
                    fontSize: 8, fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700, color: '#C5A66A', textTransform: 'uppercase',
                  }}>{key}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading.relationships || evidence.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 3,
              background: 'linear-gradient(135deg, #B08A52 0%, #7A5135 100%)',
              color: '#FFF8E9', border: '1px solid #C5A66A',
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: '0 3px 8px rgba(0,0,0,0.4)',
              opacity: (loading.relationships || evidence.length === 0) ? 0.5 : 1,
            }}
          >
            {loading.relationships ? <Loader size={13} className="animate-spin" /> : <Zap size={13} />}
            {nodes.length > 0 ? 'RE-PIN BOARD' : 'CONSTRUCT EVIDENCE BOARD'}
          </button>
        </div>
      </div>

      {/* ── CORKBOARD CANVASS ── */}
      <div
        className="corkboard"
        style={{
          flex: 1,
          borderRadius: 6,
          position: 'relative',
          overflow: 'hidden',
          border: '8px solid #3A2418', // Heavy dark walnut frame
          boxShadow: 'inset 0 4px 16px rgba(0,0,0,0.7), 0 8px 30px rgba(0,0,0,0.6)',
        }}
      >
        {/* Brass corner brackets on frame */}
        <div style={{ position: 'absolute', top: 4, left: 4, width: 14, height: 14, borderTop: '2px solid #C5A66A', borderLeft: '2px solid #C5A66A', zIndex: 10, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderTop: '2px solid #C5A66A', borderRight: '2px solid #C5A66A', zIndex: 10, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 4, left: 4, width: 14, height: 14, borderBottom: '2px solid #C5A66A', borderLeft: '2px solid #C5A66A', zIndex: 10, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderBottom: '2px solid #C5A66A', borderRight: '2px solid #C5A66A', zIndex: 10, pointerEvents: 'none' }} />

        {loading.relationships ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <ProcessingLoader label="PINNING EVIDENCE & THREADING RED YARN…" />
          </div>
        ) : nodes.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{
              textAlign: 'center', padding: '36px 48px',
              background: '#F4ECD8', borderRadius: 2,
              border: '1px solid #D4C5A9', maxWidth: 440,
              boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
              position: 'relative',
            }}>
              {/* Push pin on instruction note */}
              <div className="push-pin" style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)' }} />
              <Inbox size={36} color="#7A5135" style={{ margin: '0 auto 12px' }} />
              <h3 style={{
                fontSize: 18, fontWeight: 800,
                fontFamily: "'IBM Plex Serif', serif",
                color: '#1A140E', marginBottom: 6,
              }}>
                The Board is Empty
              </h3>
              <p style={{
                fontSize: 13, color: '#5D4936',
                fontFamily: "'IBM Plex Serif', serif",
                fontStyle: 'italic', lineHeight: 1.5,
              }}>
                {evidence.length === 0
                  ? 'Intake CCTV footage or phone records, then construct the evidence board.'
                  : 'Click "Construct Evidence Board" above to pin persons of interest, timeline events, and cross-reference them with red yarn.'}
              </p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: 'transparent' }}
          >
            <Background color="rgba(0,0,0,0.15)" gap={30} size={1} />
            <Controls style={{ background: '#2E1C12', border: '1px solid #B08A52', borderRadius: 3 }} />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
