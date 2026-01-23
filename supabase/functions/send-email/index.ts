import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const resend = new Resend(RESEND_API_KEY);

// Email template types
type EmailTemplate = 
  | "welcome"
  | "onboarding_day2"
  | "onboarding_day5"
  | "onboarding_day7"
  | "weekly_progress"
  | "streak_at_risk"
  | "streak_lost"
  | "achievement_earned"
  | "subscription_welcome"
  | "subscription_expiring"
  | "subscription_expired"
  | "reactivation";

interface SendEmailRequest {
  user_id: string;
  template: EmailTemplate;
  data?: Record<string, any>;
  force?: boolean; // Skip preference check (for transactional emails)
}

// Map templates to preference fields
const templatePreferenceMap: Record<EmailTemplate, string | null> = {
  welcome: "welcome_emails",
  onboarding_day2: "welcome_emails",
  onboarding_day5: "welcome_emails",
  onboarding_day7: "product_updates",
  weekly_progress: "weekly_progress",
  streak_at_risk: "streak_reminders",
  streak_lost: "streak_reminders",
  achievement_earned: "achievement_alerts",
  subscription_welcome: null, // Always send (transactional)
  subscription_expiring: null, // Always send (transactional)
  subscription_expired: null, // Always send (transactional)
  reactivation: "product_updates",
};

// Generate email content based on template
function generateEmailContent(
  template: EmailTemplate,
  data: Record<string, any>,
  unsubscribeUrl: string
): { subject: string; html: string } {
  const userName = data.name || "there";
  const appUrl = "https://studysmartlypro.lovable.app";
  
  const footer = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p>StudySmartly - Learn smarter, not harder</p>
      <p style="margin-top: 8px;">
        <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> · 
        <a href="${appUrl}/settings" style="color: #6b7280; text-decoration: underline;">Email Preferences</a>
      </p>
    </div>
  `;

  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #ffffff;
    color: #1f2937;
    line-height: 1.6;
  `;

  const buttonStyle = `
    display: inline-block;
    padding: 12px 24px;
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin: 16px 0;
  `;

  switch (template) {
    case "welcome":
      return {
        subject: "Welcome to StudySmartly! 🎉",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 28px; margin-bottom: 24px;">Welcome to StudySmartly, ${userName}! 🎓</h1>
            <p>We're thrilled to have you join our community of smart learners!</p>
            <p>StudySmartly uses AI-powered tools to help you study more effectively:</p>
            <ul style="margin: 16px 0; padding-left: 20px;">
              <li><strong>📚 Smart Notes</strong> - Upload any study material and get AI summaries</li>
              <li><strong>🎴 AI Flashcards</strong> - Auto-generate flashcards from your content</li>
              <li><strong>🧠 Spaced Repetition</strong> - Review at the optimal time for retention</li>
              <li><strong>📊 Progress Tracking</strong> - Watch your knowledge grow</li>
            </ul>
            <a href="${appUrl}/dashboard" style="${buttonStyle}">Start Learning Now</a>
            <p style="margin-top: 24px;">Happy studying! 📖</p>
            <p style="color: #6b7280;">- The StudySmartly Team</p>
            ${footer}
          </div>
        `,
      };

    case "onboarding_day2":
      return {
        subject: "Create your first note in 30 seconds ✍️",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 24px;">Hey ${userName}, ready to upload your first study material? 📝</h1>
            <p>The best way to get started is to upload something you're currently studying.</p>
            <p>Just:</p>
            <ol style="margin: 16px 0; padding-left: 20px;">
              <li>Click "Upload Material"</li>
              <li>Add a PDF, document, or YouTube video</li>
              <li>Watch AI generate notes, flashcards, and quizzes automatically!</li>
            </ol>
            <a href="${appUrl}/materials" style="${buttonStyle}">Upload Your First Material</a>
            <p style="margin-top: 24px; color: #6b7280;">
              <strong>Pro tip:</strong> Start with a topic you have an exam on soon - you'll be amazed how fast you can prepare!
            </p>
            ${footer}
          </div>
        `,
      };

    case "onboarding_day5":
      return {
        subject: "Try AI-powered flashcards 🎴",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 24px;">Level up your learning, ${userName}! 🚀</h1>
            <p>Did you know you can generate flashcards automatically from any study material?</p>
            <p>Our AI analyzes your content and creates:</p>
            <ul style="margin: 16px 0; padding-left: 20px;">
              <li>Key concept flashcards</li>
              <li>Definition cards for terminology</li>
              <li>Question & answer pairs</li>
            </ul>
            <p>Then, spaced repetition ensures you review them at the perfect time for long-term retention.</p>
            <a href="${appUrl}/flashcards" style="${buttonStyle}">Create AI Flashcards</a>
            <p style="margin-top: 24px; color: #6b7280;">
              Studies show spaced repetition can improve retention by up to 200%!
            </p>
            ${footer}
          </div>
        `,
      };

    case "onboarding_day7":
      return {
        subject: "Unlock more with Pro ⭐",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 24px;">You're doing great, ${userName}! 🌟</h1>
            <p>After a week with StudySmartly, you've experienced what smart studying feels like.</p>
            <p>Want to unlock even more?</p>
            <div style="background: linear-gradient(135deg, #f3e8ff, #fae8ff); padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #7c3aed;">Pro Features Include:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Unlimited AI generations</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
                <li>Collaborative study groups</li>
              </ul>
            </div>
            <a href="${appUrl}/pricing" style="${buttonStyle}">View Pro Plans</a>
            <p style="margin-top: 24px; color: #6b7280;">
              Join thousands of students who've upgraded their study game!
            </p>
            ${footer}
          </div>
        `,
      };

    case "weekly_progress":
      return {
        subject: `Your weekly study recap 📊 ${data.xpGained || 0} XP earned!`,
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 24px;">Your Week in Review, ${userName} 📈</h1>
            <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 20px 0;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; text-align: center;">
                <div>
                  <p style="font-size: 32px; font-weight: bold; color: #8b5cf6; margin: 0;">${data.xpGained || 0}</p>
                  <p style="color: #6b7280; margin: 4px 0 0 0;">XP Earned</p>
                </div>
                <div>
                  <p style="font-size: 32px; font-weight: bold; color: #10b981; margin: 0;">${data.cardsReviewed || 0}</p>
                  <p style="color: #6b7280; margin: 4px 0 0 0;">Cards Reviewed</p>
                </div>
                <div>
                  <p style="font-size: 32px; font-weight: bold; color: #f59e0b; margin: 0;">${data.streak || 0}</p>
                  <p style="color: #6b7280; margin: 4px 0 0 0;">Day Streak 🔥</p>
                </div>
                <div>
                  <p style="font-size: 32px; font-weight: bold; color: #3b82f6; margin: 0;">${data.studyMinutes || 0}</p>
                  <p style="color: #6b7280; margin: 4px 0 0 0;">Minutes Studied</p>
                </div>
              </div>
            </div>
            ${data.streak >= 7 ? `<p style="background: #fef3c7; padding: 12px; border-radius: 8px;">🎉 Amazing! You've maintained a ${data.streak}-day streak!</p>` : ""}
            <a href="${appUrl}/progress" style="${buttonStyle}">View Full Progress</a>
            <p style="margin-top: 24px; color: #6b7280;">Keep up the great work!</p>
            ${footer}
          </div>
        `,
      };

    case "streak_at_risk":
      return {
        subject: "Your streak is at risk! 🔥",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #f59e0b; font-size: 24px;">Don't lose your ${data.streak || 0}-day streak! 🔥</h1>
            <p>Hey ${userName}, we noticed you haven't studied today yet.</p>
            <p>Just a quick 5-minute review session will keep your streak alive!</p>
            <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <p style="font-size: 48px; margin: 0;">🔥</p>
              <p style="font-size: 24px; font-weight: bold; margin: 8px 0;">${data.streak || 0} Day Streak</p>
              <p style="color: #92400e; margin: 0;">Don't let it reset!</p>
            </div>
            <a href="${appUrl}/study" style="${buttonStyle}">Quick Study Session</a>
            ${footer}
          </div>
        `,
      };

    case "streak_lost":
      return {
        subject: "Your streak ended, but you can start fresh! 💪",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 24px;">Hey ${userName}, it happens to the best of us 💪</h1>
            <p>Your streak ended, but that's okay! Every expert was once a beginner.</p>
            <p>What matters is getting back on track. A new streak starts with just one study session.</p>
            <div style="background: #f3e8ff; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <p style="font-size: 20px; margin: 0;">Your previous best: <strong>${data.previousStreak || 0} days</strong></p>
              <p style="color: #7c3aed; margin: 8px 0 0 0;">Can you beat it this time? 🎯</p>
            </div>
            <a href="${appUrl}/study" style="${buttonStyle}">Start New Streak</a>
            ${footer}
          </div>
        `,
      };

    case "achievement_earned":
      return {
        subject: `You earned a new achievement: ${data.achievementName}! 🏆`,
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 24px;">Congratulations, ${userName}! 🏆</h1>
            <div style="background: linear-gradient(135deg, #fef3c7, #fce7f3); padding: 32px; border-radius: 16px; margin: 20px 0; text-align: center;">
              <p style="font-size: 64px; margin: 0;">${data.achievementIcon || "🏆"}</p>
              <h2 style="margin: 16px 0 8px 0; color: #7c3aed;">${data.achievementName}</h2>
              <p style="color: #6b7280; margin: 0;">${data.achievementDescription || "You've unlocked a new achievement!"}</p>
              <p style="margin: 16px 0 0 0; font-weight: bold; color: #10b981;">+${data.xpAwarded || 50} XP</p>
            </div>
            <a href="${appUrl}/achievements" style="${buttonStyle}">View All Achievements</a>
            <p style="margin-top: 24px; color: #6b7280;">Keep learning to unlock more!</p>
            ${footer}
          </div>
        `,
      };

    case "subscription_welcome":
      return {
        subject: `Welcome to ${data.planName || "Pro"}! 🎉`,
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 28px;">Welcome to ${data.planName || "Pro"}, ${userName}! 🎉</h1>
            <p>Thank you for upgrading! You now have access to all premium features:</p>
            <ul style="margin: 16px 0; padding-left: 20px;">
              <li>✓ Unlimited AI generations</li>
              <li>✓ Advanced analytics and insights</li>
              <li>✓ Priority support</li>
              <li>✓ Collaborative study groups</li>
              <li>✓ Export your notes and flashcards</li>
            </ul>
            <a href="${appUrl}/dashboard" style="${buttonStyle}">Explore Premium Features</a>
            <p style="margin-top: 24px; color: #6b7280;">
              Questions? Reply to this email or visit our <a href="${appUrl}/help" style="color: #8b5cf6;">Help Center</a>.
            </p>
            ${footer}
          </div>
        `,
      };

    case "subscription_expiring":
      return {
        subject: "Your subscription expires in 3 days ⏰",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #f59e0b; font-size: 24px;">Your subscription is expiring soon ⏰</h1>
            <p>Hey ${userName}, your ${data.planName || "Pro"} subscription will expire in 3 days.</p>
            <p>To continue enjoying unlimited AI features and premium benefits, please renew your subscription.</p>
            <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Expires:</strong> ${data.expiryDate || "Soon"}</p>
            </div>
            <a href="${appUrl}/pricing" style="${buttonStyle}">Renew Now</a>
            <p style="margin-top: 24px; color: #6b7280;">
              Don't lose access to your premium features!
            </p>
            ${footer}
          </div>
        `,
      };

    case "subscription_expired":
      return {
        subject: "We miss you! Come back to Pro 💜",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 24px;">Your Pro subscription has ended 💜</h1>
            <p>Hey ${userName}, we noticed your subscription expired.</p>
            <p>You still have access to your study materials, but premium features are now limited.</p>
            <div style="background: #f3e8ff; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0 0 12px 0;"><strong>What you're missing:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Unlimited AI generations</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
              </ul>
            </div>
            <a href="${appUrl}/pricing" style="${buttonStyle}">Reactivate Pro</a>
            ${footer}
          </div>
        `,
      };

    case "reactivation":
      return {
        subject: "We miss you! Come back and study 📚",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 24px;">Hey ${userName}, we miss you! 👋</h1>
            <p>It's been a while since your last study session. Ready to get back on track?</p>
            <p>Here's what's new:</p>
            <ul style="margin: 16px 0; padding-left: 20px;">
              <li>Improved AI summaries</li>
              <li>Better flashcard generation</li>
              <li>New study analytics</li>
            </ul>
            <a href="${appUrl}/dashboard" style="${buttonStyle}">Continue Learning</a>
            <p style="margin-top: 24px; color: #6b7280;">
              Just 10 minutes a day can make a big difference!
            </p>
            ${footer}
          </div>
        `,
      };

    default:
      return {
        subject: "Update from StudySmartly",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <p>Hello ${userName},</p>
            <p>This is an update from StudySmartly.</p>
            <a href="${appUrl}" style="${buttonStyle}">Visit StudySmartly</a>
            ${footer}
          </div>
        `,
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { user_id, template, data = {}, force = false }: SendEmailRequest = await req.json();

    console.log(`Processing email request: template=${template}, user_id=${user_id}`);

    // Get user details
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    if (userError || !userData.user) {
      console.error("User not found:", userError);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = userData.user.email;
    if (!userEmail) {
      return new Response(JSON.stringify({ error: "User has no email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user_id)
      .single();

    // Check email preferences (unless forced for transactional emails)
    const preferenceField = templatePreferenceMap[template];
    if (!force && preferenceField) {
      const { data: prefs } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("user_id", user_id)
        .single();

      if (prefs && prefs[preferenceField] === false) {
        console.log(`User opted out of ${template} emails`);
        return new Response(JSON.stringify({ 
          success: false, 
          reason: "User opted out",
          preference: preferenceField 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get or create unsubscribe token
    let { data: prefs } = await supabase
      .from("email_preferences")
      .select("unsubscribe_token")
      .eq("user_id", user_id)
      .single();

    if (!prefs) {
      // Create preferences if they don't exist
      const { data: newPrefs } = await supabase
        .from("email_preferences")
        .insert({ user_id })
        .select("unsubscribe_token")
        .single();
      prefs = newPrefs;
    }

    const unsubscribeToken = prefs?.unsubscribe_token;
    const unsubscribeUrl = `https://studysmartlypro.lovable.app/unsubscribe/${unsubscribeToken}`;

    // Generate email content
    const emailData = {
      ...data,
      name: profile?.full_name || userEmail.split("@")[0],
    };
    const { subject, html } = generateEmailContent(template, emailData, unsubscribeUrl);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "StudySmartly <noreply@studysmartlypro.lovable.app>",
      to: [userEmail],
      subject,
      html,
    });

    console.log("Email sent:", emailResponse);

    // Log the email
    await supabase.from("email_logs").insert({
      user_id,
      email_type: template,
      template_name: template,
      subject,
      recipient_email: userEmail,
      status: "sent",
      resend_id: emailResponse.data?.id,
      metadata: { data: emailData },
    });

    return new Response(JSON.stringify({ 
      success: true, 
      id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
