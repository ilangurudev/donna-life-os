# Date & Time Handling in Donna

## The Problem

Claude (the underlying LLM) doesn't inherently know the current date. Its knowledge has a cutoff, and without explicit date injection, it makes educated guesses based on:

1. **Context clues** - Dates mentioned in conversation or files
2. **Calendar pattern recognition** - Knows "Wednesday follows Tuesday" but without an anchor
3. **Recent file timestamps** - Can infer "we're around late January" from `created: 2026-01-25`

This led to bugs like "set deadline for Wednesday" → wrong Wednesday because Donna didn't know today's date.

## Solution Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Browser)                       │
│  Intl.DateTimeFormat().resolvedOptions().timeZone                │
│  → "America/New_York"                                            │
└──────────────────────────────┬──────────────────────────────────┘
                               │ WebSocket ?timezone=America/New_York
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (chat.py)                        │
│  websocket.query_params.get("timezone")                          │
│  → DonnaAgent(user_timezone="America/New_York")                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CORE (core.py)                           │
│  generate_date_context(user_timezone)                            │
│  → Injected into system prompt                                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DONNA'S SYSTEM PROMPT                       │
│  ## Current Date & Time                                          │
│  - Date: Monday, January 27, 2026                                │
│  - Time: 10:30 AM (America/New_York)                             │
│  - UTC timestamp: 2026-01-27T15:30:00Z                           │
│  - Date handling rules: [next Wednesday → 2026-01-28]            │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Browser Timezone Detection (`web/src/hooks/useChatWebSocket.ts`)

```typescript
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const wsUrl = `${protocol}//${window.location.host}/ws/chat?timezone=${encodeURIComponent(userTimezone)}`
```

**Why browser detection?**
- User can travel → timezone changes automatically
- No need to ask user during onboarding
- Always current, no stale preferences

### 2. Backend Passing (`src/web/routes/chat.py`)

```python
user_timezone = websocket.query_params.get("timezone")
donna = DonnaAgent(
    on_permission_request=permission_handler.handle_permission,
    user_timezone=user_timezone,
)
```

### 3. Date Context Generation (`src/core.py`)

```python
def generate_date_context(user_timezone: str | None = None) -> str:
    utc_now = datetime.now(timezone.utc)

    if user_timezone:
        user_tz = ZoneInfo(user_timezone)
    else:
        # CLI fallback: use system local timezone
        user_tz = datetime.now().astimezone().tzinfo

    local_now = utc_now.astimezone(user_tz)
    # ... format and return context string
```

### 4. System Prompt Injection (`src/core.py`)

```python
def build_full_system_prompt(user_timezone: str | None = None) -> str:
    # ... load base prompt

    # Add date/time context FIRST (most important for temporal reasoning)
    full_prompt += "\n\n" + generate_date_context(user_timezone)

    # ... add user preferences and current context
```

## Storage Format

**Always store in UTC:**
```yaml
# In markdown frontmatter
created: 2026-01-27T15:30:00Z
due_date: 2026-02-01
```

**Display in user's local timezone:**
- The system prompt tells Donna the user's timezone
- Donna should convert when displaying dates to user

## Date Handling Rules (Injected into Prompt)

These rules are included in Donna's system prompt:

| User says | Donna interprets |
|-----------|------------------|
| "today" | Current date in user's timezone |
| "tomorrow" | Current date + 1 day |
| "Wednesday" | NEXT occurrence from today |
| "next Wednesday" | Skip this week, use following week |

## CLI Behavior

The CLI (`src/cli.py`) creates `DonnaAgent` without `user_timezone`, which triggers the fallback:

```python
# When user_timezone is None:
user_tz = datetime.now().astimezone().tzinfo  # System local timezone
```

This means CLI users automatically get their system's timezone.

## Future Improvements

### 1. Date Resolution Tool (Not Yet Implemented)

For complex date expressions, consider adding a tool:

```python
def resolve_date(natural_date: str) -> str:
    """
    Convert 'third Thursday of February', 'in 2 weeks', 'end of Q1'
    to YYYY-MM-DD format using dateparser library.
    """
    import dateparser
    parsed = dateparser.parse(natural_date)
    return parsed.strftime("%Y-%m-%d") if parsed else None
```

### 2. Automatic Template Date Replacement

The `{{DATE}}` placeholders in templates (`src/.claude/skills/onboarding/template-donna-data/`) are currently not auto-replaced. Consider adding this during `setup_donna_data_directory()`.

### 3. Reminder System

Listed in `to-do.md` as item #2: "reminder system + date system". The date system is now implemented; reminder system pending.

## Testing

To verify date handling works:

1. **Web interface**: Open browser dev tools → Console
   ```javascript
   Intl.DateTimeFormat().resolvedOptions().timeZone
   // Should show your timezone like "America/New_York"
   ```

2. **Check WebSocket URL**: Network tab → WS → should show `?timezone=...`

3. **Ask Donna**: "What day is today?" - should respond correctly

4. **Test relative dates**: "Set a deadline for Wednesday" - should pick correct date

## Files Modified

| File | Change |
|------|--------|
| `src/core.py` | Added `generate_date_context()`, updated `build_full_system_prompt()` and `DonnaAgent` |
| `src/web/routes/chat.py` | Read timezone from query params, pass to `DonnaAgent` |
| `web/src/hooks/useChatWebSocket.ts` | Detect browser timezone, add to WebSocket URL |
