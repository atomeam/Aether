/**
 * Persistent Browser Client
 * Client for interacting with persistent browser service
 */

const http = require('http');

class PersistentBrowserClient {
  constructor(port = 3456) {
    this.port = port;
    this.baseUrl = `http://localhost:${port}`;
  }
  
  async navigateTo(url) {
    return this.request('/navigate', { url });
  }
  
  async clickElement(selector) {
    return this.request('/click', { selector });
  }
  
  async fillInput(selector, value) {
    return this.request('/fill', { selector, value });
  }
  
  async getPageInfo() {
    return this.request('/info');
  }
  
  async listInputs() {
    return this.request('/list-inputs');
  }
  
  async listButtons() {
    return this.request('/list-buttons');
  }
  
  async takeScreenshot() {
    return this.request('/screenshot');
  }
  
  async executeJavaScript(code) {
    return this.request('/execute-js', { code: encodeURIComponent(code) });
  }
  
  async hoverElement(selector) {
    return this.request('/hover', { selector });
  }
  
  async close() {
    return this.request('/close');
  }
  
  request(path, params = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(json.error || 'Request failed'));
            } else {
              resolve(json);
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }
}

module.exports = PersistentBrowserClient;
