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
        Questions? Contact us at <a href="mailto:support@getstudily.com" style="color: #8b5cf6;">support@getstudily.com</a>
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
        subject: "Welcome to Studily! 🎉",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 28px; margin-bottom: 24px;">Welcome to Studily, ${userName}! 🎓</h1>
            <p>We're thrilled to have you join our community of smart learners!</p>
            <p>Studily uses AI-powered tools to help you study more effectively:</p>
            <ul style="margin: 16px 0; padding-left: 20px;">
              <li><strong>📚 Smart Notes</strong> - Upload any study material and get AI summaries</li>
              <li><strong>🎴 AI Flashcards</strong> - Auto-generate flashcards from your content</li>
              <li><strong>🧠 Spaced Repetition</strong> - Review at the optimal time for retention</li>
              <li><strong>📊 Progress Tracking</strong> - Watch your knowledge grow</li>
            </ul>
            <a href="${appUrl}/dashboard" style="${buttonStyle}">Start Learning Now</a>
            <p style="margin-top: 24px;">Happy studying! 📖</p>
            <p style="color: #6b7280;">- The Studily Team</p>
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
            <p>After a week with Studily, you've experienced what smart studying feels like.</p>
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

    case "trial_started":
      return {
        subject: "Welcome to your 3-day Pro trial! 🎉",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 28px; margin-bottom: 24px;">Your Pro trial has started, ${userName}! 🚀</h1>
            <p>You now have <strong>3 days of full Pro access</strong> – no credit card required.</p>
            <div style="background: linear-gradient(135deg, #f3e8ff, #fae8ff); padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #7c3aed;">What you can do now:</h3>
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
              Questions? We're here to help at <a href="mailto:support@getstudily.com" style="color: #8b5cf6;">support@getstudily.com</a>
            </p>
            ${footer}
          </div>
        `,
      };

    case "trial_ending":
      return {
        subject: "Your Pro trial ends in 2 days ⏰",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #f59e0b; font-size: 24px;">Your trial ends soon, ${userName}! ⏰</h1>
            <p>Just a heads up – your 7-day Pro trial expires in <strong>2 days</strong> (${data.trialEndDate || "soon"}).</p>
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
        subject: "Your access has been paused 💜",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 24px;">Your access has been paused, ${userName} 💜</h1>
            <p>Your 7-day Pro trial has ended. We hope you enjoyed the full Studily experience!</p>
            <p>Your study materials and progress are safe – subscribe to pick up right where you left off.</p>
            <div style="background: #f3e8ff; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0 0 12px 0;"><strong>To continue, you'll need access to:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Your uploaded study materials</li>
                <li>Your flashcard decks</li>
                <li>Practice questions & concept maps</li>
                <li>Advanced tutor notes</li>
              </ul>
            </div>
            <a href="${appUrl}/pricing" style="${buttonStyle}">Subscribe Now</a>
            <p style="margin-top: 24px; color: #6b7280;">
              Thanks for trying Studily – we'd love to have you continue with us!
            </p>
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

    case "trial_day1":
      return {
        subject: "Here's what to try first on your Pro trial 🎯",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 24px;">Day 1 of Pro – let's make it count, ${userName}! 🎯</h1>
            <p>You've got 6 days left on your trial. Here's the fastest way to see the value:</p>
            <div style="background: #f3e8ff; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #7c3aed;">⚡ Quick-win in 2 minutes:</h3>
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

    case "trial_day3":
      return {
        subject: "You're halfway through your trial – how's it going? 📊",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 24px;">Halfway there, ${userName}! 📊</h1>
            <p>You're 3 days into your Pro trial. Here's what you've accomplished so far:</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>📚 Materials uploaded:</strong> ${data.materialsCount || 0}</p>
              <p style="margin: 0 0 8px 0;"><strong>🎴 Flashcards generated:</strong> ${data.flashcardsCount || 0}</p>
              <p style="margin: 0;"><strong>⭐ XP earned:</strong> ${data.xpEarned || 0}</p>
            </div>
            ${(data.materialsCount || 0) === 0 ? `
              <p style="background: #fef3c7; padding: 12px 16px; border-radius: 8px;">
                💡 <strong>Tip:</strong> Upload your first material to see the magic! You have 4 days left.
              </p>
            ` : `
              <p>Students who study with Studily Pro score <strong>23% higher</strong> on exams. Keep it up!</p>
            `}
            <a href="${appUrl}/dashboard" style="${buttonStyle}">Continue Studying</a>
            <p style="margin-top: 24px; color: #6b7280;">
              ⏰ Your trial ends ${data.trialEndDate || "in 4 days"}
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
            <h1 style="color: #8b5cf6; font-size: 24px;">Hey ${userName}, quick check-in! 👋</h1>
            <p>It's been 3 days since your last study session. A quick 5-minute review can make a big difference for retention!</p>
            <div style="background: #f3e8ff; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <p style="font-size: 48px; margin: 0;">📖</p>
              <p style="margin: 8px 0 0 0; color: #7c3aed; font-weight: 600;">Your materials are waiting for you</p>
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
        subject: "We saved your progress – come back anytime 💜",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 24px;">Hey ${userName}, your progress is safe! 💜</h1>
            <p>It's been a week since you last studied. Life gets busy – we get it!</p>
            <p>Good news: all your notes, flashcards, and progress are exactly where you left them.</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Pick up where you left off:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Review your flashcard decks</li>
                <li>Check your study streaks</li>
                <li>Upload new materials</li>
              </ul>
            </div>
            <a href="${appUrl}/dashboard" style="${buttonStyle}">Come Back & Study</a>
            ${footer}
          </div>
        `,
      };

    case "abandoned_checkout":
      return {
        subject: "You're one step away from Pro! 🚀",
        html: `
          <div style="${baseStyle}; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8b5cf6; font-size: 24px;">Almost there, ${userName}! 🚀</h1>
            <p>We noticed you started upgrading to <strong>${data.planName || "Studily Pro"}</strong> but didn't finish.</p>
            <div style="background: linear-gradient(135deg, #f3e8ff, #fae8ff); padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #7c3aed;">What you'll unlock:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Unlimited AI-powered study tools</li>
                <li>Advanced analytics & insights</li>
                <li>Priority support</li>
                <li>Collaborative study groups</li>
              </ul>
              <p style="margin: 16px 0 0 0; font-size: 18px; font-weight: bold; color: #7c3aed;">
                ${data.amount ? `Just ${data.billingInterval === 'yearly' ? '₦' + Math.round(data.amount / 100) + '/year' : '₦' + Math.round(data.amount / 100) + '/month'}` : "Starting at ₦3,500/month"}
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
