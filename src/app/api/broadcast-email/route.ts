import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { title, message, alert_level, category, sender_name } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY is not set. Cannot fetch user emails.");
      return NextResponse.json({ error: "Service role key missing" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all users to get their emails
    // We use listUsers() which requires the service role key
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    const userEmails = users.map(user => user.email).filter(Boolean) as string[];

    if (userEmails.length === 0) {
      return NextResponse.json({ message: "No users to send email to" });
    }

    // Nodemailer configuration
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      console.warn("GMAIL_USER or GMAIL_APP_PASSWORD not set in environment.");
      return NextResponse.json({ error: "Gmail configuration missing" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const getAlertEmoji = (level: string) => {
      if (level === 'critical') return '🚨';
      if (level === 'warning') return '⚠️';
      return '📢';
    };

    const mailOptions = {
      from: `"CampusPulse Alerts" <${gmailUser}>`,
      bcc: userEmails.join(','), 
      subject: `${getAlertEmoji(alert_level)} Campus Broadcast: ${title}`,
      text: `CampusPulse Official Notice\n\nCategory: ${category}\nAlert Level: ${alert_level.toUpperCase()}\nPosted by: ${sender_name}\n\n${title}\n\n${message}\n\nPlease check the CampusPulse dashboard for more information.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${alert_level === 'critical' ? '#ef4444' : alert_level === 'warning' ? '#f59e0b' : '#00e5ff'}; padding: 20px; text-align: center;">
            <h2 style="color: ${alert_level === 'info' ? '#000' : '#fff'}; margin: 0;">${getAlertEmoji(alert_level)} Official Campus Notice</h2>
          </div>
          <div style="padding: 24px; background-color: #f9fafb;">
            <div style="margin-bottom: 20px;">
              <span style="background-color: #e5e7eb; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${category}</span>
              <span style="background-color: #e5e7eb; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-left: 8px;">${alert_level} Alert</span>
            </div>
            <h3 style="color: #111827; font-size: 20px; margin-top: 0;">${title}</h3>
            <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              Posted by: <strong>${sender_name}</strong>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Emails sent successfully" });
  } catch (error) {
    console.error("Error sending emails:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
