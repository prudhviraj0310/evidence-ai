// Local file storage adapter — implements StorageProvider using the filesystem.
// This preserves the existing behavior where everything is stored on disk.
const fs = require('fs');
const path = require('path');
const { StorageProvider } = require('../interfaces/StorageProvider');
const { sha256 } = require('../../core/util');

class FileStorageProvider extends StorageProvider {
  constructor(baseDir) {
    super();
    this.baseDir = baseDir || path.join(__dirname, '..', '..', 'server', 'data', 'vault');
  }

  _ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  async putEvidence(caseId, evidenceId, content, metadata = {}) {
    const dir = path.join(this.baseDir, 'cases', caseId, 'evidence', evidenceId);
    this._ensureDir(dir);
    const contentStr = typeof content === 'string' ? content : content.toString();
    const hash = sha256(contentStr);

    fs.writeFileSync(path.join(dir, 'content.txt'), contentStr);
    fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify({
      sha256: hash,
      contentType: metadata.contentType || 'text/plain',
      sourceType: metadata.sourceType || 'upload',
      timestamp: metadata.timestamp || new Date().toISOString(),
      uploader: metadata.uploader || 'system',
      caseId,
      evidenceId,
      ...metadata,
    }, null, 2));

    return { key: `cases/${caseId}/evidence/${evidenceId}`, hash, url: null };
  }

  async getEvidence(caseId, evidenceId) {
    const dir = path.join(this.baseDir, 'cases', caseId, 'evidence', evidenceId);
    if (!fs.existsSync(dir)) return null;
    const content = fs.readFileSync(path.join(dir, 'content.txt'), 'utf8');
    const metadata = JSON.parse(fs.readFileSync(path.join(dir, 'metadata.json'), 'utf8'));
    return { content, metadata };
  }

  async putDerived(caseId, category, filename, content) {
    const dir = path.join(this.baseDir, 'cases', caseId, 'derived', category);
    this._ensureDir(dir);
    fs.writeFileSync(path.join(dir, filename), typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    return { key: `cases/${caseId}/derived/${category}/${filename}` };
  }

  async getDerived(caseId, category, filename) {
    const fp = path.join(this.baseDir, 'cases', caseId, 'derived', category, filename);
    if (!fs.existsSync(fp)) return null;
    return { content: fs.readFileSync(fp, 'utf8') };
  }

  async putFrame(caseId, cameraId, frameId, buffer) {
    const dir = path.join(this.baseDir, 'cases', caseId, 'derived', 'frames', cameraId);
    this._ensureDir(dir);
    const hash = sha256(buffer);
    fs.writeFileSync(path.join(dir, `${frameId}.jpg`), buffer);
    return { key: `cases/${caseId}/derived/frames/${cameraId}/${frameId}.jpg`, hash };
  }

  async getSignedUrl(key) {
    return `file://${path.join(this.baseDir, key)}`;
  }

  async verifyIntegrity(key, expectedHash) {
    const fp = path.join(this.baseDir, key);
    if (!fs.existsSync(fp)) return false;
    const content = fs.readFileSync(fp);
    return sha256(content) === expectedHash;
  }

  async putAuditEvent(caseId, event) {
    const dir = path.join(this.baseDir, 'cases', caseId, 'audit', 'events');
    this._ensureDir(dir);
    const filename = `${event.timestamp || new Date().toISOString()}_${event.type || 'UNKNOWN'}.json`;
    fs.writeFileSync(path.join(dir, filename.replace(/:/g, '-')), JSON.stringify(event, null, 2));
    return { key: `cases/${caseId}/audit/events/${filename}` };
  }
}

module.exports = { FileStorageProvider };
