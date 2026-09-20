// Storage Provider Interface — abstracts S3 / filesystem for evidence storage.
// Every uploaded object must have: SHA-256 hash, content type, source type,
// timestamp, uploader, case ID, evidence ID.

/**
 * @interface StorageProvider
 * @method putEvidence(caseId, evidenceId, content, metadata) → { key, hash, url }
 * @method getEvidence(caseId, evidenceId) → { content, metadata }
 * @method putDerived(caseId, category, filename, content) → { key }
 * @method getDerived(caseId, category, filename) → { content }
 * @method putFrame(caseId, cameraId, frameId, jpegBuffer) → { key, hash }
 * @method getSignedUrl(key, expiresIn) → string
 * @method verifyIntegrity(key, expectedHash) → boolean
 * @method putAuditEvent(caseId, event) → { key }
 */
class StorageProvider {
  async putEvidence(caseId, evidenceId, content, metadata) { throw new Error('Not implemented'); }
  async getEvidence(caseId, evidenceId) { throw new Error('Not implemented'); }
  async putDerived(caseId, category, filename, content) { throw new Error('Not implemented'); }
  async getDerived(caseId, category, filename) { throw new Error('Not implemented'); }
  async putFrame(caseId, cameraId, frameId, jpegBuffer) { throw new Error('Not implemented'); }
  async getSignedUrl(key, expiresIn) { throw new Error('Not implemented'); }
  async verifyIntegrity(key, expectedHash) { throw new Error('Not implemented'); }
  async putAuditEvent(caseId, event) { throw new Error('Not implemented'); }
}

module.exports = { StorageProvider };
