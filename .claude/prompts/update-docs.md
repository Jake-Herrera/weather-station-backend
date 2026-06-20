# Documentation Update Rules

## Goal
Update README.md and PROJECT.md to reflect current project state.

## Files to Update
- README.md: User-facing documentation
- PROJECT.md: Technical/architectural documentation

## Rules

### README.md
- Keep it concise (max 200 lines)
- Sections: Description, Features, Tech Stack, Setup, Usage
- Update feature list based on recent changes
- Update tech stack if new dependencies added
- DO NOT modify badges or links manually

### PROJECT.md
- Architectural decisions
- Folder structure
- Key patterns used
- Recent changes log

## Process
1. Review recent git log (last 10 commits)
2. Check package.json for new dependencies
3. Scan src/ for new features/components
4. Update docs accordingly
5. Be concise - no fluff
6. Preserve existing structure
7. Only add meaningful updates

## Style
- Clear, technical English
- No marketing language
- Bullet points where appropriate
- Code examples when relevant