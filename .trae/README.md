# .trae Configuration Directory

This directory contains AI assistant configuration for the EDA Algorithm Evaluator project.

## Structure

```
.trae/
├── rules/                    # Project rules and guidelines
│   ├── project_rules.md      # Core project conventions
│   └── doc_update_rules.md   # Documentation update rules
├── prompts/                  # Custom prompt templates
│   ├── code_review.md        # Code review checklist
│   └── new_component.md      # New component template
└── context/                  # Project context files
    └── project_context.md    # Architecture and key functions
```

## Usage

- **project_rules.md**: Loaded automatically by Trae IDE as project rules
- **project_context.md**: Context information for AI assistant
- **prompts/**: Reusable prompt templates for common tasks
- **doc_update_rules.md**: Guidelines for updating documentation

## Files

| File | Purpose |
|------|---------|
| `project_rules.md` | Code conventions, naming, key modules |
| `project_context.md` | Architecture, data flow, key functions |
| `doc_update_rules.md` | When and how to update docs |
| `code_review.md` | Code review checklist |
| `new_component.md` | Template for new components |
