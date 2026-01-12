---
name: current-context-updater
description: Maintain the current_context.md file with information likely relevant to upcoming conversations
---

# Purpose

The `donna-data/current_context.md` file is Donna's **working memory** - it holds what's most likely to be relevant in the user's next session. Think of it as "what's on the user's mind right now."

This is NOT a permanent record. It's a living document that evolves with each conversation.

## When to Update

After every meaningful conversation, consider:

1. **What did the user just talk about?** If they mentioned something, it's fresh in their mind. Add or update that item with the current timestamp.

2. **What's stale?** Items not mentioned in ~30 days are probably no longer "current." Remove them. If something is truly important, it belongs in `user_info_and_preferences.md`, not here.

3. **What's resolved?** If a concern, task, or situation has concluded, remove it. The current context is about what's *active*, not what *was*.

## Philosophy

- **Recency > Completeness** - This file should be lean. 5-10 items max.
- **Relevance > History** - Old stuff gets removed, not archived.
- **Trust the System** - Important long-term info lives in `user_info_and_preferences.md`. This file is just for "right now."
- **Always use wikilinks** - Reference entities as `[[Project Name]]` or `[[Person]]`. Links enable quick context gathering and make the file navigable for both AI and humans.

## File Format

```yaml
---
last_updated: [ISO datetime]
---

# Current Context

## [Topic/Title or [[wikilink]]]
*Last mentioned: YYYY-MM-DD*

Brief context that might help Donna pick up where things left off.
What's the situation? What was the user's state of mind about it?

## [Another Topic]
*Last mentioned: YYYY-MM-DD*

Summarized context...

---
*Auto-maintained by Donna*
```

## Examples of Good Current Context Items

- "Working on the Q1 presentation - stressed about the deadline Friday"
- "Kid's birthday party planning - venue booked, need to order cake"
- "Job interview at Acme Corp next Tuesday - feeling cautiously optimistic"
- "Car in the shop - waiting on quote for repairs"

## Examples of What Should Be Removed

- Items last mentioned 30+ days ago (unless explicitly ongoing)
- Completed events or resolved situations
- Vague items with no actionable context
- Anything that belongs in preferences (favorite coffee order isn't "current context")


IMPORTANT: Make sure you actually Write and update the `donna-data/current_context.md`. 