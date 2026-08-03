import { createContext, useContext, useReducer, useCallback } from 'react';
import * as api from '../services/api';
import { extractText, isOcrCompatible } from '../services/ocr';

const CaseContext = createContext(null);

const initialState = {
  evidence: [],
  timeline: [],
  contradictions: [],
  relationships: { nodes: [], edges: [] },
  summary: null,
  stats: { evidenceCount: 0, timelineEvents: 0, contradictionCount: 0, avgSuspicion: 0 },
  loading: {},  // track loading states per operation
  errors: {},
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.key]: action.value } };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.key]: action.value } };
    case 'ADD_EVIDENCE':
      return { ...state, evidence: [...state.evidence, action.payload], stats: { ...state.stats, evidenceCount: state.evidence.length + 1 } };
    case 'SET_TIMELINE':
      return { ...state, timeline: action.payload, stats: { ...state.stats, timelineEvents: action.payload.length } };
    case 'SET_CONTRADICTIONS':
      return { ...state, contradictions: action.payload, stats: { ...state.stats, contradictionCount: action.payload.length } };
    case 'SET_RELATIONSHIPS':
      return { ...state, relationships: action.payload };
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload };
    case 'SET_CASE':
      return { ...state, ...action.payload, stats: action.payload.stats || state.stats };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function CaseProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ═══ Upload + analyze evidence (real AI) ═══
  const uploadEvidence = useCallback(async (file, onProgress) => {
    dispatch({ type: 'SET_LOADING', key: 'upload', value: true });
    dispatch({ type: 'SET_ERROR', key: 'upload', value: null });
    try {
      let ocrText = '';
      // Run OCR on images
      if (isOcrCompatible(file)) {
        onProgress?.('ocr', 'Running OCR extraction...');
        const ocrResult = await extractText(file);
        ocrText = ocrResult.text;
        onProgress?.('ocr_done', `Extracted ${ocrResult.words} words (${ocrResult.confidence.toFixed(0)}% confidence)`);
      }

      onProgress?.('ai', 'Sending to Gemini AI for analysis...');
      const result = await api.analyzeEvidence(file, ocrText);

      if (result.success) {
        dispatch({ type: 'ADD_EVIDENCE', payload: { ...result.analysis, ocrText, originalFile: file.name } });
        onProgress?.('complete', 'Analysis complete');
        return result.analysis;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', key: 'upload', value: err.message });
      onProgress?.('error', err.message);
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'upload', value: false });
    }
  }, []);

  // ═══ Generate timeline (real AI) ═══
  const buildTimeline = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', key: 'timeline', value: true });
    try {
      const result = await api.generateTimeline();
      if (result.success) {
        dispatch({ type: 'SET_TIMELINE', payload: result.timeline });
        return result;
      }
      throw new Error(result.error);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', key: 'timeline', value: err.message });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'timeline', value: false });
    }
  }, []);

  // ═══ Detect contradictions (real AI) ═══
  const findContradictions = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', key: 'contradictions', value: true });
    try {
      const result = await api.detectContradictions();
      if (result.success) {
        dispatch({ type: 'SET_CONTRADICTIONS', payload: result.contradictions });
        return result;
      }
      throw new Error(result.error);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', key: 'contradictions', value: err.message });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'contradictions', value: false });
    }
  }, []);

  // ═══ Build relationship graph (real AI) ═══
  const buildRelationships = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', key: 'relationships', value: true });
    try {
      const result = await api.generateRelationships();
      if (result.success) {
        dispatch({ type: 'SET_RELATIONSHIPS', payload: { nodes: result.nodes, edges: result.edges } });
        return result;
      }
      throw new Error(result.error);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', key: 'relationships', value: err.message });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'relationships', value: false });
    }
  }, []);

  // ═══ Generate case summary (real AI) ═══
  const buildSummary = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', key: 'summary', value: true });
    try {
      const result = await api.generateSummary();
      if (result.success) {
        dispatch({ type: 'SET_SUMMARY', payload: result });
        return result;
      }
      throw new Error(result.error);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', key: 'summary', value: err.message });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'summary', value: false });
    }
  }, []);

  // ═══ Refresh full case state ═══
  const refreshCase = useCallback(async () => {
    try {
      const data = await api.getCaseState();
      dispatch({ type: 'SET_CASE', payload: data });
    } catch (err) {
      console.error('Failed to refresh case:', err);
    }
  }, []);

  const resetAll = useCallback(async () => {
    await api.resetCase();
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <CaseContext.Provider value={{
      ...state,
      uploadEvidence,
      buildTimeline,
      findContradictions,
      buildRelationships,
      buildSummary,
      refreshCase,
      resetAll,
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
