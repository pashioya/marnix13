import { SupabaseClient } from '@supabase/supabase-js';

export interface EmailNotificationService {
  sendApprovalNotification(user: {
    id: string;
    name: string;
    email: string;
  }): Promise<void>;

  sendRejectionNotification(
    user: {
      id: string;
      name: string;
      email: string;
    },
    reason?: string,
  ): Promise<void>;
}

export function createEmailNotificationService(
  supabaseClient: SupabaseClient,
  siteUrl: string = 'http://localhost:3000',
): EmailNotificationService {
  return {
    async sendApprovalNotification(user) {
      try {
        // Send approval notification email
        await sendCustomEmail(supabaseClient, {
          to: user.email,
          subject: 'Welcome to Marnix 13! Your account has been approved',
          template: 'approval',
          variables: {
            name: user.name,
            email: user.email,
            siteUrl,
          },
        });

        console.log(
          `[EMAIL] Approval notification sent to ${user.email} (${user.name})`,
        );
      } catch (error) {
        console.error('Failed to send approval notification:', error);
        throw error;
      }
    },

    async sendRejectionNotification(user, reason) {
      try {
        // Send rejection notification email
        await sendCustomEmail(supabaseClient, {
          to: user.email,
          subject: 'Account Request Update - Marnix 13',
          template: 'rejection',
          variables: {
            name: user.name,
            email: user.email,
            reason: reason || 'No specific reason provided',
          },
        });

        console.log(
          `[EMAIL] Rejection notification sent to ${user.email} (${user.name})`,
        );
        if (reason) {
          console.log(`[EMAIL] Rejection reason: ${reason}`);
        }
      } catch (error) {
        console.error('Failed to send rejection notification:', error);
        throw error;
      }
    },
  };
}

// Helper function to send custom emails (console logging only for development)
//
// NOTE: This function currently only logs emails to the console for development/testing.
// For production, implement actual email sending via one of these methods:
// 1. SMTP service (nodemailer with Gmail, SendGrid, etc.)
// 2. Supabase Edge Functions with email providers
// 3. Third-party services like Resend, Mailgun, etc.
export async function sendCustomEmail(
  supabaseClient: SupabaseClient,
  params: {
    to: string;
    subject: string;
    template: 'approval' | 'rejection';
    variables: Record<string, string>;
  },
): Promise<void> {
  try {
    console.log(`[EMAIL] Sending ${params.template} email to ${params.to}`);
    console.log(`[EMAIL] Subject: ${params.subject}`);
    console.log(`[EMAIL] Variables:`, params.variables);

    // Generate email content
    const emailContent = generateEmailContent(
      params.template,
      params.variables,
    );
    console.log(`[EMAIL] Content preview:`, emailContent.slice(0, 200) + '...');

    // For now, just log the email content to console
    // This allows testing the approval/rejection flow without actual email sending
    console.log(
      `[EMAIL] ✅ Email logged for ${params.to} (implement actual sending for production)`,
    );
    console.log(`[EMAIL] Full email content:\n${emailContent}`);

    // TODO: For production, replace the console logging above with actual email sending:
    // Example with nodemailer:
    // const transporter = nodemailer.createTransporter({ ... });
    // await transporter.sendMail({
    //   from: 'noreply@yourdomain.com',
    //   to: params.to,
    //   subject: params.subject,
    //   text: emailContent,
    //   html: generateEmailContent(params.template, params.variables, 'html'),
    // });
  } catch (error) {
    console.error('Failed to send custom email:', error);
    throw error;
  }
}

// Helper function to generate email content based on template
function generateEmailContent(
  template: 'approval' | 'rejection',
  variables: Record<string, string>,
  format: 'text' | 'html' = 'text',
): string {
  if (template === 'approval') {
    if (format === 'html') {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #28a745;">Welcome to Marnix 13, ${variables.name}!</h1>
          
          <p>Your account has been approved and you now have access to all services.</p>
          
          <p><a href="${variables.siteUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Access Your Dashboard</a></p>
          
          <h3>Services available:</h3>
          <ul>
            <li>Jellyfin (Media Server)</li>
            <li>Nextcloud (Cloud Storage)</li>
            <li>Radarr (Movie Management)</li>
            <li>Sonarr (TV Series Management)</li>
            <li>Manga Reader</li>
          </ul>
          
          <p>Welcome to the community!</p>
        </div>
      `;
    } else {
      return `
        Welcome to Marnix 13, ${variables.name}!
        
        Your account has been approved and you now have access to all services.
        
        Access your dashboard: ${variables.siteUrl}
        
        Services available:
        - Jellyfin (Media Server)
        - Nextcloud (Cloud Storage)
        - Radarr (Movie Management)
        - Sonarr (TV Series Management)
        - Manga Reader
        
        Welcome to the community!
      `;
    }
  } else {
    if (format === 'html') {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc3545;">Account Request Update - ${variables.name}</h1>
          
          <p>Unfortunately, your account request has not been approved at this time.</p>
          
          ${
            variables.reason
              ? `<div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Reason:</strong> ${variables.reason}
          </div>`
              : ''
          }
          
          <p>You may submit a new request in the future if circumstances change.</p>
          
          <p>Thank you for your understanding.</p>
        </div>
      `;
    } else {
      return `
        Account Request Update - ${variables.name}
        
        Unfortunately, your account request has not been approved at this time.
        
        ${variables.reason ? `Reason: ${variables.reason}` : ''}
        
        You may submit a new request in the future if circumstances change.
        
        Thank you for your understanding.
      `;
    }
  }
}
