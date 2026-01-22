-- Create help_categories table
CREATE TABLE public.help_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'book',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create help_articles table
CREATE TABLE public.help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.help_categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  is_faq BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Enable RLS
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

-- Public read access for help content (no auth required)
CREATE POLICY "Anyone can view active help categories"
ON public.help_categories
FOR SELECT
USING (is_active = true);

CREATE POLICY "Anyone can view active help articles"
ON public.help_articles
FOR SELECT
USING (is_active = true);

-- Create indexes for performance
CREATE INDEX idx_help_articles_category ON public.help_articles(category_id);
CREATE INDEX idx_help_articles_slug ON public.help_articles(slug);
CREATE INDEX idx_help_articles_faq ON public.help_articles(is_faq) WHERE is_faq = true;
CREATE INDEX idx_help_articles_featured ON public.help_articles(is_featured) WHERE is_featured = true;

-- Seed initial categories
INSERT INTO public.help_categories (slug, title, description, icon, display_order) VALUES
  ('getting-started', 'Getting Started', 'Learn the basics of using StudySmart', 'rocket', 1),
  ('study-materials', 'Study Materials', 'Upload and manage your study content', 'file-text', 2),
  ('flashcards', 'Flashcards & Quizzes', 'Master content with spaced repetition', 'layers', 3),
  ('ai-features', 'AI Features', 'Leverage AI for smarter studying', 'sparkles', 4),
  ('groups', 'Study Groups', 'Collaborate with classmates', 'users', 5),
  ('account', 'Account & Settings', 'Manage your profile and preferences', 'settings', 6);

-- Seed initial FAQ articles
INSERT INTO public.help_articles (category_id, slug, title, content, summary, is_faq, display_order) VALUES
  ((SELECT id FROM public.help_categories WHERE slug = 'getting-started'),
   'how-to-get-started',
   'How do I get started with StudySmart?',
   '## Welcome to StudySmart!

Getting started is easy:

1. **Upload your materials** - Go to the Materials section and upload PDFs, documents, or videos
2. **Let AI process them** - Our AI will automatically generate summaries, flashcards, and practice questions
3. **Start studying** - Use the generated content to study smarter, not harder

### Quick Tips
- Start with one subject to get familiar with the platform
- Check out the AI-generated flashcards - they''re great for quick reviews
- Join or create a study group to collaborate with classmates',
   'Learn how to begin your study journey with StudySmart',
   true, 1),

  ((SELECT id FROM public.help_categories WHERE slug = 'study-materials'),
   'supported-file-types',
   'What file types are supported?',
   '## Supported File Types

StudySmart supports a variety of file formats:

### Documents
- **PDF** - Textbooks, lecture notes, research papers
- **Word Documents** (.docx, .doc)
- **PowerPoint** (.pptx, .ppt)

### Media
- **Videos** - YouTube links and uploaded video files
- **Audio** - Lecture recordings and podcasts

### Size Limits
- Documents: Up to 50MB per file
- Videos: Up to 500MB per file

*Pro tip: For best results, ensure your PDFs have selectable text rather than scanned images.*',
   'Learn about supported document and media formats',
   true, 2),

  ((SELECT id FROM public.help_categories WHERE slug = 'flashcards'),
   'spaced-repetition',
   'What is spaced repetition?',
   '## Understanding Spaced Repetition

Spaced repetition is a learning technique that optimizes when you review information based on how well you know it.

### How it works
1. **Rate your recall** - After seeing a flashcard, rate how well you remembered it
2. **Smart scheduling** - Cards you struggle with appear more frequently
3. **Long-term retention** - Cards you know well are shown less often

### The Science
Research shows spaced repetition can improve retention by up to 200% compared to traditional studying. Our algorithm is based on the proven SM-2 system.

### Tips for Success
- Study a little bit every day rather than cramming
- Be honest with your self-ratings
- Don''t skip the "hard" cards - they need the most practice!',
   'Learn how our smart flashcard system helps you remember better',
   true, 3),

  ((SELECT id FROM public.help_categories WHERE slug = 'ai-features'),
   'ai-generated-content',
   'How does AI generate study content?',
   '## AI-Powered Study Content

Our AI analyzes your uploaded materials and creates study aids automatically.

### What gets generated
- **Summaries** - Key points and main concepts
- **Flashcards** - Question and answer pairs for active recall
- **Practice Questions** - Multiple choice and short answer questions
- **Concept Maps** - Visual connections between ideas

### Quality Assurance
- All content is generated from YOUR materials
- You can edit or delete any generated content
- Regenerate content if it doesn''t meet your needs

### Processing Time
- Small documents: 1-2 minutes
- Large textbooks: 5-10 minutes
- Videos: Varies by length',
   'Understand how AI creates flashcards, summaries, and quizzes',
   true, 4),

  ((SELECT id FROM public.help_categories WHERE slug = 'groups'),
   'create-study-group',
   'How do I create or join a study group?',
   '## Study Groups

Collaborate with classmates using study groups!

### Creating a Group
1. Go to the **Groups** section
2. Click **Create Group**
3. Add a name and description
4. Invite members via link or username

### Joining a Group
- Click an invite link shared by a friend
- Or search for public groups in your subject area

### Group Features
- **Shared Notes** - Share study materials with the group
- **Group Chat** - Discuss topics and ask questions
- **Study Sessions** - Schedule group study sessions
- **Voice Notes** - Send audio messages for explanations',
   'Learn how to collaborate with classmates',
   true, 5),

  ((SELECT id FROM public.help_categories WHERE slug = 'account'),
   'subscription-plans',
   'What are the subscription plans?',
   '## Subscription Plans

### Free Plan
- Upload up to 5 materials per month
- Basic AI summaries and flashcards
- Join up to 3 study groups

### Pro Plan
- Unlimited material uploads
- Advanced AI features (audio overviews, concept maps)
- Unlimited study groups
- Priority processing
- No ads

### How to Upgrade
1. Go to **Settings** > **Subscription**
2. Choose your plan
3. Complete payment via Paystack

*Cancel anytime - no long-term commitment required.*',
   'Compare free and premium features',
   true, 6);