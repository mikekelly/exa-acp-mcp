# exa-gapped-mcp

A fork of [exa-mcp-server](https://github.com/exa-labs/exa-mcp-server) that routes all Exa API requests through [GAP (Gated Agent Proxy)](https://github.com/anthropics/gap) for secure credential management.

## What is GAP?

GAP is a credential injection proxy that sits between AI agents and APIs. Instead of giving agents direct access to API keys, GAP:

- Stores credentials securely outside the agent's context
- Injects credentials at the network layer when requests pass through the proxy
- Provides audit logging of all API access
- Allows credential rotation without updating agent configurations

## Prerequisites

1. **GAP installed and running** - See [GAP setup instructions](https://github.com/anthropics/gap)
2. **Exa plugin configured in GAP** - With your Exa API credentials stored
3. **GAP token** - Created via `gap token create`

## Installation

```bash
npm install -g exa-gapped-mcp
```

## Configuration

### Environment Variables

Create a `.env` file in your working directory or set environment variables:

```bash
# Required: GAP token for proxy authentication
GAP_TOKEN=gap_xxxxxxxxxxxx

# Optional: GAP proxy URL (defaults to http://localhost:9443)
GAP_PROXY_URL=http://localhost:9443
```

The server automatically loads `.env` from the current working directory.

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-gapped-mcp"],
      "env": {
        "GAP_TOKEN": "gap_xxxxxxxxxxxx"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add exa -e GAP_TOKEN=gap_xxxxxxxxxxxx -- npx -y exa-gapped-mcp
```

Or with a `.env` file in your project:

```bash
claude mcp add exa -- npx -y exa-gapped-mcp
```

## Available Tools

By default, two tools are enabled:

- **web_search_exa** - Real-time web search with content extraction
- **get_code_context_exa** - Code snippets, documentation, and examples from GitHub repos and docs

### Additional Tools

Enable more tools using the `tools` parameter:

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": [
        "-y",
        "exa-gapped-mcp",
        "tools=web_search_exa,get_code_context_exa,deep_search_exa,crawling_exa"
      ],
      "env": {
        "GAP_TOKEN": "gap_xxxxxxxxxxxx"
      }
    }
  }
}
```

All available tools:
- `web_search_exa` - Web search (enabled by default)
- `get_code_context_exa` - Code context search (enabled by default)
- `deep_search_exa` - Deep search with query expansion
- `crawling_exa` - Extract content from specific URLs
- `company_research_exa` - Company research
- `linkedin_search_exa` - LinkedIn search
- `deep_researcher_start` - Start async research task
- `deep_researcher_check` - Check research task status

## How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Claude    │────▶│     GAP     │────▶│   Exa API   │
│   Agent     │     │   Proxy     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                    Injects Exa
                    API credentials
```

1. Agent makes request through this MCP server
2. Request is routed through GAP proxy on localhost:9443
3. GAP authenticates the request using the `GAP_TOKEN`
4. GAP injects Exa API credentials into the request
5. Request is forwarded to api.exa.ai

## Differences from exa-mcp-server

| Feature | exa-mcp-server | exa-gapped-mcp |
|---------|---------------|-------------|
| Credential handling | Direct `EXA_API_KEY` | Via GAP proxy |
| API key exposure | In env/config | Never exposed to agent |
| Audit logging | None | Via GAP |
| Setup complexity | Simple | Requires GAP |

## Troubleshooting

### "GAP_TOKEN is required"

Set the `GAP_TOKEN` environment variable or add it to your `.env` file.

### "GAP CA certificate not found"

Ensure GAP is installed and initialized. The CA cert should be at `~/.config/gap/ca.crt`.

### Connection refused on port 9443

Start the GAP proxy server. Check status with `gap status`.

## License

MIT

## Credits

- Original [exa-mcp-server](https://github.com/exa-labs/exa-mcp-server) by Exa Labs
- [GAP](https://github.com/anthropics/gap) by Anthropic
