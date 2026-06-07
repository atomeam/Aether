const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZDRiODBiNC01N2Q4LTQ3ZDEtOTUzOC0xNzRkZTFhYzgzYzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTE5YzE0ODYtZjdjZS00ZjE2LTkwYzMtMWNlYTI5Y2YzYzFiIiwiaWF0IjoxNzgwNzExNzIwfQ.otDotqXIltpfH9u9lH4wa-02mzhYJg-MBf0pF_U-NnM';

// Read the workflow
const workflowData = JSON.parse(fs.readFileSync('C:\\Users\\adamm\\Aether\\workflow-full.json', 'utf8'));

// Remove the problematic Slack nodes entirely
workflowData.nodes = workflowData.nodes.filter(node => 
  node.name !== 'Post Heartbeat to Slack' && node.name !== 'Post to Slack' && node.name !== 'Prepare Heartbeat' && node.name !== 'Hourly Heartbeat'
);

// Remove connections to those nodes
delete workflowData.connections['Post to Slack'];
delete workflowData.connections['Post Heartbeat to Slack'];
delete workflowData.connections['Prepare Heartbeat'];
delete workflowData.connections['Hourly Heartbeat'];

// Remove the problematic fields
delete workflowData.staticData;
delete workflowData.meta;
delete workflowData.nodeGroups;
delete workflowData.pinData;
delete workflowData.versionId;
delete workflowData.activeVersionId;
delete workflowData.versionCounter;
delete workflowData.triggerCount;
delete workflowData.shared;
delete workflowData.tags;
delete workflowData.activeVersion;
delete workflowData.updatedAt;
delete workflowData.createdAt;
delete workflowData.id;
delete workflowData.description;
delete workflowData.active;
delete workflowData.isArchived;

// Simplify settings to only required fields
workflowData.settings = {
  executionOrder: 'v1'
};

// Update the workflow
const data = JSON.stringify(workflowData);

const options = {
  hostname: 'a-to-mind.app.n8n.cloud',
  port: 443,
  path: '/api/v1/workflows/N9DGvOr3EZQm5gxH',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-N8N-API-KEY': API_KEY,
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(data);
req.end();