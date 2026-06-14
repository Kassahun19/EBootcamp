import express from 'express';
import nodemailer from 'nodemailer';
import { dbStore } from './db.js';

// Admin recipient target email address as requested
const ADMIN_EMAIL = 'kassahunmulatu273@gmail.com, kmulatu21@gmail.com';

export interface AdminNotification {
  id: number;
  user_id: number | null;
  type: string;
  subject: string;
  message: string;
  file_url?: string;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
}

/**
 * Constructs an active transporter for Nodemailer using environment variables.
 * Fallback config check ensures complete reliability even if user secrets are pending.
 */
function createSmtpTransporter() {
  const host = process.env.SMTP_HOST || '';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const secure = process.env.SMTP_SECURE === 'true';

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
  }

  // Return null if SMTP is unconfigured to let sending fail safely as transient error
  return null;
}

/**
 * Formats a highly styled HTML email template with robust table layout, clear visual accents,
 * enterprise colors, and responsive details for the administrator.
 */
function buildHtmlEmail(notif: AdminNotification, userDetails: any) {
  const fileLinkHtml = notif.file_url
    ? `<div style="margin-top: 15px; padding: 12px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
         <strong style="color: #15803d; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px;">📂 Document Attached:</strong>
         <a href="${process.env.APP_URL || ''}${notif.file_url}" style="color: #047857; font-weight: bold; text-decoration: underline;" target="_blank">
           View / Download Receipt File
         </a>
       </div>`
    : '';

  return `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 40px 20px; line-height: 1.6; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
        
        <!-- Header Banner -->
        <div style="background-color: #047857; padding: 25px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">
            📢 EZANA ACADEMY NOTIFICATION
          </h2>
          <p style="color: #a7f3d0; margin: 5px 0 0 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
            ${notif.type.replace('_', ' ')} Received
          </p>
        </div>

        <!-- Email Body -->
        <div style="padding: 30px;">
          <p style="margin-top: 0; font-size: 14px; color: #64748b;">
            Hello Administrator, a new form submission was entered on Ezana Academy. Below are the registered details.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 700; color: #475569; width: 150px; font-size: 12px; text-transform: uppercase;">Submitter Name:</td>
                <td style="padding: 10px 0; color: #0f172a; font-size: 13px;">${userDetails.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 700; color: #475569; font-size: 12px; text-transform: uppercase;">Submitter Email:</td>
                <td style="padding: 10px 0; color: #0f172a; font-size: 13px; font-family: monospace;">${userDetails.email}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 700; color: #475569; font-size: 12px; text-transform: uppercase;">User Role:</td>
                <td style="padding: 10px 0; color: #0f172a; font-size: 13px;"><span style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${userDetails.role}</span></td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 700; color: #475569; font-size: 12px; text-transform: uppercase;">Message Type:</td>
                <td style="padding: 10px 0; color: #047857; font-weight: 700; font-size: 13px; text-transform: capitalize;">${notif.type.replace('_', ' ')}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 700; color: #475569; font-size: 12px; text-transform: uppercase;">Date & Time:</td>
                <td style="padding: 10px 0; color: #0f172a; font-size: 12px; font-family: monospace;">${new Date(notif.created_at).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: 700; color: #475569; font-size: 12px; text-transform: uppercase; vertical-align: top;">Subject:</td>
                <td style="padding: 10px 0; color: #0f172a; font-size: 13px; font-weight: 600;">${notif.subject}</td>
              </tr>
            </tbody>
          </table>

          <!-- Full Content block -->
          <div style="margin-top: 20px; padding: 18px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <strong style="font-size: 11px; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 8px;">Full Message Content:</strong>
            <p style="margin: 0; color: #334155; font-size: 13px; white-space: pre-line; line-height: 1.5;">"${notif.message}"</p>
          </div>

          ${fileLinkHtml}

          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.APP_URL || ''}/#/admin/dashboard" style="background-color: #047857; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 12px; font-weight: 700; border-radius: 6px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
              Manage in Admin Panel
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 500;">
            This email was generated automatically by Ezana Academy's Unified Notification Core.
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Action logic to send the email using Nodemailer.
 * Returns true if sent successfully, or false if it failed.
 */
export async function sendNotificationEmail(notif: AdminNotification): Promise<boolean> {
  const users = dbStore.getTable('users');
  let userDetails = { name: 'Guest Visitor', email: 'guest@ezana.com', role: 'Guest' };

  if (notif.user_id) {
    const user = users.find(u => u.id === notif.user_id);
    if (user) {
      const roleMap: Record<number, string> = { 1: 'Admin', 2: 'Lecturer', 3: 'Student' };
      userDetails = {
        name: user.name,
        email: user.email,
        role: roleMap[user.roleId] || 'Student'
      };
    }
  }

  const transporter = createSmtpTransporter();
  if (!transporter) {
    console.warn(`[NOTIFIER] SMTP is not configured. Falling back. Email saved for retry: ID ${notif.id}`);
    return false;
  }

  try {
    // Collect all unique administrator emails (hardcoded list + registered DB administrators)
    const adminEmails = new Set<string>();
    adminEmails.add('kassahunmulatu273@gmail.com');
    adminEmails.add('kmulatu21@gmail.com');
    
    // Add registered DB admin emails (where roleId === 1)
    const registeredAdmins = users.filter(u => u.roleId === 1);
    registeredAdmins.forEach(u => {
      if (u.email && u.email.trim().includes('@')) {
        adminEmails.add(u.email.toLowerCase().trim());
      }
    });

    const finalRecipientString = Array.from(adminEmails).join(', ');

    const mailOptions = {
      from: `"Ezana Academy Notifier" <${process.env.SMTP_USER || 'notifier@ezana.com'}>`,
      to: finalRecipientString,
      subject: `[Ezana Admin] ${notif.subject} (${notif.type.replace('_', ' ').toUpperCase()})`,
      html: buildHtmlEmail(notif, userDetails)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[NOTIFIER] Email dispatched successfully to [${finalRecipientString}]. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[NOTIFIER] Failed to send email for notification ID ${notif.id}:`, error);
    return false;
  }
}

/**
 * Creates, stores, and instantly dispatches a notification.
 */
export async function triggerAdminNotification(
  userId: number | null,
  type: string,
  subject: string,
  message: string,
  file_url?: string
): Promise<AdminNotification> {
  // Save record immediately in local database.json with email_sent: false
  const notifRecord = dbStore.insert('notifications', {
    user_id: userId,
    type,
    subject,
    message,
    file_url,
    is_read: false,
    email_sent: false,
    created_at: new Date().toISOString()
  });

  // Attempt instant email dispatch
  const sent = await sendNotificationEmail(notifRecord);
  if (sent) {
    dbStore.update('notifications', notifRecord.id, { email_sent: true });
    notifRecord.email_sent = true;
  }

  return notifRecord;
}

/**
 * Worker routine that periodically tries to retry sending failed emails
 */
export async function runRetryWorker() {
  try {
    const notifs = dbStore.getTable('notifications');
    const pending = notifs.filter(n => n.email_sent === false && n.type && n.type !== 'system_user');
    
    if (pending.length === 0) return;
    
    console.log(`[NOTIFIER RETRY] Found ${pending.length} pending emails to retry processing...`);
    for (const notif of pending) {
      // Re-map fields if it was structured from older DB versions
      const adminNotif: AdminNotification = {
        id: notif.id,
        user_id: notif.user_id !== undefined ? notif.user_id : (notif.userId || null),
        type: notif.type || 'system_notification',
        subject: notif.subject || notif.title || 'Notification',
        message: notif.message || '',
        file_url: notif.file_url || notif.receiptUrl || '',
        is_read: notif.is_read !== undefined ? notif.is_read : (notif.isRead || false),
        email_sent: notif.email_sent || false,
        created_at: notif.created_at || notif.createdAt || new Date().toISOString()
      };

      const success = await sendNotificationEmail(adminNotif);
      if (success) {
        dbStore.update('notifications', notif.id, { email_sent: true });
        console.log(`[NOTIFIER RETRY] Successfully resent notification ID: ${notif.id}`);
      }
    }
  } catch (error) {
    console.error('[NOTIFIER RETRY WORKER ERROR]:', error);
  }
}

/**
 * Start the notification background retry loop (checks every 60 seconds)
 */
export function startRetryWorker() {
  console.log('[NOTIFIER] Starting automatic background email retry service (60s loop)...');
  setInterval(runRetryWorker, 60000);
}

// ROUTER FOR ADMIN NOTIFICATIONS MANAGEMENT
export const adminNotificationsRouter = express.Router();

// Helper to check token & auth admin role (mapped directly here to prevent express import cycles)
const REQUIRE_ADMIN = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Missing session token.' });
  }
  try {
    const decoded: any = nodemailer.createTransport ? (jwtDecodeShim(token)) : null; // Safe parsing
    if (decoded && decoded.roleId === 1) {
      req.user = decoded;
      next();
    } else {
      res.status(403).json({ message: 'Restricted access.' });
    }
  } catch (e) {
    res.status(403).json({ message: 'Session expired.' });
  }
};

function jwtDecodeShim(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch(e) {
    return null;
  }
}

// GET ALL FOR ADMINS INCLUDING GUEST SUBMISSIONS
adminNotificationsRouter.get('/api/admin/notifications', (req, res) => {
  // Return all notifications sorted newest first. Filter system-only student updates if needed
  const notifs = dbStore.getTable('notifications');
  const users = dbStore.getTable('users');

  const detailedNotifs = notifs.map(n => {
    // Legacy support normalization
    const mapped: AdminNotification = {
      id: n.id,
      user_id: n.user_id !== undefined ? n.user_id : (n.userId || null),
      type: n.type || 'system_notification',
      subject: n.subject || n.title || 'System Broadcast',
      message: n.message || '',
      file_url: n.file_url || n.receiptUrl || '',
      is_read: n.is_read !== undefined ? n.is_read : (n.isRead || false),
      email_sent: n.email_sent || false,
      created_at: n.created_at || n.createdAt || new Date().toISOString()
    };

    let senderName = 'Guest Visitor';
    let senderEmail = 'guest@ezana.com';
    let senderRole = 'Guest';

    if (mapped.user_id) {
      const user = users.find(u => u.id === mapped.user_id);
      if (user) {
        const roleMap: Record<number, string> = { 1: 'Admin', 2: 'Lecturer', 3: 'Student' };
        senderName = user.name;
        senderEmail = user.email;
        senderRole = roleMap[user.roleId] || 'Student';
      }
    }

    return {
      ...mapped,
      senderName,
      senderEmail,
      senderRole
    };
  }).reverse(); // Sort newest first

  res.json(detailedNotifs);
});

// GET UNREAD COUNT
adminNotificationsRouter.get('/api/admin/notifications/unread-count', (req, res) => {
  const notifs = dbStore.getTable('notifications');
  const count = notifs.filter(n => {
    const isRead = n.is_read !== undefined ? n.is_read : (n.isRead || false);
    const type = n.type || 'system_notification';
    return isRead === false && type !== 'system_user'; // Skip normal student banners
  }).length;
  res.json({ count });
});

// MARK READ
adminNotificationsRouter.patch('/api/admin/notifications/:id/read', (req, res) => {
  const id = parseInt(req.params.id);
  const updated = dbStore.update('notifications', id, { is_read: true, isRead: true });
  if (updated) {
    res.json({ success: true, notification: updated });
  } else {
    res.status(404).json({ message: 'Notification not found' });
  }
});

// MARK UNREAD
adminNotificationsRouter.patch('/api/admin/notifications/:id/unread', (req, res) => {
  const id = parseInt(req.params.id);
  const updated = dbStore.update('notifications', id, { is_read: false, isRead: false });
  if (updated) {
    res.json({ success: true, notification: updated });
  } else {
    res.status(404).json({ message: 'Notification not found' });
  }
});

// DELETE
adminNotificationsRouter.delete('/api/admin/notifications/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = dbStore.delete('notifications', id);
  if (deleted) {
    res.json({ success: true });
  } else {
    res.status(404).json({ message: 'Notification not found' });
  }
});

// FORCE DISPATCH RETRY MANUALLY
adminNotificationsRouter.post('/api/admin/notifications/retry', async (req, res) => {
  await runRetryWorker();
  res.json({ success: true, message: 'SMTP Resend retry routine has run!' });
});

// POST SIMULATE GUEST/USER GENERATED MESSAGES REQUESTS
adminNotificationsRouter.post('/api/admin/notifications/simulate', async (req, res) => {
  const { type, name, email, subject, message, file_url } = req.body;
  
  // Custom mock user lookup or seed insert
  let matchedUserId = null;
  const users = dbStore.getTable('users');
  const matchedUser = users.find(u => u.email.toLowerCase() === String(email || '').toLowerCase().trim());
  if (matchedUser) {
    matchedUserId = matchedUser.id;
  }

  const notif = await triggerAdminNotification(
    matchedUserId,
    type || 'other',
    subject || 'Simulation Alert',
    message || 'This is a simulation alert.',
    file_url
  );

  res.json({ success: true, notification: notif });
});
