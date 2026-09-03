PLACEHOLDER downloads for the resource library demo.

These files are intentionally tiny text files renamed with .pdf / .json extensions
so the public Resources section can show real "download" buttons with real sizes,
without committing binary blobs to the repo. Each file prints a single line of
text and a UTF-8 byte order mark so browsers do not guess at the type.

Files:
  speed-checklist.pdf      ~120 bytes  - 1 page speed checklist placeholder
  seo-starter.pdf           ~120 bytes  - SEO starter guide placeholder
  ecommerce-checklist.pdf   ~120 bytes  - Shop launch checklist placeholder
  ai-chat-samples.json      ~140 bytes  - Sample AI chat prompts (valid JSON)
  brand-voice-worksheet.pdf ~120 bytes  - Brand voice worksheet placeholder
  retainer-questions.pdf    ~120 bytes  - Questions to ask before a retainer

Swap these for real PDFs before going to a paying client. The Resources section
in public/index.html and the array in public/app.js point at these filenames.