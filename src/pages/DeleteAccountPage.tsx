import { SEOHead } from "@/components/seo/SEOHead";
import { Mail, Trash2, Shield, Clock } from "lucide-react";

export default function DeleteAccountPage() {
  return (
    <>
      <SEOHead
        title="Delete your Studily account"
        description="How to permanently delete your Studily account and the data associated with it."
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-12 md:py-16">
          <header className="mb-10">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Delete your Studily account
            </h1>
            <p className="text-muted-foreground">
              This page explains how to request deletion of your Studily account and the
              data associated with it. Studily is published by Studily.
            </p>
          </header>

          <Section icon={<Trash2 className="w-4 h-4" />} title="Option 1 — Delete in the app (fastest)">
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Open the Studily app and sign in.</li>
              <li>Go to <strong>Settings</strong>.</li>
              <li>Scroll to the bottom and tap <strong>Delete Account</strong>.</li>
              <li>Confirm. Your account and data are deleted immediately and permanently.</li>
            </ol>
          </Section>

          <Section icon={<Mail className="w-4 h-4" />} title="Option 2 — Request by email">
            <p className="text-sm">
              If you can't access the app, email{" "}
              <a
                href="mailto:support@getstudily.com?subject=Delete%20my%20account"
                className="text-primary underline underline-offset-4 hover:no-underline"
              >
                support@getstudily.com
              </a>{" "}
              from the address on your account with the subject "Delete my account". We'll
              verify ownership and delete your account within 30 days.
            </p>
          </Section>

          <Section icon={<Shield className="w-4 h-4" />} title="What is deleted">
            <p className="text-sm mb-3">When your account is deleted, we permanently remove:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>Your profile and login (name, email, user ID)</li>
              <li>All study materials you uploaded</li>
              <li>All AI-generated content (notes, summaries, flashcards, quizzes, concept maps)</li>
              <li>Your study history, progress, streaks and achievements</li>
              <li>Your study-group memberships and messages</li>
            </ul>
          </Section>

          <Section icon={<Clock className="w-4 h-4" />} title="What may be retained, and for how long">
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Encrypted backups & diagnostic logs:</strong> residual copies are
                automatically purged within 90 days.
              </li>
              <li>
                <strong>Purchase records:</strong> transaction records held by Google Play
                and our payments provider are retained as required for tax, accounting and
                fraud-prevention purposes.
              </li>
            </ul>
            <p className="text-sm mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <strong>Note:</strong> deleting your Studily account does not cancel an active
              subscription. Manage or cancel subscriptions in the Google Play Store under
              Payments & subscriptions.
            </p>
          </Section>

          <p className="text-xs text-muted-foreground mt-12 text-center">
            Last updated: June 2026
          </p>
        </div>
      </div>
    </>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold mb-3">
        <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </span>
        {title}
      </h2>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        {children}
      </div>
    </section>
  );
}
