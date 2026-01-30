# Date & Time Handling in Donna

This guide documents how Donna handles dates, times, and timezones - the choices made, rationale, and remaining work.

## The Problem

Donna had no concept of "now." When a user said "I have a deadline on Wednesday," Donna would guess incorrectly because:

1. **No current date in system prompt** - Claude wasn't told what day it is
2. **No timezone context** - The server might be in UTC while the user is in EST, causing off-by-one-day errors
3. **Relative dates are ambiguous** - "Wednesday" means different things depending on what day it is

### Example of the Bug

- User (in EST, Monday evening): "Deadline is Wednesday"
- Server (in UTC): Already Tuesday
- Donna: Sets deadline as Thursday (off by one day)

## Current Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
│  Intl.DateTimeFormat().resolvedOptions().timeZone              │
│  → "America/New_York"                                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │ WebSocket ?timezone=America/New_York
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                  │
│  get_effective_timezone(client_timezone)                       │
│  → Fallback: user prefs → system timezone                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM PROMPT                                │
│  ═══ DATE & TIME CONTEXT ═══                                   │
│  Today: Tuesday, January 27, 2026                              │
│  Current time: 10:30 AM EST (America/New_York)                 │
│  [2026-01-27T10:30:00-05:00]                                   │
│                                                                 │
│  ─── This Week ───                                             │
│  Tomorrow (Wed): January 28, 2026 [2026-01-28]                 │
│  Thursday: January 29, 2026 [2026-01-29]                       │
│  ...                                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `donna_life_os/core.py` | `generate_date_context()`, `get_effective_timezone()` |
| `donna_life_os/web/routes/chat.py` | Extracts timezone from WebSocket query params |
| `web/src/hooks/useChatWebSocket.ts` | Sends browser timezone on connect |
| `pyproject.toml` | `tzlocal>=5.2` dependency |

### Timezone Fallback Chain

```python
def get_effective_timezone(client_timezone: str | None = None) -> ZoneInfo:
    # 1. Client-provided (from browser)
    if client_timezone:
        return ZoneInfo(client_timezone)

    # 2. User's stored preference
    if user_prefs.timezone != "TBD":
        return ZoneInfo(user_prefs.timezone)

    # 3. System timezone (via tzlocal)
    return get_localzone()
```

### What Gets Injected

The system prompt receives:

```
═══ DATE & TIME CONTEXT ═══
Today: Tuesday, January 27, 2026
Current time: 10:30 AM EST (America/New_York) [2026-01-27T10:30:00-05:00]

─── This Week ───
Tomorrow (Wed):    January 28, 2026 [2026-01-28]
Wednesday:         January 28, 2026 [2026-01-28]
Thursday:          January 29, 2026 [2026-01-29]
Friday:            January 30, 2026 [2026-01-30]
Saturday:          January 31, 2026 [2026-01-31]
Sunday:            February 1, 2026 [2026-02-01]
Next Monday:       February 2, 2026 [2026-02-02]

─── Reference Points ───
1 week from now:   Tuesday, February 3, 2026 [2026-02-03]
2 weeks from now:  Tuesday, February 10, 2026 [2026-02-10]
End of month:      Saturday, January 31, 2026 [2026-01-31]
```

This gives Donna:
- **Exact current time** with timezone offset for unambiguous interpretation
- **Day-of-week mappings** so "Wednesday" → January 28 is a direct lookup
- **Reference anchors** for "next week", "in two weeks", "end of month"

## Design Decisions

### 1. Timezone in WebSocket Query Param (not message body)

**Choice:** Pass timezone as `?timezone=America/New_York` in WebSocket URL

**Why:**
- Timezone is session-level context, not per-message
- Set once at connection time, used for entire conversation
- Cleaner than requiring a special "init" message

**Alternative considered:** Send timezone in first message
- Rejected: Would require protocol changes and special handling

### 2. ISO 8601 with Offset for Storage

**Choice:** Store dates as `2026-01-28T15:00:00-05:00` when time is known

**Why:**
- Human-readable as local time (3:00 PM on Jan 28)
- Machine-convertible to any timezone (UTC: 20:00:00)
- Unambiguous and reversible
- Standard format that parsers understand

**For date-only fields:** Use `2026-01-28` (plain date)
- Timezone is implicit from user preferences
- Simpler for deadlines where time doesn't matter

### 3. Pre-calculated Day Lookups

**Choice:** Include next 7 days with day names in prompt

**Why:**
- "Wednesday" → direct lookup, no calculation needed
- Eliminates Claude's date arithmetic errors
- Handles "this Wednesday" vs "next Wednesday" edge cases
- Minimal token cost (~200 tokens)

### 4. Browser Timezone Detection

**Choice:** `Intl.DateTimeFormat().resolvedOptions().timeZone`

**Why:**
- Returns IANA timezone (e.g., "America/New_York")
- Handles DST automatically
- Supported in all modern browsers
- More reliable than offset-based detection

### 5. tzlocal for CLI/Server

**Choice:** Use `tzlocal` library for system timezone

**Why:**
- Cross-platform (Windows, macOS, Linux)
- Returns proper IANA timezone names
- Handles edge cases (Docker containers, etc.)
- Well-maintained library

### 6. Date Context at Prompt Build Time

**Choice:** Generate date context when system prompt is built (session start)

**Why:**
- Date/time is fixed for the session
- Consistent throughout conversation
- Avoids complexity of updating mid-conversation

**Tradeoff:** Long conversations could have stale time
- Acceptable: Most conversations are short
- Future: Could refresh on reconnect

## Date Format Standards

### In System Prompt
```
Human-readable with ISO in brackets:
Tuesday, January 27, 2026 [2026-01-27]
10:30 AM EST [2026-01-27T10:30:00-05:00]
```

### In Markdown Files (donna-data)

| Field Type | Format | Example |
|------------|--------|---------|
| Date only | `YYYY-MM-DD` | `due: 2026-01-28` |
| Date + time | ISO 8601 with offset | `created: 2026-01-27T10:30:00-05:00` |
| Timestamps | ISO 8601 with offset | `last_updated: 2026-01-27T10:30:00-05:00` |

### User Preferences

```yaml
# In user_info_and_preferences.md
timezone: America/New_York  # IANA timezone
```

## Remaining Work / TODOs

### High Priority

1. **CLI Timezone Support**
   - CLI currently uses system timezone only
   - Should read from user preferences first
   - Location: `donna_life_os/cli.py` (needs to pass timezone to DonnaAgent)

2. **Onboarding Timezone Detection**
   - During onboarding, Donna should note the detected timezone
   - Should offer to save it to preferences
   - Location: `donna_life_os/.claude/skills/onboarding/`

3. **Timezone in User Preferences**
   - Donna should proactively update `timezone` field when detected
   - Currently stays as "TBD" unless manually set

### Medium Priority

4. **"Next Wednesday" Disambiguation**
   - Current logic uses day offset to decide "Next" prefix
   - Edge case: If today is Wednesday, is "Wednesday" today or next week?
   - May need more sophisticated handling

5. **Time-of-Day Awareness**
   - "Tomorrow" at 11:59 PM vs 12:01 AM
   - Morning/afternoon/evening context for greetings

6. **Long Session Staleness**
   - Sessions spanning midnight could have wrong date
   - Consider: Refresh date context on message if >1 hour old

### Low Priority / Future

7. **Multiple Timezone Support**
   - User works across timezones
   - "Schedule call for 3pm their time (London)"
   - Would need timezone conversion in responses

8. **Calendar Integration**
   - Sync with external calendars
   - Would need to handle timezone conversion

9. **Recurring Events**
   - "Every Tuesday at 3pm"
   - DST handling for recurring times

10. **Historical Date Queries**
    - "What did I do last Wednesday?"
    - Need to calculate past dates, not just future

## Testing

### Manual Testing

```bash
# Test date context generation
uv run python -c "
from donna_life_os.core import generate_date_context
from zoneinfo import ZoneInfo

# Test specific timezone
print(generate_date_context(ZoneInfo('America/New_York')))
print()
print(generate_date_context(ZoneInfo('Europe/London')))
"
```

### Edge Cases to Test

1. **Timezone boundaries** - User in timezone where it's a different day than server
2. **DST transitions** - Dates around daylight saving changes
3. **End of month** - January 31 → February calculations
4. **End of year** - December 31 → January 1 calculations
5. **Leap years** - February 29 handling

## References

- [IANA Time Zone Database](https://www.iana.org/time-zones)
- [ISO 8601 Date/Time Format](https://en.wikipedia.org/wiki/ISO_8601)
- [tzlocal library](https://github.com/regebro/tzlocal)
- [Python zoneinfo](https://docs.python.org/3/library/zoneinfo.html)
