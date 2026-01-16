# Refactor Task: ACP → GAP Rename

## Context
This is a complete rename of the project from "exa-acp-mcp" (Agent Credential Proxy) to "exa-gapped-mcp" (Gated Agent Proxy). All references to "acp" and "ACP" must be changed to "gap" and "GAP" throughout the codebase.

## Working Directory
`/Users/mike/code/exa-acp-mcp`

## Files with acp/ACP references (found via grep):
- README.md
- package.json
- package-lock.json
- src/index.ts
- src/utils/axiosAcp.ts (also needs filename change)
- src/tools/exaCode.ts
- src/tools/deepResearchCheck.ts
- src/tools/deepResearchStart.ts
- src/tools/linkedInSearch.ts
- src/tools/crawling.ts
- src/tools/companyResearch.ts
- src/tools/deepSearch.ts
- src/tools/webSearch.ts

## Replacements Required

### Text replacements:
- "acp" → "gap" (lowercase)
- "ACP" → "GAP" (uppercase)
- "Acp" → "Gap" (title case)
- "Agent Credential Proxy" → "Gated Agent Proxy"
- "exa-acp-mcp" → "exa-gapped-mcp"

### File renames:
- `src/utils/axiosAcp.ts` → `src/utils/axiosGap.ts`

### Critical notes:
1. This is NOT test-driven work - it's a mechanical refactoring
2. Update imports wherever axiosAcp is imported (likely in tools/*.ts files)
3. After all changes, run `npm install` to regenerate package-lock.json
4. Verify no remaining acp/ACP references with grep
5. Commit all changes with message: "Refactor: Rename project from exa-acp-mcp to exa-gapped-mcp (ACP → GAP)"

## Success Criteria
1. All text references updated (acp→gap, ACP→GAP)
2. File `src/utils/axiosAcp.ts` renamed to `axiosGap.ts`
3. All imports updated
4. package-lock.json regenerated
5. No remaining acp/ACP references in codebase (verified via grep)
6. All changes committed
