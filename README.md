# Juicebox Boolean Builder Pro

From Boolean to AI sourcing — instantly.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add your Anthropic API key to `.env.local`:
```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Minimalist UX**: Clean form with just 4 inputs (Role, Skills, Location, Exclude)
- **AI-Assisted Output**: Boolean string + explanation via Claude
- **Cross-platform modes**: LinkedIn, GitHub, Google X-Ray, Generic ATS
- **Share & Save**: One-click copy and PeopleGPT integration
- **Smart Expansion**: Auto-suggest synonyms and related roles

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic Claude API
- Lucide React Icons

## Usage

1. Enter role/title (e.g., "Software Engineer")
2. Add required skills (comma-separated)
3. Optionally add exclude terms and location
4. Select platform (LinkedIn, GitHub, Google X-Ray, or Generic)
5. Click "Generate Boolean"
6. Copy the string or open directly in PeopleGPT