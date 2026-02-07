

## How Skills Get Saved to the Skills Library

Currently, the system has all the backend pieces in place but is missing the frontend trigger to actually create skills. Here's what needs to be built:

### Current Flow (What Exists)

1. **Backend**: `skill-generator` edge function can generate skills and save them to `advisor_skills` table with `status: 'pending'`
2. **Backend**: Chat functions (`advisor-chat`, `persona-chat`, `book-chat`) inject skill context into AI prompts
3. **Frontend**: Skills Library page at `/skills` can display and manage skills from the database
4. **Gap**: No frontend code ever calls the `skill-generator` function

### What Needs to Change

There are two ways skills can be created -- we need to implement both:

---

### 1. Detect `skill-generate` blocks in AI responses

When an AI advisor decides a skill should be created, it outputs a special code block (like it does for `skill-execute`). The frontend needs to detect this and call the `skill-generator` edge function.

**File: `src/components/chat/MessageContent.tsx`**
- Add parsing for a new code block format (e.g., ` ```skill-generate `) in the markdown renderer
- When detected, render a "Generate Skill" UI component that calls the `skill-generator` edge function

**New file: `src/components/skills/SkillGenerationBlock.tsx`**
- A component that displays the skill request from the AI
- Shows a "Generate & Save" button
- Calls `supabase.functions.invoke('skill-generator', { body: { ... } })`
- On success, shows confirmation with link to Skills Library

### 2. Add a "Create Skill" button in the Skills Library

Allow users to manually request a skill by describing what they want.

**File: `src/components/skills/SkillsLibrary.tsx`**
- Add a "Create Skill" button/dialog in the header area
- Dialog with a text input for describing the desired skill and a dropdown to pick an advisor
- On submit, calls the `skill-generator` edge function
- New skill appears in the library with "pending" status

---

### 3. Update chat system prompts to include skill generation syntax

**Files: `supabase/functions/advisor-chat/index.ts`, `persona-chat/index.ts`, `book-chat/index.ts`**
- Add instructions to the system prompt telling the AI how to output a `skill-generate` block when the user asks for a reusable tool

---

### Technical Details

**New component `SkillGenerationBlock.tsx`:**
```typescript
// Renders when AI outputs ```skill-generate { skillDescription, advisorId }
// Calls skill-generator edge function
// Shows pending state, then success with link to /skills
```

**MessageContent.tsx changes:**
- Add `skill-generate` to the code block parser (alongside existing `mermaid`, `image`, `skill-execute`, `chart`)
- Render `SkillGenerationBlock` when detected

**SkillsLibrary.tsx changes:**
- Add Dialog with textarea for skill description
- Add advisor selector (fetch from `custom_frameworks` / `custom_personas`)
- Call `skill-generator` on submit
- Refresh skill list after creation

**Edge function prompt additions:**
- Add a section like: "To create a new reusable skill, output a `skill-generate` block with the description"

### Implementation Order

1. Create `SkillGenerationBlock.tsx` component
2. Update `MessageContent.tsx` to detect and render skill-generate blocks
3. Add "Create Skill" dialog to `SkillsLibrary.tsx`
4. Update chat edge function prompts with skill generation instructions
5. Redeploy updated edge functions

