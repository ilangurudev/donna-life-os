---
name: writing
description: Guidelines for creating new markdown files in donna-data
---

# Writing Skill

This skill provides guidelines for creating new markdown files in `~/donna-data/`.

## Using Templates

**Always check for a `_template.md` file** in the target directory before creating new content.

### How It Works

1. Before creating a new file in any content directory (tasks, projects, notes, people, goals, etc.), check if a `_template.md` file exists in that directory
2. If a template exists, use it as the starting structure for your new file
3. Fill in the template fields with appropriate values
4. Replace placeholder text (like `{{DATE}}`) with actual values

### Example

When creating a new task in `~/donna-data/tasks/`:

1. Read `~/donna-data/tasks/_template.md` first
2. Create the new file using that structure
3. Fill in the frontmatter fields (status, due_date, energy_required, etc.)
4. Replace the title and description with actual content

### Template Placeholders

Common placeholders you may encounter:
- `{{DATE}}` - Replace with current date in YYYY-MM-DD format
- `# Task Title` or similar - Replace with actual title
- Comments like `# low | medium | high` - These indicate valid values; pick one and remove the comment

### Why Templates Matter

- **Consistency** - All files of the same type follow the same structure
- **Completeness** - Templates remind you what fields to include
- **Discoverability** - Consistent structure makes searching and filtering easier
