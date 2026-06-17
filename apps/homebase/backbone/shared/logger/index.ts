import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Add file transport if logs directory exists
// Try multiple paths for logs directory
const possibleLogsDirs = [
  path.join(process.cwd(), 'backbone', 'logs'),
  path.join(process.cwd(), 'logs'),
  path.join(__dirname, '..', '..', 'logs')
];

let logsDir = null;
for (const testDir of possibleLogsDirs) {
  try {
    const fs = require('fs');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    logsDir = testDir;
    break;
  } catch (error) {
    continue;
  }
}

if (logsDir) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'orchestrator.log'),
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10
    })
  );
} else {
  console.warn('Could not create logs directory, file logging disabled');
}

export const logger = winston.createLogger({
  level: process.env.ORCHESTRATOR_LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  defaultMeta: {
    service: 'automation-orchestrator'
  }
});

export function createWorkflowLogger(workflowName: string, runId: string) {
  return logger.child({
    workflow: workflowName,
    run_id: runId
  });
}
