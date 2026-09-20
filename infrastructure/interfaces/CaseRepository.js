// Case Repository Interface — abstracts DynamoDB / local JSON store.
// Every record must contain: caseId, createdAt, updatedAt.

/**
 * @interface CaseRepository
 * @method createCase(caseData) → case
 * @method getCase(caseId) → case
 * @method updateCase(caseId, updates) → case
 * @method listCases(userId) → cases[]
 * @method deleteCase(caseId) → void
 * @method addEvidence(caseId, evidence) → evidence
 * @method getEvidence(caseId, evidenceId) → evidence
 * @method addClaim(caseId, claim) → claim
 * @method getClaims(caseId, filters) → claims[]
 * @method addEntity(caseId, entity) → entity
 * @method getEntities(caseId) → entities[]
 * @method addAuditEvent(caseId, event) → event
 * @method getAuditEvents(caseId, filters) → events[]
 * @method query(caseId, params) → results
 */
class CaseRepository {
  async createCase(caseData) { throw new Error('Not implemented'); }
  async getCase(caseId) { throw new Error('Not implemented'); }
  async updateCase(caseId, updates) { throw new Error('Not implemented'); }
  async listCases(userId) { throw new Error('Not implemented'); }
  async deleteCase(caseId) { throw new Error('Not implemented'); }
  async addEvidence(caseId, evidence) { throw new Error('Not implemented'); }
  async getEvidence(caseId, evidenceId) { throw new Error('Not implemented'); }
  async addClaim(caseId, claim) { throw new Error('Not implemented'); }
  async getClaims(caseId, filters) { throw new Error('Not implemented'); }
  async addEntity(caseId, entity) { throw new Error('Not implemented'); }
  async getEntities(caseId) { throw new Error('Not implemented'); }
  async addAuditEvent(caseId, event) { throw new Error('Not implemented'); }
  async getAuditEvents(caseId, filters) { throw new Error('Not implemented'); }
  async query(caseId, params) { throw new Error('Not implemented'); }
}

// Audit event types from §23
const AUDIT_EVENTS = {
  CASE_CREATED: 'CASE_CREATED',
  EVIDENCE_UPLOADED: 'EVIDENCE_UPLOADED',
  EVIDENCE_HASHED: 'EVIDENCE_HASHED',
  AI_EXTRACTION_STARTED: 'AI_EXTRACTION_STARTED',
  AI_EXTRACTION_COMPLETED: 'AI_EXTRACTION_COMPLETED',
  AI_EXTRACTION_FAILED: 'AI_EXTRACTION_FAILED',
  CLAIM_CREATED: 'CLAIM_CREATED',
  ENTITY_MERGED: 'ENTITY_MERGED',
  ENTITY_MERGE_REJECTED: 'ENTITY_MERGE_REJECTED',
  CORRELATION_CREATED: 'CORRELATION_CREATED',
  HYPOTHESIS_CREATED: 'HYPOTHESIS_CREATED',
  DEFENSE_COUNSEL_RUN: 'DEFENSE_COUNSEL_RUN',
  HONESTY_GATE_TRIGGERED: 'HONESTY_GATE_TRIGGERED',
  HONESTY_GATE_PASSED: 'HONESTY_GATE_PASSED',
  VERDICT_GENERATED: 'VERDICT_GENERATED',
  REPORT_EXPORTED: 'REPORT_EXPORTED',
  INCIDENT_DETECTED: 'INCIDENT_DETECTED',
  INCIDENT_CASE_CREATED: 'INCIDENT_CASE_CREATED',
  PIPELINE_STARTED: 'PIPELINE_STARTED',
  PIPELINE_COMPLETED: 'PIPELINE_COMPLETED',
  PIPELINE_FAILED: 'PIPELINE_FAILED',
  CAMERA_EVENT: 'CAMERA_EVENT',
  SEARCH_EXECUTED: 'SEARCH_EXECUTED',
};

module.exports = { CaseRepository, AUDIT_EVENTS };
