/**
 * Send Notification Workflow
 * 
 * Sends email notifications for workflow results, alerts, and system status.
 * Uses PowerShell's Send-MailMessage for Windows compatibility.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { JobContext, JobResult } from '../backbone/shared/types/job';

const execAsync = promisify(exec);

interface NotificationConfig {
  to: string;
  subject: string;
  body: string;
  priority?: 'Low' | 'Normal' | 'High';
}

export async function handler(context: JobContext): Promise<JobResult> {
  const { input, config, logger, runId } = context;
  
  try {
    logger.info('Send notification workflow started', { input });
    
    // Get notification details from input
    const notification: NotificationConfig = {
      to: input.to as string || config.notification?.email || 'default@example.com',
      subject: input.subject as string || 'Automation Orchestrator Notification',
      body: input.body as string || 'No message content provided',
      priority: (input.priority as string) || 'Normal'
    };
    
    logger.info('Sending notification', { 
      to: notification.to, 
      subject: notification.subject 
    });
    
    // Use PowerShell to send email (Windows native)
    const psScript = `
      $EmailFrom = "automation@orchestrator.local"
      $EmailTo = "${notification.to}"
      $Subject = "${notification.subject}"
      $Body = "${notification.body}"
      $SMTPServer = "smtp.gmail.com"
      $SMTPPort = 587
      $Credential = Get-Credential
      
      Send-MailMessage -From $EmailFrom -To $EmailTo -Subject $Subject -Body $Body -SmtpServer $SMTPServer -Port $SMTPPort -UseSsl -Credential $Credential
    `;
    
    // For demo purposes, we'll log the notification instead of actually sending
    // (real email sending requires SMTP credentials)
    logger.info('Notification prepared (demo mode - not actually sent)', {
      to: notification.to,
      subject: notification.subject,
      bodyLength: notification.body.length
    });
    
    // In production, uncomment this to actually send:
    // await execAsync(`powershell -Command "${psScript}"`);
    
    const result = {
      timestamp: new Date().toISOString(),
      notification,
      sent: false, // Set to true when actually implementing email
      mode: 'demo',
      message: 'Notification prepared. Configure SMTP credentials to enable actual email sending.'
    };
    
    logger.info('Send notification workflow completed', result);
    
    return {
      runId,
      status: 'completed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 1000,
      output: result
    };
  } catch (error) {
    logger.error('Send notification workflow failed', { 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });
    
    return {
      runId,
      status: 'failed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      error: error as Error,
      output: {
        success: false,
        error: (error as Error).message
      }
    };
  }
}

/**
 * Helper function to send alert notifications from other workflows
 */
export async function sendAlertNotification(
  workflowName: string, 
  severity: 'low' | 'medium' | 'high',
  message: string,
  logger: any
): Promise<void> {
  try {
    logger.info('Sending alert notification', { workflowName, severity });
    
    // In production, this would call the notification workflow
    // For now, we'll just log it
    logger.warn(`ALERT [${severity.toUpperCase()}] ${workflowName}: ${message}`);
    
  } catch (error) {
    logger.error('Failed to send alert notification', { error });
  }
}