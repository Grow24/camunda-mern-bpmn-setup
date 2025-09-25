import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import mjml from 'mjml';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email templates
const shareInvitationTemplate = `
<mjml>
  <mj-head>
    <mj-title>Share Invitation</mj-title>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
    <mj-attributes>
      <mj-all font-family="Inter, Arial, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="40px 20px">
      <mj-column>
        <mj-image width="60px" src="https://via.placeholder.com/60x60/3b82f6/ffffff?text=CS" alt="Collaborative Spreadsheet" />
        <mj-text font-size="24px" font-weight="600" color="#1f2937" align="center" padding-top="20px">
          {{sharedBy.name}} shared {{resource.type}} with you
        </mj-text>
        <mj-text font-size="16px" color="#6b7280" align="center" padding-top="10px">
          You've been invited to collaborate on "{{resource.name}}"
        </mj-text>
      </mj-column>
    </mj-section>
    
    <mj-section background-color="#ffffff" padding="0 20px 40px">
      <mj-column>
        <mj-table>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; font-weight: 500; color: #374151;">Resource:</td>
            <td style="padding: 12px 0; color: #6b7280;">{{resource.name}}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; font-weight: 500; color: #374151;">Type:</td>
            <td style="padding: 12px 0; color: #6b7280;">{{resource.type}}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; font-weight: 500; color: #374151;">Permission:</td>
            <td style="padding: 12px 0; color: #6b7280;">{{permission}}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 500; color: #374151;">Shared by:</td>
            <td style="padding: 12px 0; color: #6b7280;">{{sharedBy.name}} ({{sharedBy.email}})</td>
          </tr>
        </mj-table>
        
        {{#if message}}
        <mj-text font-size="14px" color="#374151" background-color="#f9fafb" padding="16px" border-radius="8px">
          <strong>Message:</strong><br>
          {{message}}
        </mj-text>
        {{/if}}
        
        <mj-button background-color="#3b82f6" color="#ffffff" font-size="16px" font-weight="500" border-radius="8px" padding="16px 32px" href="{{acceptUrl}}">
          Accept Invitation
        </mj-button>
        
        <mj-text font-size="12px" color="#9ca3af" align="center" padding-top="20px">
          If you don't want to accept this invitation, you can safely ignore this email.
        </mj-text>
      </mj-column>
    </mj-section>
    
    <mj-section background-color="#f8fafc" padding="20px">
      <mj-column>
        <mj-text font-size="12px" color="#6b7280" align="center">
          © 2024 Collaborative Spreadsheet. All rights reserved.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

const shareAcceptedTemplate = `
<mjml>
  <mj-head>
    <mj-title>Share Accepted</mj-title>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
    <mj-attributes>
      <mj-all font-family="Inter, Arial, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="40px 20px">
      <mj-column>
        <mj-image width="60px" src="https://via.placeholder.com/60x60/10b981/ffffff?text=✓" alt="Success" />
        <mj-text font-size="24px" font-weight="600" color="#1f2937" align="center" padding-top="20px">
          {{acceptedBy}} accepted your invitation
        </mj-text>
        <mj-text font-size="16px" color="#6b7280" align="center" padding-top="10px">
          They can now access "{{resource.name}}"
        </mj-text>
      </mj-column>
    </mj-section>
    
    <mj-section background-color="#ffffff" padding="0 20px 40px">
      <mj-column>
        <mj-button background-color="#3b82f6" color="#ffffff" font-size="16px" font-weight="500" border-radius="8px" padding="16px 32px" href="{{resourceUrl}}">
          Open {{resource.type}}
        </mj-button>
      </mj-column>
    </mj-section>
    
    <mj-section background-color="#f8fafc" padding="20px">
      <mj-column>
        <mj-text font-size="12px" color="#6b7280" align="center">
          © 2024 Collaborative Spreadsheet. All rights reserved.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

// Compile templates
const shareInvitationCompiled = handlebars.compile(shareInvitationTemplate);
const shareAcceptedCompiled = handlebars.compile(shareAcceptedTemplate);

interface ShareInvitationEmailData {
  to: string;
  sharedBy: {
    id: string;
    name: string;
    email: string;
  };
  resource: {
    type: 'spreadsheet' | 'folder';
    name: string;
    id: string;
  };
  permission: string;
  message?: string;
  token: string;
}

interface ShareAcceptedEmailData {
  to: string;
  acceptedBy: string;
  resource: {
    type: 'spreadsheet' | 'folder';
    name: string;
    id: string;
  };
}

export async function sendShareInvitationEmail(data: ShareInvitationEmailData) {
  try {
    const acceptUrl = `${process.env.APP_URL}/shared/${data.token}`;
    
    const mjmlContent = shareInvitationCompiled({
      ...data,
      acceptUrl
    });

    const { html } = mjml(mjmlContent);

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: data.to,
      subject: `${data.sharedBy.name} shared ${data.resource.type} "${data.resource.name}" with you`,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log('Share invitation email sent successfully');
  } catch (error) {
    console.error('Error sending share invitation email:', error);
    throw error;
  }
}

export async function sendShareAcceptedEmail(data: ShareAcceptedEmailData) {
  try {
    const resourceUrl = data.resource.type === 'spreadsheet' 
      ? `${process.env.APP_URL}/spreadsheet/${data.resource.id}`
      : `${process.env.APP_URL}/folder/${data.resource.id}`;
    
    const mjmlContent = shareAcceptedCompiled({
      ...data,
      resourceUrl
    });

    const { html } = mjml(mjmlContent);

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: data.to,
      subject: `${data.acceptedBy} accepted your share invitation`,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log('Share accepted email sent successfully');
  } catch (error) {
    console.error('Error sending share accepted email:', error);
    throw error;
  }
}

export async function sendNotificationEmail(data: {
  to: string;
  subject: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}) {
  try {
    const template = `
      <mjml>
        <mj-head>
          <mj-title>${data.subject}</mj-title>
          <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
          <mj-attributes>
            <mj-all font-family="Inter, Arial, sans-serif" />
          </mj-attributes>
        </mj-head>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" padding="40px 20px">
            <mj-column>
              <mj-image width="60px" src="https://via.placeholder.com/60x60/3b82f6/ffffff?text=CS" alt="Collaborative Spreadsheet" />
              <mj-text font-size="24px" font-weight="600" color="#1f2937" align="center" padding-top="20px">
                ${data.title}
              </mj-text>
              <mj-text font-size="16px" color="#6b7280" align="center" padding-top="10px">
                ${data.message}
              </mj-text>
            </mj-column>
          </mj-section>
          
          ${data.actionUrl ? `
          <mj-section background-color="#ffffff" padding="0 20px 40px">
            <mj-column>
              <mj-button background-color="#3b82f6" color="#ffffff" font-size="16px" font-weight="500" border-radius="8px" padding="16px 32px" href="${data.actionUrl}">
                ${data.actionText || 'View'}
              </mj-button>
            </mj-column>
          </mj-section>
          ` : ''}
          
          <mj-section background-color="#f8fafc" padding="20px">
            <mj-column>
              <mj-text font-size="12px" color="#6b7280" align="center">
                © 2024 Collaborative Spreadsheet. All rights reserved.
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;

    const { html } = mjml(template);

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: data.to,
      subject: data.subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log('Notification email sent successfully');
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
}