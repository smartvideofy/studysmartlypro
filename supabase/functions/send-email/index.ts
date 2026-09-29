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
  | "trial_started"
  | "trial_ending"
  | "trial_expired"
  | "trial_day1"
  | "trial_day2"
  | "trial_day3"
  | "reactivation"
  | "nudge_3day"
  | "nudge_7day"
  | "abandoned_checkout";

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
  trial_started: null, // Always send (transactional)
  trial_ending: null, // Always send (transactional)
  trial_expired: null, // Always send (transactional)
  trial_day1: null, // Always send (transactional)
  trial_day2: null, // Always send (transactional)
  trial_day3: null, // Always send (transactional)
  reactivation: "product_updates",
  nudge_3day: "streak_reminders",
  nudge_7day: "streak_reminders",
  abandoned_checkout: null, // Always send (transactional)
};

// Generate email content based on template
function generateEmailContent(
  template: EmailTemplate,
  data: Record<string, any>,
  unsubscribeUrl: string
): { subject: string; html: string } {
  const userName = data.name || "there";
  const appUrl = Deno.env.get("APP_URL") || "https://getstudily.com";
  
  const footer = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p>Studily - Learn smarter, not harder</p>
      <p style="margin-top: 4px;">
        Questions? Contact us at <a href="mailto:support@getstudily.com" style="color: #EC4899;">support@getstudily.com</a>
      </p>
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
    background: linear-gradient(135deg, #EC4899, #DB2777);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin: 16px 0;
  `;

  const ANDROID_URL = "https://play.google.com/store/apps/details?id=com.studily.app";
  const IOS_URL = "https://testflight.apple.com/join/2CHgmH96";

  const appButtons = `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td style="padding-right: 8px;">
          <a href="${ANDROID_URL}" style="display:inline-block;padding:13px 20px;background:#EC4899;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">Get the Android app</a>
        </td>
        <td>
          <a href="${IOS_URL}" style="display:inline-block;padding:13px 20px;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">Get it on iPhone</a>
        </td>
      </tr>
    </table>
  `;

  switch (template) {
    case "welcome":
      return {
        subject: `Welcome to Studily, ${userName} — here's your 60-second start 🎓`,
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #EC4899; font-size: 28px; margin-bottom: 20px;">Welcome to Studily, ${userName}! 🎓</h1>
            <p>You've just joined thousands of students who stopped re-reading notes and started actually remembering them.</p>

            <div style="background: #FDF2F8; border-radius: 14px; padding: 22px; margin: 24px 0;">
              <h3 style="margin: 0 0 10px 0; color: #BE185D; font-size: 18px;">⚡ Your 60-second quick start</h3>
              <ol style="margin: 0; padding-left: 20px;">
                <li>Upload one lecture slide deck, PDF, or a photo of your notes.</li>
                <li>Studily reads it and builds a summary, flashcards and a quiz automatically.</li>
                <li>Review for five minutes — that's a real study session done.</li>
              </ol>
            </div>

            <a href="${appUrl}/materials" style="${buttonStyle}">Upload your first material</a>

            <h3 style="color: #1f2937; font-size: 18px; margin: 28px 0 8px 0;">What else you can do</h3>
            <ul style="margin: 0 0 16px 0; padding-left: 20px;">
              <li><strong>Record or upload audio</strong> — lectures get transcribed and turned into notes.</li>
              <li><strong>Paste a YouTube link</strong> — get a full study set from any video.</li>
              <li><strong>Concept maps</strong> — see how ideas in a topic connect.</li>
              <li><strong>Spaced repetition</strong> — Studily schedules reviews right before you'd forget.</li>
            </ul>

            <div style="background: #ffffff; border: 1px solid #FBCFE8; border-radius: 14px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 6px 0;"><strong>📅 Got an exam coming up?</strong></p>
              <p style="margin: 0; color: #6b7280;">Add the date and Studily will count down and pace your revision for you.</p>
              <p style="margin: 12px 0 0 0;"><a href="${appUrl}/settings" style="color: #EC4899; font-weight: 600;">Set your exam date →</a></p>
            </div>

            <h3 style="color: #1f2937; font-size: 18px; margin: 28px 0 4px 0;">Study on your phone too</h3>
            <p style="margin: 0; color: #6b7280;">Same account, same notes — wherever you are.</p>
            ${appButtons}

            <p style="margin-top: 24px;">Happy studying 📖</p>
            <p style="color: #6b7280;">— The Studily Team</p>
            ${footer}
          </div>
        `,
      };


    case "onboarding_day2":
      return {
        subject: "Turn one lecture into a full study set ✍️",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #EC4899; font-size: 24px;">${userName}, pick the topic that worries you most 📝</h1>
            <p>The fastest way to feel the difference is to give Studily something you're actually struggling with right now.</p>
            <div style="background: #FDF2F8; padding: 20px; border-radius: 14px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Three ways to feed it:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>📄 A PDF, Word file or slide deck from class</li>
                <li>🎙️ A recorded lecture — it gets transcribed automatically</li>
                <li>▶️ A YouTube link to a lesson you were about to watch</li>
              </ul>
            </div>
            <p>In under a minute you get a plain-English summary, tutor notes, flashcards and practice questions from it.</p>
            <a href="${appUrl}/materials" style="${buttonStyle}">Upload a material now</a>
            <p style="margin-top: 20px; color: #6b7280;">
              <strong>Coach's tip:</strong> Don't upload your whole semester. Start with one chapter you have a test on — you'll finish a real revision round in 10 minutes.
            </p>
            ${appButtons}
            ${footer}
          </div>
        `,
      };


    case "onboarding_day5":
      return {
        subject: "The 10-minute habit that beats an all-nighter 🎴",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #EC4899; font-size: 24px;">${userName}, this is where the memory gain happens 🧠</h1>
            <p>Re-reading feels productive. Testing yourself is what actually sticks — and Studily does the hard part for you.</p>
            <div style="background: #FDF2F8; padding: 20px; border-radius: 14px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>How a Studily review works:</strong></p>
              <ol style="margin: 0; padding-left: 20px;">
                <li>Cards are made from your own material, not generic content.</li>
                <li>You rate how well you knew each answer.</li>
                <li>Studily schedules the next review just before you'd forget.</li>
              </ol>
            </div>
            <p>Cards you find hard come back sooner. Cards you know drift further away. Ten minutes a day beats a panic night before the exam.</p>
            <a href="${appUrl}/flashcards" style="${buttonStyle}">Review your cards</a>
            <p style="margin-top: 20px; color: #6b7280;">
              Try <strong>Learn mode</strong> too — it mixes multiple choice and typed answers so you can't coast on recognition.
            </p>
            ${appButtons}
            ${footer}
          </div>
        `,
      };


    case "onboarding_day7":
      return {
        subject: "Unlock more with Pro ⭐",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #EC4899; font-size: 24px;">You're doing great, ${userName}! 🌟</h1>
            <p>After a week with Studily, you've experienced what smart studying feels like.</p>
            <p>Want to unlock even more?</p>
            <div style="background: linear-gradient(135deg, #FDF2F8, #FCE7F3); padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #BE185D;">Pro Features Include:</h3>
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
            <h1 style="color: #EC4899; font-size: 24px;">Your Week in Review, ${userName} 📈</h1>
            <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 20px 0;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; text-align: center;">
                <div>
                  <p style="font-size: 32px; font-weight: bold; color: #EC4899; margin: 0;">${data.xpGained || 0}</p>
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
            <h1 style="color: #EC4899; font-size: 24px;">Hey ${userName}, it happens to the best of us 💪</h1>
            <p>Your streak ended, but that's okay! Every expert was once a beginner.</p>
            <p>What matters is getting back on track. A new streak starts with just one study session.</p>
            <div style="background: #FDF2F8; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <p style="font-size: 20px; margin: 0;">Your previous best: <strong>${data.previousStreak || 0} days</strong></p>
              <p style="color: #BE185D; margin: 8px 0 0 0;">Can you beat it this time? 🎯</p>
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
            <h1 style="color: #EC4899; font-size: 24px;">Congratulations, ${userName}! 🏆</h1>
            <div style="background: linear-gradient(135deg, #fef3c7, #fce7f3); padding: 32px; border-radius: 16px; margin: 20px 0; text-align: center;">
              <p style="font-size: 64px; margin: 0;">${data.achievementIcon || "🏆"}</p>
              <h2 style="margin: 16px 0 8px 0; color: #BE185D;">${data.achievementName}</h2>
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
            <h1 style="color: #EC4899; font-size: 28px;">Welcome to ${data.planName || "Pro"}, ${userName}! 🎉</h1>
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
              Questions? Reply to this email or visit our <a href="${appUrl}/help" style="color: #EC4899;">Help Center</a>.
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
            <h1 style="color: #EC4899; font-size: 24px;">Your Pro subscription has ended 💜</h1>
            <p>Hey ${userName}, we noticed your subscription expired.</p>
            <p>You still have access to your study materials, but premium features are now limited.</p>
            <div style="background: #FDF2F8; padding: 20px; border-radius: 12px; margin: 20px 0;">
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

    case "trial_started":
      return {
        subject: "Welcome to your 3-day Pro trial! 🎉",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #EC4899; font-size: 28px; margin-bottom: 24px;">Your Pro trial has started, ${userName}! 🚀</h1>
            <p>You now have <strong>3 days of full Pro access</strong> – no credit card required.</p>
            <div style="background: linear-gradient(135deg, #FDF2F8, #FCE7F3); padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #BE185D;">What you can do now:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
                <li>Upload unlimited study materials</li>
                <li>Generate AI flashcards & practice questions</li>
                <li>Access interactive concept maps</li>
                <li>Get advanced tutor notes</li>
                <li>Export to Anki format</li>
              </ul>
            </div>
            <p style="background: #fef3c7; padding: 12px 16px; border-radius: 8px; font-size: 14px;">
              ⏰ <strong>Your trial ends:</strong> ${data.trialEndDate || "in 3 days"}
            </p>
            <a href="${appUrl}/materials" style="${buttonStyle}">Start Exploring Pro Features</a>
            <p style="margin-top: 24px; color: #6b7280;">
              Questions? We're here to help at <a href="mailto:support@getstudily.com" style="color: #EC4899;">support@getstudily.com</a>
            </p>
            ${footer}
          </div>
        `,
      };

    case "trial_ending":
      return {
        subject: "Your Pro trial ends tomorrow ⏰",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #f59e0b; font-size: 24px;">Your trial ends tomorrow, ${userName}! ⏰</h1>
            <p>Just a heads up – your 3-day Pro trial expires <strong>tomorrow</strong> (${data.trialEndDate || "soon"}).</p>
            <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0 0 12px 0;"><strong>Don't lose access to:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Unlimited document uploads</li>
                <li>AI-powered study tools</li>
                <li>Practice questions & concept maps</li>
                <li>Priority support</li>
              </ul>
            </div>
            <p>Subscribe now to keep your Pro features – plans start at just $9/month.</p>
            <a href="${appUrl}/pricing" style="${buttonStyle}">Subscribe & Keep Pro</a>
            <p style="margin-top: 24px; color: #6b7280;">
              Have questions? Reply to this email – we'd love to help!
            </p>
            ${footer}
          </div>
        `,
      };

    case "trial_expired":
      return {
        subject: "Your notes are safe — here's 30% off to unlock them fully 💗",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #EC4899; font-size: 24px;">Your Pro trial has ended, ${userName}</h1>
            <p>First, the important part: <strong>nothing has been deleted.</strong> Every note, deck and summary you created is still in your account — you're simply in view-only mode until you subscribe.</p>
            <div style="background: #FDF2F8; padding: 20px; border-radius: 14px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Subscribing switches back on:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>New uploads and AI study sets</li>
                <li>Editing your notes and flashcards</li>
                <li>Quizzes, concept maps and tutor notes</li>
              </ul>
            </div>
            <div style="background: linear-gradient(135deg, #FCE7F3, #FDF2F8); padding: 24px; border-radius: 14px; margin: 20px 0; text-align: center;">
              <p style="font-size: 32px; margin: 0;">🎁</p>
              <h3 style="margin: 8px 0 4px 0; color: #BE185D;">Welcome back offer: 30% off</h3>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Claim it within 72 hours</p>
            </div>
            <a href="${appUrl}/pricing" style="${buttonStyle}">Claim 30% off</a>
            <p style="margin-top: 24px; color: #6b7280;">Pick up exactly where you left off — no setup, no re-uploading.</p>
            ${footer}
          </div>
        `,
      };


    case "reactivation":
      return {
        subject: "We miss you! Come back and study 📚",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #EC4899; font-size: 24px;">Hey ${userName}, we miss you! 👋</h1>
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

    case "trial_day1":
      return {
        subject: "Here's what to try first – 2 days left 🎯",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #EC4899; font-size: 24px;">2 days left on Pro – make them count, ${userName}! 🎯</h1>
            <p>Your trial ends in <strong>2 days</strong>. Here's the fastest way to see the value:</p>
            <div style="background: #FDF2F8; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #BE185D;">⚡ Quick-win in 2 minutes:</h3>
              <ol style="margin: 0; padding-left: 20px;">
                <li>Upload a PDF or paste a YouTube link</li>
                <li>Watch AI generate flashcards, summaries & quizzes</li>
                <li>Start a study session with spaced repetition</li>
              </ol>
            </div>
            <a href="${appUrl}/materials" style="${buttonStyle}">Upload Your First Material</a>
            <p style="margin-top: 24px; color: #6b7280;">
              Most students see results after uploading just one document!
            </p>
            ${footer}
          </div>
        `,
      };

    case "trial_day2":
      return {
        subject: "Tomorrow is your last day – here's what you've built 📊",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #f59e0b; font-size: 24px;">Tomorrow is your last day, ${userName}! 📊</h1>
            <p>Your Pro trial ends <strong>tomorrow</strong>. Here's what you've accomplished:</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>📚 Materials uploaded:</strong> ${data.materialsCount || 0}</p>
              <p style="margin: 0 0 8px 0;"><strong>🎴 Flashcards generated:</strong> ${data.flashcardsCount || 0}</p>
              <p style="margin: 0;"><strong>⭐ XP earned:</strong> ${data.xpEarned || 0}</p>
            </div>
            ${(data.materialsCount || 0) === 0 ? `
              <p style="background: #fef3c7; padding: 12px 16px; border-radius: 8px;">
                💡 <strong>Tip:</strong> Upload a material now to see the magic before your trial ends!
              </p>
            ` : `
              <p>Don't lose access to everything you've created. Subscribe to keep your Pro features.</p>
            `}
            <a href="${appUrl}/pricing" style="${buttonStyle}">Subscribe Now – Keep Everything</a>
            <p style="margin-top: 24px; color: #6b7280;">
              ⏰ Your trial ends ${data.trialEndDate || "tomorrow"}
            </p>
            ${footer}
          </div>
        `,
      };

    case "trial_day3":
      return {
        subject: "⚡ Trial ends TODAY – 30% off if you subscribe now",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #ef4444; font-size: 24px;">Your trial ends today, ${userName}! ⚡</h1>
            <p>This is it – your Pro access expires at the end of today.</p>
            <div style="background: linear-gradient(135deg, #fef3c7, #fce7f3); padding: 24px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <p style="font-size: 40px; margin: 0;">🎁</p>
              <h3 style="margin: 8px 0 4px 0; color: #BE185D;">Special offer: 30% off your first month</h3>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Subscribe today and save – this offer won't last</p>
            </div>
            <p>Plans start at just <strong>$9/month</strong> – that's less than a coffee a week for unlimited AI study tools.</p>
            <a href="${appUrl}/pricing" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #ef4444, #EC4899); color: white; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 16px 0; font-size: 16px;">Claim 30% Off Now</a>
            <p style="margin-top: 24px; color: #6b7280;">
              Your data is safe either way – but you'll lose access to Pro features after today.
            </p>
            ${footer}
          </div>
        `,
      };

    case "nudge_3day":
      return {
        subject: "Quick 5-min session? Your materials are waiting 📖",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #EC4899; font-size: 24px;">Hey ${userName}, quick check-in! 👋</h1>
            <p>It's been 3 days since your last study session. A quick 5-minute review can make a big difference for retention!</p>
            <div style="background: #FDF2F8; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <p style="font-size: 48px; margin: 0;">📖</p>
              <p style="margin: 8px 0 0 0; color: #BE185D; font-weight: 600;">Your materials are waiting for you</p>
            </div>
            <a href="${appUrl}/dashboard" style="${buttonStyle}">Start Quick Review</a>
            <p style="margin-top: 24px; color: #6b7280;">
              Just 5 minutes keeps your knowledge fresh!
            </p>
            ${footer}
          </div>
        `,
      };

    case "nudge_7day":
      return {
        subject: "Everything you made is still here, waiting 💗",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #EC4899; font-size: 24px;">${userName}, your progress is exactly where you left it</h1>
            <p>It's been a week. Life gets busy — no guilt here.</p>
            <p>Every note, deck and summary is still in your account, and nothing expires just because you took a break.</p>
            <div style="background: #FDF2F8; padding: 20px; border-radius: 14px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Easiest way back in (pick one):</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Review 10 flashcards — about three minutes</li>
                <li>Re-read one AI summary before bed</li>
                <li>Upload the newest thing from class</li>
              </ul>
            </div>
            <a href="${appUrl}/dashboard" style="${buttonStyle}">Pick up where you left off</a>
            <p style="margin-top: 20px; color: #6b7280;">Studying on your phone makes short sessions much easier:</p>
            ${appButtons}
            ${footer}
          </div>
        `,
      };


    case "abandoned_checkout":
      return {
        subject: "You're one step away from Pro! 🚀",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #EC4899; font-size: 24px;">Almost there, ${userName}! 🚀</h1>
            <p>We noticed you started upgrading to <strong>${data.planName || "Studily Pro"}</strong> but didn't finish.</p>
            <div style="background: linear-gradient(135deg, #FDF2F8, #FCE7F3); padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #BE185D;">What you'll unlock:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Unlimited AI-powered study tools</li>
                <li>Advanced analytics & insights</li>
                <li>Priority support</li>
                <li>Collaborative study groups</li>
              </ul>
              <p style="margin: 16px 0 0 0; font-size: 18px; font-weight: bold; color: #BE185D;">
                ${data.amount ? `Just ${data.billingInterval === 'yearly' ? '$' + Math.round(data.amount / 100) + '/year' : '$' + Math.round(data.amount / 100) + '/month'}` : "Starting at $9/month"}
              </p>
            </div>
            <a href="${appUrl}/pricing" style="${buttonStyle}">Complete Your Purchase</a>
            <p style="margin-top: 24px; color: #6b7280;">
              Questions? Reply to this email – we're happy to help!
            </p>
            ${footer}
          </div>
        `,
      };

    default:
      return {
        subject: "Update from Studily",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <p>Hello ${userName},</p>
            <p>This is an update from Studily.</p>
            <a href="${appUrl}" style="${buttonStyle}">Visit Studily</a>
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
    // Auth guard: only allow service role, the internal cron secret, or authenticated users
    const authHeader = req.headers.get("Authorization");
    const internalCronSecret = Deno.env.get("INTERNAL_CRON_SECRET");
    const isServiceRole =
      authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY) ||
      (!!internalCronSecret && authHeader === `Bearer ${internalCronSecret}`);

    if (!isServiceRole) {
      // If not service role, validate user JWT
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Invalid authentication" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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
    const appUrl = Deno.env.get("APP_URL") || "https://getstudily.com";
    const unsubscribeUrl = `${appUrl}/unsubscribe/${unsubscribeToken}`;

    // Generate email content
    const emailData = {
      ...data,
      name: profile?.full_name || userEmail.split("@")[0],
    };
    const { subject, html } = generateEmailContent(template, emailData, unsubscribeUrl);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Studily <noreply@getstudily.com>",
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
    
    // Log failed email attempt
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const body = await req.clone().json().catch(() => ({}));
      await supabase.from("email_logs").insert({
        user_id: body.user_id || null,
        email_type: body.template || "unknown",
        template_name: body.template || "unknown",
        subject: "Failed to send",
        recipient_email: "unknown",
        status: "failed",
        metadata: { 
          error: error.message,
          errorCode: error.code,
          stack: error.stack,
        },
      });
    } catch (logError) {
      console.error("Failed to log email error:", logError);
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
