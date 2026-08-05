import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import * as api from '../services/api';
import { extractText, isOcrCompatible } from '../services/ocr';

const CaseContext = createContext(null);

const initialState = {
  evidence: [],
  timeline: [],
  contradictions: [],
  relationships: { nodes: [], edges: [] },
  verdict: null,
  summary: null,
  entities: [],
  mergeEvents: [],
  chat: [],
  health: null,
  consoleEvents: [],   // live SSE reasoning feed
  stats: { evidenceCount: 0, claimCount: 0, entityCount: 0, timelineEvents: 0, contradictionCount: 0, avgSuspicion: 0 },
  loading: {},
  errors: {},
  drawer: null,        // {evidenceId, highlight} → EvidenceDrawer
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.key]: action.value } };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.key]: action.value } };
    case 'ADD_EVIDENCE':
      return { ...state, evidence: [...state.evidence, action.payload], stats: { ...state.stats, evidenceCount: state.evidence.length + 1 } };
    case 'SET_CASE':
      return {
        ...state,
        ...action.payload,
        relationships: action.payload.relationships?.nodes ? action.payload.relationships : state.relationships,
        stats: action.payload.stats || state.stats,
      };
    case 'SET_HEALTH':
      return { ...state, health: action.payload };
    case 'CONSOLE_EVENT':
      return { ...state, consoleEvents: [...state.consoleEvents.slice(-199), action.payload] };
    case 'ADD_CHAT':
      return { ...state, chat: [...state.chat, action.payload] };
    case 'OPEN_DRAWER':
      return { ...state, drawer: action.payload };
    case 'CLOSE_DRAWER':
      return { ...state, drawer: null };
    case 'RESET':
      return { ...initialState, health: state.health };
    default:
      return state;
  }
}

export function CaseProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const streamRef = useRef(null);

  const refreshCase = useCallback(async () => {
    try {
      const data = await api.getCaseState();
      dispatch({ type: 'SET_CASE', payload: data });
    } catch (err) {
      console.error('Failed to refresh case:', err);
    }
  }, []);

  // Mount: rehydrate from the server (a refresh never wipes the demo),
  // open the live reasoning stream, and start health pings.
  useEffect(() => {
    refreshCase();
    streamRef.current = api.openStream((event) => dispatch({ type: 'CONSOLE_EVENT', payload: event }));
    const ping = async () => {
      try { dispatch({ type: 'SET_HEALTH', payload: await api.getHealth() }); }
      catch { dispatch({ type: 'SET_HEALTH', payload: null }); }
    };
    ping();
    const iv = setInterval(ping, 15000);
    return () => { streamRef.current?.close(); clearInterval(iv); };
  }, [refreshCase]);

  const withLoading = useCallback((key, fn) => async (...args) => {
    dispatch({ type: 'SET_LOADING', key, value: true });
    dispatch({ type: 'SET_ERROR', key, value: null });
    try {
      return await fn(...args);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', key, value: err.message });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', key, value: false });
    }
  }, []);

  const uploadEvidence = useCallback(async (file, onProgress) => {
    dispatch({ type: 'SET_LOADING', key: 'upload', value: true });
    dispatch({ type: 'SET_ERROR', key: 'upload', value: null });
    try {
      let ocrText = '';
      if (isOcrCompatible(file)) {
        onProgress?.('ocr', 'Running OCR extraction…');
        try {
          const ocrResult = await extractText(file);
          ocrText = ocrResult.text;
          onProgress?.('ocr_done', `Extracted ${ocrResult.words} words (${ocrResult.confidence.toFixed(0)}% confidence)`);
        } catch {
          onProgress?.('ocr_fail', 'OCR unavailable — sending file as-is');
        }
      }
      onProgress?.('ai', 'Parsing claims + resolving entities…');
      const result = await api.analyzeEvidence(file, ocrText);
      dispatch({ type: 'ADD_EVIDENCE', payload: { ...result.analysis, originalFile: file.name } });
      await refreshCase();
      onProgress?.('complete', 'Analysis complete');
      return result.analysis;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', key: 'upload', value: err.message });
      onProgress?.('error', err.message);
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'upload', value: false });
    }
  }, [refreshCase]);

  // ONE button: run the whole pipeline and land on the verdict.
  const solve = useCallback(async () => {
    return withLoading('solve', async () => {
      await api.solveCase();
      await refreshCase();
    })();
  }, [withLoading, refreshCase]);

  const askQuestion = useCallback(async (question) => {
    dispatch({ type: 'ADD_CHAT', payload: { role: 'user', text: question, at: new Date().toISOString() } });
    return withLoading('ask', async () => {
      const result = await api.askCase(question);
      dispatch({ type: 'ADD_CHAT', payload: { role: 'engine', ...result, at: new Date().toISOString() } });
      return result;
    })();
  }, [withLoading]);

  const loadDemoCase = useCallback(async (opts = {}) => {
    return withLoading('demo', async () => {
      await api.loadDemo(opts);
      await refreshCase();
    })();
  }, [withLoading, refreshCase]);

  const buildTimeline = useCallback(async () => {
    return withLoading('timeline', async () => { await api.generateTimeline(); await refreshCase(); })();
  }, [withLoading, refreshCase]);

  const findContradictions = useCallback(async () => {
    return withLoading('contradictions', async () => { await api.detectContradictions(); await refreshCase(); })();
  }, [withLoading, refreshCase]);

  const buildRelationships = useCallback(async () => {
    return withLoading('relationships', async () => { await api.generateRelationships(); await refreshCase(); })();
  }, [withLoading, refreshCase]);

  const buildSummary = useCallback(async () => {
    return withLoading('summary', async () => { await api.generateSummary(); await refreshCase(); })();
  }, [withLoading, refreshCase]);

  const resetAll = useCallback(async () => {
    await api.resetCase();
    dispatch({ type: 'RESET' });
  }, []);

  const openEvidence = useCallback((evidenceId, highlight = null) => {
    dispatch({ type: 'OPEN_DRAWER', payload: { evidenceId, highlight } });
  }, []);
  const closeEvidence = useCallback(() => dispatch({ type: 'CLOSE_DRAWER' }), []);

  return (
    <CaseContext.Provider value={{
      ...state,
      uploadEvidence,
      solve,
      askQuestion,
      loadDemoCase,
      buildTimeline,
      findContradictions,
      buildRelationships,
      buildSummary,
      refreshCase,
      resetAll,
      openEvidence,
      closeEvidence,
    }}>
      {children}
    </CaseContext.Provider>
  );
}

export function useCase() {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error('useCase must be used within CaseProvider');
  return ctx;
}
