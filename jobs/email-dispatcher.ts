/**
 * Email Dispatcher Worker
 *
 * Processes queued emails and sends them.
 * For MVP: Logs email details (stub for actual sending).
 * In production: Would integrate with SendGrid, AWS SES, or similar.
 */

import { Worker, Job } from 'bullmq';
import { redis } from '@/lib/redis';
import { QUEUE_NAMES } from '@/lib/queues';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

interface EmailJobData {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  notificationId?: number;
  tenantId: number;
}

interface EmailJobResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

/**
 * Format email content based on template
 * This is a simple text-based formatter for MVP
 * In production, would use HTML templates with a template engine
 */
function formatEmailContent(template: string, data: Record<string, any>): string {
  switch (template) {
    case 'document-expiry':
      return `
Dear ${data.recipientName || 'User'},

This is a reminder that a document is expiring soon:

Document: ${data.documentTitle}
Client: ${data.clientName}
Expiry Date: ${new Date(data.expiryDate).toLocaleDateString()}
Days Until Expiry: ${data.daysUntilExpiry}
Urgency: ${data.urgencyLevel}

Please take appropriate action to renew this document before it expires.

---
KGC Compliance Cloud
Automated Notification System
      `.trim();

    case 'filing-reminder':
      return `
Dear ${data.recipientName || 'User'},

This is a reminder that a filing deadline is approaching:

Filing Type: ${data.filingType}
Client: ${data.clientName}
Period: ${data.periodLabel || 'N/A'}
Due Date: ${new Date(data.periodEnd).toLocaleDateString()}
Days Until Due: ${data.daysUntilDue}
Current Status: ${data.status}
Urgency: ${data.urgencyLevel}

Please ensure this filing is completed and submitted before the deadline.

---
KGC Compliance Cloud
Automated Notification System
      `.trim();

    case 'compliance-alert':
      return `
Dear ${data.recipientName || 'User'},

Compliance Alert:

Client: ${data.clientName}
Compliance Score: ${data.complianceScore}%
Compliance Level: ${data.complianceLevel?.toUpperCase()}

Issues:
${data.issues?.map((issue: string) => `- ${issue}`).join('\n') || 'No issues listed'}

Recommendations:
${data.recommendations?.map((rec: string) => `- ${rec}`).join('\n') || 'No recommendations listed'}

Please review and take necessary action.

---
KGC Compliance Cloud
Automated Notification System
      `.trim();

    default:
      return `
Dear ${data.recipientName || 'User'},

${data.message || 'You have a new notification from KGC Compliance Cloud.'}

---
KGC Compliance Cloud
      `.trim();
  }
}

/**
 * Send email (MVP: logs to console, production: use email service)
 */
async function sendEmail(emailData: EmailJobData): Promise<EmailJobResult> {
  const { recipientEmail, recipientName, subject, template, data, tenantId } = emailData;

  try {
    // Format email content
    const emailContent = formatEmailContent(template, {
      ...data,
      recipientName,
    });

    // MVP: Log email instead of sending
    logger.info('📧 EMAIL DISPATCH (MVP - LOGGED ONLY)', {
      to: recipientEmail,
      toName: recipientName,
      subject,
      template,
      tenantId,
      timestamp: new Date().toISOString(),
    });

    logger.info('Email Content:', {
      content: emailContent,
    });

    // In production, would use email service:
    /*
    import nodemailer from 'nodemailer';

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@kgc-compliance.com',
      to: recipientEmail,
      subject: subject,
      text: emailContent,
      html: renderHTMLTemplate(template, data),
    });

    return {
      success: true,
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
    };
    */

    // MVP: Return success with mock message ID
    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to send email', error as Error, {
      recipientEmail,
      subject,
      template,
    });

    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Process email dispatch job
 */
async function processEmailDispatch(
  job: Job<EmailJobData>
): Promise<EmailJobResult> {
  const { notificationId, recipientEmail, subject } = job.data;

  logger.info('Processing email dispatch job', {
    jobId: job.id,
    recipientEmail,
    subject,
    notificationId,
  });

  try {
    // Send the email
    const result = await sendEmail(job.data);

    // Update notification status if notification ID provided
    if (notificationId && result.success) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          channelStatus: 'sent',
          metadata: {
            ...(job.data.data || {}),
            emailSentAt: result.timestamp,
            emailMessageId: result.messageId,
          },
        },
      });

      logger.info('Notification status updated to sent', {
        notificationId,
        messageId: result.messageId,
      });
    } else if (notificationId && !result.success) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          channelStatus: 'failed',
          metadata: {
            ...(job.data.data || {}),
            emailError: result.error,
            emailFailedAt: result.timestamp,
          },
        },
      });

      logger.error('Email failed, notification marked as failed', undefined, {
        notificationId,
        error: result.error,
      });
    }

    return result;
  } catch (error) {
    logger.error('Email dispatch job failed', error as Error, {
      jobId: job.id,
      recipientEmail,
    });
    throw error;
  }
}

/**
 * Create and start the email dispatcher worker
 */
export function createEmailDispatcherWorker() {
  const worker = new Worker<EmailJobData, EmailJobResult>(
    QUEUE_NAMES.EMAIL,
    processEmailDispatch,
    {
      connection: redis,
      concurrency: 5, // Process up to 5 emails concurrently
      limiter: {
        max: 100, // Max 100 emails per duration
        duration: 60000, // Per minute (rate limiting)
      },
    }
  );

  worker.on('completed', (job: Job, result: EmailJobResult) => {
    if (result.success) {
      logger.info('Email dispatched successfully', {
        jobId: job.id,
        recipientEmail: job.data.recipientEmail,
        messageId: result.messageId,
      });
    } else {
      logger.warn('Email dispatch completed but failed', {
        jobId: job.id,
        recipientEmail: job.data.recipientEmail,
        error: result.error,
      });
    }
  });

  worker.on('failed', (job: Job | undefined, error: Error) => {
    logger.error('Email dispatch job failed', error, {
      jobId: job?.id,
      recipientEmail: job?.data.recipientEmail,
    });
  });

  worker.on('error', (error: Error) => {
    logger.error('Email dispatcher worker error', error);
  });

  logger.info('Email dispatcher worker started');

  return worker;
}

export default createEmailDispatcherWorker;
