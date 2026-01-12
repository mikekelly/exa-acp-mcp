# exa-acp-mcp

A fork of [exa-mcp-server](https://github.com/exa-labs/exa-mcp-server) that routes all Exa API requests through [ACP (Agent Credential Proxy)](https://github.com/anthropics/acp) for secure credential management.

## What is ACP?

ACP is a credential injection proxy that sits between AI agents and APIs. Instead of giving agents direct access to API keys, ACP:

- Stores credentials securely outside the agent's context
- Injects credentials at the network layer when requests pass through the proxy
- Provides audit logging of all API access
- Allows credential rotation without updating agent configurations

## Prerequisites

1. **ACP installed and running** - See [ACP setup instructions](https://github.com/anthropics/acp)
2. **Exa plugin configured in ACP** - With your Exa API credentials stored
3. **ACP token** - Created via `acp token create`

## Installation

```bash
npm install -g exa-acp-mcp
```

## Configuration

### Environment Variables

Create a `.env` file in your working directory or set environment variables:

```bash
# Required: ACP token for proxy authentication
ACP_TOKEN=acp_xxxxxxxxxxxx

# Optional: ACP proxy URL (defaults to http://localhost:9443)
ACP_PROXY_URL=http://localhost:9443
```

The server automatically loads `.env` from the current working directory.

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-acp-mcp"],
      "env": {
        "ACP_TOKEN": "acp_xxxxxxxxxxxx"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add exa -e ACP_TOKEN=acp_xxxxxxxxxxxx -- npx -y exa-acp-mcp
```

Or with a `.env` file in your project:

```bash
claude mcp add exa -- npx -y exa-acp-mcp
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
        "exa-acp-mcp",
        "tools=web_search_exa,get_code_context_exa,deep_search_exa,crawling_exa"
      ],
      "env": {
        "ACP_TOKEN": "acp_xxxxxxxxxxxx"
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
│   Claude    │────▶│     ACP     │────▶│   Exa API   │
│   Agent     │     │   Proxy     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                    Injects Exa
                    API credentials
```

1. Agent makes request through this MCP server
2. Request is routed through ACP proxy on localhost:9443
3. ACP authenticates the request using the `ACP_TOKEN`
4. ACP injects Exa API credentials into the request
5. Request is forwarded to api.exa.ai

## Differences from exa-mcp-server

| Feature | exa-mcp-server | exa-acp-mcp |
|---------|---------------|-------------|
| Credential handling | Direct `EXA_API_KEY` | Via ACP proxy |
| API key exposure | In env/config | Never exposed to agent |
| Audit logging | None | Via ACP |
| Setup complexity | Simple | Requires ACP |

## Troubleshooting

### "ACP_TOKEN is required"

Set the `ACP_TOKEN` environment variable or add it to your `.env` file.

### "ACP CA certificate not found"

Ensure ACP is installed and initialized. The CA cert should be at `~/.config/acp/ca.crt`.

### Connection refused on port 9443

Start the ACP proxy server. Check status with `acp status`.

## License

MIT

## Credits

- Original [exa-mcp-server](https://github.com/exa-labs/exa-mcp-server) by Exa Labs
- [ACP](https://github.com/anthropics/acp) by Anthropic
