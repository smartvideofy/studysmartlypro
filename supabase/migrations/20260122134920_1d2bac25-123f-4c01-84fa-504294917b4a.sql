-- Add more help articles covering various topics

-- Getting Started Articles
INSERT INTO help_articles (category_id, slug, title, content, summary, is_faq, is_featured, display_order)
VALUES 
(
  (SELECT id FROM help_categories WHERE slug = 'getting-started'),
  'creating-your-first-note',
  'Creating Your First Note',
  '## Creating Notes in Studyly

Getting started with notes is easy! Here''s how to create your first note:

### Step 1: Navigate to Notes
Click on **Notes** in the sidebar or dashboard to open the notes section.

### Step 2: Create a New Note
Click the **+ New Note** button in the top right corner.

### Step 3: Add Your Content
- Give your note a descriptive title
- Write or paste your study content
- Use formatting options for headings, lists, and emphasis

### Step 4: Organize with Folders
Create folders to keep your notes organized by subject or topic.

### Tips for Effective Notes
- Use bullet points for key concepts
- Add images and attachments for visual learning
- Tag your notes for easy searching later',
  'Learn how to create and organize your first study note',
  false,
  true,
  2
),
(
  (SELECT id FROM help_categories WHERE slug = 'getting-started'),
  'navigating-the-dashboard',
  'Navigating the Dashboard',
  '## Understanding Your Dashboard

Your dashboard is the central hub for all your study activities.

### Quick Actions
At the top, you''ll find quick action buttons to:
- Create a new note
- Start a study session
- Upload study materials

### Recent Activity
See your recently accessed notes, flashcard decks, and study materials at a glance.

### Study Progress
Track your daily goals, streaks, and XP progress right from the dashboard.

### Notifications
The bell icon shows important updates like group messages, session reminders, and achievements.',
  'Learn your way around the Studyly dashboard',
  false,
  false,
  3
);

-- Account & Settings Articles
INSERT INTO help_articles (category_id, slug, title, content, summary, is_faq, is_featured, display_order)
VALUES 
(
  (SELECT id FROM help_categories WHERE slug = 'account-settings'),
  'how-to-delete-account',
  'How do I delete my account?',
  '## Deleting Your Account

We''re sorry to see you go! Here''s how to delete your Studyly account:

### Before You Delete
Please note that deleting your account will:
- Permanently remove all your notes and flashcards
- Delete your study progress and achievements
- Remove you from all study groups
- Cancel any active subscriptions

**This action cannot be undone.**

### Steps to Delete Your Account
1. Go to **Settings** from the sidebar
2. Scroll to the **Danger Zone** section
3. Click **Delete Account**
4. Confirm by typing "DELETE" when prompted
5. Click the final confirmation button

### Data Export
We recommend exporting your data before deleting. See our guide on data export to save your notes and flashcards.

### Need Help?
If you''re having issues with the app, please contact us first - we''d love to help resolve any problems before you leave!',
  'Learn how to permanently delete your Studyly account',
  true,
  false,
  1
),
(
  (SELECT id FROM help_categories WHERE slug = 'account-settings'),
  'exporting-your-data',
  'How do I export my data?',
  '## Exporting Your Data

You can export your study materials at any time.

### What Can Be Exported
- **Notes**: Export as Markdown or PDF
- **Flashcards**: Export as CSV or JSON
- **Study Materials**: Download original uploaded files

### Exporting Notes
1. Open the note you want to export
2. Click the **three-dot menu** (⋮)
3. Select **Export**
4. Choose your preferred format

### Bulk Export
To export all your data:
1. Go to **Settings**
2. Find the **Data & Privacy** section
3. Click **Export All Data**
4. Wait for the download to be prepared
5. Download the ZIP file containing all your content

### Export Formats
- **Markdown (.md)**: Plain text with formatting, great for other note apps
- **PDF**: Formatted document for printing or sharing
- **CSV**: Spreadsheet format for flashcards
- **JSON**: Full data export for backup purposes',
  'Download and backup your notes, flashcards, and study materials',
  true,
  false,
  2
),
(
  (SELECT id FROM help_categories WHERE slug = 'account-settings'),
  'changing-password',
  'How do I change my password?',
  '## Changing Your Password

Keep your account secure by updating your password regularly.

### Steps to Change Password
1. Go to **Settings** from the sidebar
2. Navigate to the **Security** section
3. Click **Change Password**
4. Enter your current password
5. Enter your new password twice
6. Click **Update Password**

### Password Requirements
Your new password must:
- Be at least 8 characters long
- Include a mix of letters and numbers
- Not be the same as your current password

### Forgot Your Password?
If you can''t remember your current password:
1. Log out of your account
2. Click **Forgot Password** on the login page
3. Enter your email address
4. Check your email for a reset link
5. Create a new password',
  'Update your account password for better security',
  true,
  false,
  3
),
(
  (SELECT id FROM help_categories WHERE slug = 'account-settings'),
  'managing-notifications',
  'Managing Notification Settings',
  '## Notification Preferences

Control how and when Studyly notifies you.

### In-App Notifications
Access notification settings in **Settings > Notifications** to toggle:
- Study reminders
- Group message alerts
- Achievement unlocks
- Session invitations

### Push Notifications
Enable browser push notifications to receive alerts even when you''re not on the site:
1. Go to **Settings > Notifications**
2. Click **Enable Push Notifications**
3. Allow notifications when your browser prompts

### Email Notifications
Manage email preferences for:
- Weekly progress summaries
- Important account updates
- Group activity digests

### Do Not Disturb
Set quiet hours to pause all notifications during specific times, perfect for focused study sessions.',
  'Customize your notification preferences',
  false,
  false,
  4
);

-- Study Features Articles
INSERT INTO help_articles (category_id, slug, title, content, summary, is_faq, is_featured, display_order)
VALUES 
(
  (SELECT id FROM help_categories WHERE slug = 'study-features'),
  'keyboard-shortcuts',
  'Keyboard Shortcuts',
  '## Keyboard Shortcuts

Speed up your workflow with these handy shortcuts.

### Global Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open global search |
| `Ctrl/Cmd + N` | Create new note |
| `Ctrl/Cmd + /` | Open keyboard shortcuts help |

### Note Editor
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save note |
| `Ctrl/Cmd + B` | Bold text |
| `Ctrl/Cmd + I` | Italic text |
| `Ctrl/Cmd + Shift + X` | Strikethrough |
| `Ctrl/Cmd + Shift + H` | Highlight |

### Flashcard Study Mode
| Shortcut | Action |
|----------|--------|
| `Space` | Flip card |
| `1` | Rate: Again |
| `2` | Rate: Hard |
| `3` | Rate: Good |
| `4` | Rate: Easy |
| `←` / `→` | Navigate cards |
| `Esc` | Exit study mode |

### Navigation
| Shortcut | Action |
|----------|--------|
| `G then D` | Go to Dashboard |
| `G then N` | Go to Notes |
| `G then F` | Go to Flashcards |
| `G then M` | Go to Materials |',
  'Master Studyly with keyboard shortcuts for faster navigation',
  true,
  true,
  1
),
(
  (SELECT id FROM help_categories WHERE slug = 'study-features'),
  'spaced-repetition-explained',
  'How Spaced Repetition Works',
  '## Understanding Spaced Repetition

Spaced repetition is a scientifically-proven learning technique that helps you remember information long-term.

### The Science
Your brain forgets information over time following a predictable curve. Spaced repetition fights this by reviewing information just before you''re about to forget it.

### How It Works in Studyly
1. **Study a flashcard** for the first time
2. **Rate your recall**: Again, Hard, Good, or Easy
3. The algorithm schedules the next review:
   - **Again**: See it again in a few minutes
   - **Hard**: Review tomorrow
   - **Good**: Review in a few days
   - **Easy**: Review in a week or more

### Review Intervals
Cards you know well are shown less frequently, while difficult cards appear more often until you master them.

### Best Practices
- Study daily, even if just for 10 minutes
- Be honest with your ratings
- Don''t skip reviews - consistency is key
- Create clear, focused flashcards',
  'Learn how our spaced repetition system helps you remember better',
  true,
  false,
  2
),
(
  (SELECT id FROM help_categories WHERE slug = 'study-features'),
  'ai-study-features',
  'AI-Powered Study Features',
  '## AI Features in Studyly

Studyly uses AI to enhance your learning experience.

### AI Flashcard Generation
Upload study materials and let AI create flashcards for you:
1. Go to **Study Materials**
2. Upload a PDF, document, or paste text
3. Enable **Generate Flashcards** option
4. Review and edit the generated cards

### AI Summaries
Get quick summaries of lengthy content:
- Key points extraction
- Concept explanations
- Study-friendly breakdowns

### AI Chat Tutor
Ask questions about your uploaded materials:
- Get explanations of complex topics
- Ask follow-up questions
- Request examples and analogies

### Concept Maps
Visualize how ideas connect with auto-generated concept maps from your study materials.

### Practice Questions
AI generates quiz questions to test your understanding:
- Multiple choice
- Short answer
- True/false',
  'Discover how AI helps you study smarter',
  false,
  true,
  3
);

-- Notes & Editor Articles  
INSERT INTO help_articles (category_id, slug, title, content, summary, is_faq, is_featured, display_order)
VALUES 
(
  (SELECT id FROM help_categories WHERE slug = 'notes-editor'),
  'formatting-notes',
  'Formatting Your Notes',
  '## Note Formatting Options

Make your notes more readable and organized with formatting.

### Basic Formatting
- **Bold**: Select text and click B or use `Ctrl/Cmd + B`
- *Italic*: Select text and click I or use `Ctrl/Cmd + I`
- ~~Strikethrough~~: For crossed-out text

### Headings
Use headings to organize sections:
- Heading 1 for main topics
- Heading 2 for subtopics
- Heading 3 for details

### Lists
- Bullet lists for unordered items
- Numbered lists for sequences
- Checklists for tasks

### Code Blocks
Use code formatting for:
- Programming code snippets
- Formulas
- Technical notation

### Links and Media
- Add hyperlinks to reference sources
- Embed images for visual learning
- Attach files like PDFs',
  'Learn all the formatting options available in the note editor',
  false,
  false,
  1
),
(
  (SELECT id FROM help_categories WHERE slug = 'notes-editor'),
  'importing-documents',
  'Importing Documents',
  '## Import Your Existing Notes

Bring your study materials from other apps into Studyly.

### Supported Formats
- **PDF** documents
- **Word** (.docx) files
- **Plain text** (.txt) files
- **Markdown** (.md) files

### How to Import
1. Open the **Notes** section
2. Click **Import** button
3. Select your file or drag and drop
4. Review the imported content
5. Make any edits needed
6. Save your note

### Import Tips
- Large PDFs may take a moment to process
- Complex formatting may need adjustment
- Images in documents will be extracted
- Consider splitting very long documents

### From Other Note Apps
To migrate from apps like Notion, Evernote, or OneNote:
1. Export your notes as Markdown or PDF
2. Import the exported files into Studyly',
  'Import notes from PDFs, Word docs, and other formats',
  false,
  false,
  2
),
(
  (SELECT id FROM help_categories WHERE slug = 'notes-editor'),
  'organizing-with-folders',
  'Organizing Notes with Folders',
  '## Folder Organization

Keep your notes tidy with folders and subfolders.

### Creating Folders
1. In the Notes section, click **New Folder**
2. Name your folder (e.g., "Biology 101")
3. Choose a color for easy identification

### Moving Notes to Folders
- Drag and drop notes into folders
- Or use the note menu and select **Move to Folder**

### Nested Folders
Create subfolders for detailed organization:
- Main folder: "Science"
  - Subfolder: "Biology"
  - Subfolder: "Chemistry"

### Folder Tips
- Use consistent naming conventions
- Color-code by subject or priority
- Don''t nest too deeply (2-3 levels max)
- Use tags for cross-folder organization',
  'Create folders to organize your study notes by subject or topic',
  false,
  false,
  3
);

-- Collaboration Articles
INSERT INTO help_articles (category_id, slug, title, content, summary, is_faq, is_featured, display_order)
VALUES 
(
  (SELECT id FROM help_categories WHERE slug = 'collaboration'),
  'creating-study-groups',
  'Creating and Managing Study Groups',
  '## Study Groups

Collaborate with classmates and study partners in groups.

### Creating a Group
1. Go to **Groups** in the sidebar
2. Click **Create Group**
3. Name your group and add a description
4. Choose privacy settings (public or private)

### Inviting Members
- Click **Invite** in your group
- Share the invite link with friends
- They can join by clicking the link

### Group Features
- **Chat**: Real-time messaging with all members
- **Shared Notes**: Share notes with the group
- **Study Sessions**: Schedule group study times
- **Voice Notes**: Send audio messages

### Managing Members
As a group owner, you can:
- Promote members to moderators
- Remove members if needed
- Transfer ownership',
  'Learn how to create groups and study with others',
  false,
  false,
  1
),
(
  (SELECT id FROM help_categories WHERE slug = 'collaboration'),
  'sharing-notes-groups',
  'Sharing Notes with Groups',
  '## Sharing Notes

Share your study notes with group members.

### How to Share
1. Open the note you want to share
2. Click the **Share** button
3. Select the group to share with
4. Your note will appear in the group''s shared resources

### Shared Note Permissions
- Group members can view shared notes
- Only the owner can edit the original
- Members can copy to their own notes

### Best Practices
- Share completed, well-organized notes
- Add context when sharing (what the note covers)
- Update shared notes to keep them current

### Unsharing Notes
To remove a shared note from a group:
1. Open the note
2. Click **Share** settings
3. Remove the group from sharing',
  'Share your notes with study group members',
  false,
  false,
  2
);

-- Troubleshooting Articles
INSERT INTO help_articles (category_id, slug, title, content, summary, is_faq, is_featured, display_order)
VALUES 
(
  (SELECT id FROM help_categories WHERE slug = 'troubleshooting'),
  'app-running-slow',
  'App Running Slow or Freezing',
  '## Performance Issues

If Studyly is running slowly, try these solutions.

### Quick Fixes
1. **Refresh the page** - Press `Ctrl/Cmd + R`
2. **Clear browser cache** - Stored data can cause issues
3. **Close other tabs** - Free up browser memory
4. **Check your internet** - Slow connection affects performance

### Browser Recommendations
For best performance, use:
- Google Chrome (latest version)
- Firefox (latest version)
- Microsoft Edge (latest version)

### Clear Cache Steps
**Chrome:**
1. Click the three-dot menu
2. Go to Settings > Privacy > Clear browsing data
3. Select "Cached images and files"
4. Click Clear data

### Still Having Issues?
- Try a different browser
- Disable browser extensions temporarily
- Check our status page for outages
- Contact support with details about the issue',
  'Fix slow loading and performance problems',
  true,
  false,
  1
),
(
  (SELECT id FROM help_categories WHERE slug = 'troubleshooting'),
  'content-not-saving',
  'My Content Isn''t Saving',
  '## Saving Issues

If your notes or flashcards aren''t saving, try these solutions.

### Check Your Connection
- Ensure you have a stable internet connection
- Look for the sync indicator in the app
- Try saving again after reconnecting

### Auto-Save
Studyly auto-saves your work, but you can also:
- Press `Ctrl/Cmd + S` to force save
- Look for the "Saved" indicator

### Recovery Options
If content was lost:
1. Check your browser''s local storage
2. Look in the "Recently Deleted" section
3. Contact support - we may be able to recover data

### Preventing Data Loss
- Wait for the "Saved" confirmation
- Don''t close the tab during uploads
- Keep a stable internet connection
- Export important notes as backup',
  'Troubleshoot content saving and sync issues',
  true,
  false,
  2
),
(
  (SELECT id FROM help_categories WHERE slug = 'troubleshooting'),
  'login-problems',
  'Can''t Log In to My Account',
  '## Login Troubleshooting

Having trouble accessing your account? Try these solutions.

### Forgot Password
1. Click **Forgot Password** on the login page
2. Enter your email address
3. Check your inbox (and spam folder)
4. Click the reset link
5. Create a new password

### Common Issues

**"Invalid email or password"**
- Double-check your email spelling
- Ensure Caps Lock is off
- Try resetting your password

**"Account not found"**
- Make sure you''re using the email you signed up with
- Check if you signed up with Google/social login

**Reset email not arriving**
- Check your spam/junk folder
- Wait a few minutes and try again
- Ensure the email address is correct

### Still Locked Out?
Contact our support team with:
- The email you used to sign up
- When you last accessed your account
- Any error messages you see',
  'Resolve login and authentication problems',
  true,
  false,
  3
),
(
  (SELECT id FROM help_categories WHERE slug = 'troubleshooting'),
  'file-upload-errors',
  'File Upload Not Working',
  '## Upload Troubleshooting

Fix issues with uploading study materials.

### Supported File Types
- **Documents**: PDF, DOCX, TXT, MD
- **Images**: PNG, JPG, GIF, WebP
- **Videos**: MP4, WebM (for video materials)

### File Size Limits
- Documents: Up to 50MB
- Images: Up to 10MB
- Check your subscription for higher limits

### Common Upload Errors

**"File too large"**
- Compress the file or split it
- Premium users have higher limits

**"Unsupported format"**
- Convert to a supported format
- PDF works best for documents

**"Upload failed"**
- Check your internet connection
- Try a smaller file first
- Clear browser cache and retry

### Tips for Large Files
- Use PDF for documents (smaller than Word)
- Compress images before uploading
- Split very large documents',
  'Fix file upload errors and learn supported formats',
  true,
  false,
  4
);

-- Billing & Subscription Articles
INSERT INTO help_articles (category_id, slug, title, content, summary, is_faq, is_featured, display_order)
VALUES 
(
  (SELECT id FROM help_categories WHERE slug = 'billing'),
  'subscription-plans',
  'Understanding Subscription Plans',
  '## Studyly Plans

Choose the plan that fits your study needs.

### Free Plan
Perfect for getting started:
- Up to 50 notes
- 5 flashcard decks
- Basic AI features
- Join study groups

### Pro Plan
For serious students:
- Unlimited notes and flashcards
- Advanced AI features
- Priority support
- Audio overviews
- Concept maps

### Team Plan
For study groups and classes:
- Everything in Pro
- Group administration
- Shared workspaces
- Analytics dashboard

### Comparing Features
| Feature | Free | Pro | Team |
|---------|------|-----|------|
| Notes | 50 | Unlimited | Unlimited |
| AI Credits | 10/month | 500/month | 2000/month |
| Support | Community | Priority | Dedicated |',
  'Compare Free, Pro, and Team subscription options',
  true,
  false,
  1
),
(
  (SELECT id FROM help_categories WHERE slug = 'billing'),
  'cancel-subscription',
  'How do I cancel my subscription?',
  '## Canceling Your Subscription

You can cancel your subscription at any time.

### Steps to Cancel
1. Go to **Settings**
2. Click on **Subscription** or **Billing**
3. Click **Manage Subscription**
4. Select **Cancel Subscription**
5. Confirm your cancellation

### What Happens After Cancellation
- You keep access until your current period ends
- Your data remains saved
- You can resubscribe anytime
- You''ll move to the Free plan after expiration

### Refunds
- We offer refunds within 7 days of purchase
- Contact support for refund requests
- Partial refunds may be available

### Pausing Instead
Not ready to cancel? You can pause your subscription:
1. Go to Subscription settings
2. Select **Pause Subscription**
3. Choose pause duration
4. Your data stays safe until you return',
  'Cancel or pause your Studyly subscription',
  true,
  false,
  2
),
(
  (SELECT id FROM help_categories WHERE slug = 'billing'),
  'payment-methods',
  'Payment Methods and Billing',
  '## Payment Options

We accept various payment methods for your convenience.

### Accepted Payment Methods
- Credit/Debit Cards (Visa, Mastercard)
- Bank transfers (via Paystack)
- Mobile money (where available)

### Updating Payment Method
1. Go to **Settings > Billing**
2. Click **Update Payment Method**
3. Enter new payment details
4. Confirm the change

### Billing Cycle
- Monthly subscriptions renew on the same date
- Annual subscriptions save you money
- You''ll receive email reminders before renewal

### Invoices
- Access invoices in Settings > Billing
- Download PDF invoices for records
- Invoices are emailed after each payment

### Payment Issues
If a payment fails:
- Check your card details
- Ensure sufficient funds
- Try a different payment method
- Contact your bank if issues persist',
  'Learn about accepted payment methods and billing',
  false,
  false,
  3
);