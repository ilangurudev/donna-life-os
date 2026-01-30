# Content Type Definitions

This guide defines when to use each content type and how they relate to each other.

## Decision Flowchart

```
User mentions something
         │
         ▼
┌─────────────────────────┐
│ Is there a clear action?│
└─────────────────────────┘
         │
    No   │   Yes
    ▼    │    ▼
  NOTE   │  ┌─────────────────────────┐
         │  │ Is it multi-step with   │
         │  │ deadline/event/phases?  │
         │  └─────────────────────────┘
         │         │
         │    No   │   Yes
         │    ▼    │    ▼
         │  TASK   │  PROJECT + suggest tasks
         │         │
         ▼─────────┴─────────▼
                   │
    Also update CURRENT CONTEXT if relevant
```

---

## Task

> A single action one person can complete, typically in one session

### When to Create

- Clear verb + object ("buy diapers", "call venue", "send invites")
- Can be completed without breaking down further
- Recurring events (birthdays, anniversaries) - one task per occurrence

### When NOT to Create

- Requires multiple steps spanning days → **Project**
- Vague or needs exploration → **Note**
- It's an outcome, not an action → **Goal**

### Linking to Projects

If a task belongs to a project:
1. Set `project:` field in frontmatter to `[[Project Name]]`
2. Also add wikilink in the `## Related` section

---

## Project

> A multi-step initiative with a clear outcome and usually a deadline

### When to Create

- 3+ related tasks working toward one outcome
- Events: party, shower, wedding, trip, move
- Launches: product, business, website
- Life transitions: new baby, new job, new home
- User says "planning", "preparing for", "organizing"

### Signals That Scream "PROJECT"

| Category | Examples |
|----------|----------|
| Events | wedding, baby shower, birthday party, reunion, trip |
| Launches | product release, website launch, starting a business |
| Transitions | expecting a baby, new job, moving, buying a house |
| Seasonal | tax season, holiday planning, back-to-school |

### Behavior on Creation

1. Create the project file
2. **Suggest 3-5 likely tasks** the user might not think of
3. Ask which to add - don't auto-create all
4. Example response:

```
Created project: [[Baby Shower]]
Target date: 2026-02-05

Here are some tasks you might need - which should I add?
- [ ] Create guest list
- [ ] Send invitations (ideally 5+ days before)
- [ ] Book/confirm venue
- [ ] Plan food & drinks
- [ ] Coordinate decorations
- [ ] Plan games/activities
```

### Task Backlinks

Projects should maintain a `## Tasks` section listing all related tasks:

```markdown
## Tasks

- [[Send baby shower invitations]] - get these out 5+ days before
- [[Book venue for baby shower]]
- [[Create guest list]] - check with partner first
```

Brief descriptions are optional - use them to add context, not to duplicate status/due date (that data lives in the task file).

### Flexibility Rule

If unsure whether something is a task or project:
1. Make your best guess based on complexity
2. State what you created and why
3. Offer the alternative: "I created this as a project since it has multiple steps. Would you prefer it as a single task instead?"
4. If user chooses alternative, clean up and switch

---

## Note

> Information worth preserving that doesn't (yet) require action

### When to Create

- Ideas, thoughts, observations
- Reference information (research, recommendations, quotes)
- Conversation snippets worth remembering
- Unclear if action needed → use `status: needs_clarification`

### When NOT to Create

- Clear action exists → **Task**
- Multi-step effort identified → **Project**

### Notes Can Evolve

A note with `status: needs_clarification` might later become:
- A task (once action is clear)
- A project (once scope is understood)
- Archived (if no longer relevant)

---

## Goal

> A desired future state measured over time, not by task completion

### When to Create

- Becoming/achieving/reaching a state
- Has timeframe (weekly, monthly, quarterly, yearly)
- Success = outcomes, not checkboxes
- Examples: "get healthier", "be more present", "financial independence"

### Goal vs Project

| Goal | Project |
|------|---------|
| "Be a good parent" | "Prepare for baby arrival" |
| "Get healthier" | "Run a 5K in March" |
| "Financial independence" | "Pay off credit card" |
| Ongoing, never "done" | Finite, completable |

---

## Current Context

> Working memory - what's actively on the user's mind

### When to Update

- Topic will likely come up again soon
- Provides useful background for future conversations
- Time-sensitive or situational information

### Critical Rule

**NEVER update current context as a substitute for creating content.**

Current context is supplementary. If something is actionable or worth preserving:
1. Create the appropriate Task/Project/Note FIRST
2. THEN update current context if relevant

Bad: User mentions baby shower → only update current context
Good: User mentions baby shower → create Project + suggest tasks + update current context

---

## Person

> Relationship context for people mentioned

### When to Create

- Person is mentioned with meaningful context
- Will likely come up in future conversations
- Has relationship to user worth tracking (family, friend, colleague, etc.)

---

## Check-in

> Periodic personal reflection

### When to Create

- Morning or evening reflection
- User wants to log energy/mood/intentions
- Regular cadence (daily, weekly)

---

## Daily Log

> Auto-generated summary of the day

### When to Create

- Generated automatically, not manually created
- Summarizes tasks completed, notes captured, conversations had

---

## Summary: Content Type at a Glance

| Type | Core Question | Key Signal |
|------|---------------|------------|
| Task | "What single action needs doing?" | Verb + object, completable in one sitting |
| Project | "What multi-step effort is this?" | Event, launch, transition, "planning X" |
| Note | "What's worth remembering?" | No clear action, ideas, reference |
| Goal | "What state am I working toward?" | Ongoing aspiration, measured by outcomes |
| Current Context | "What's on their mind right now?" | Relevant to next conversation |
| Person | "Who is this and how do they relate?" | Named individual with context |
| Check-in | "How am I feeling/what's my energy?" | Reflection, mood, intentions |
