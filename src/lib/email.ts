export const sendEmail = async (env: CloudflareEnv, { to, subject, text, html }: { to: string, subject: string, text: string, html: string }) => {
  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('RESEND_API_KEY is missing');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SayYes <info@sayyesapp.com>',
        to,
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Failed to send email via Resend:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Email sending error:', err);
    return false;
  }
};

export const sendBatchEmails = async (env: CloudflareEnv, emailTasks: any[]) => {
  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('RESEND_API_KEY is missing');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailTasks),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Failed to send batch emails via Resend:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Batch email sending error:', err);
    return false;
  }
};

export const getEmailTemplate = (firstName: string, bodyText: string, buttonText: string, buttonUrl: string, footerNote: string) => {
  return `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; color: #44403c;">
      <h1 style="font-size: 24px; font-weight: 300; margin-bottom: 24px;">SayYes</h1>
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
        Hi ${firstName}, ${bodyText}
      </p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${buttonUrl}" style="display: inline-block; background-color: #44403c; color: #ffffff; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 500;">
          ${buttonText}
        </a>
      </div>
      <p style="font-size: 12px; color: #a8a29e; margin-top: 40px; border-top: 1px solid #e5e5e5; padding-top: 20px;">
        SayYes — A weekly connection for couples.<br>
        ${footerNote}
      </p>
    </div>
  `;
};
