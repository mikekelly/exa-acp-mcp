/**
 * Drop-in replacement for axios that routes requests through ACP proxy.
 *
 * Usage:
 *   import axios from "../utils/axiosAcp.js";
 *
 *   // Uses ACP_TOKEN from environment
 *   const instance = axios.create({ baseURL: "https://api.example.com" });
 *
 *   // Or pass token explicitly
 *   const instance = axios.create({ baseURL: "https://api.example.com", acpToken: "acp_xxx" });
 */

import axios, { AxiosInstance, CreateAxiosDefaults } from "axios";
import { HttpsProxyAgent, HttpsProxyAgentOptions } from "https-proxy-agent";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { config as loadEnv } from "dotenv";
import tls from "tls";
import type { Socket } from "net";
import type { TLSSocket } from "tls";
import type http from "http";

// Load .env from the current working directory
loadEnv({ path: join(process.cwd(), '.env') });

const DEFAULT_ACP_PROXY_URL = "http://localhost:9443";
const ACP_CA_CERT_PATH = join(homedir(), ".config", "acp", "ca.crt");

/**
 * Custom proxy agent that injects CA certificates for TLS verification.
 */
class AcpProxyAgent extends HttpsProxyAgent {
  private customCA: string[];

  constructor(proxy: string, opts: HttpsProxyAgentOptions<string> & { ca?: string[] }) {
    super(proxy, opts);
    this.customCA = opts.ca || [];
  }

  async connect(
    req: http.ClientRequest,
    opts: { host: string; port: number; secureEndpoint: boolean; [key: string]: unknown }
  ): Promise<Socket | TLSSocket> {
    const optsWithCA = {
      ...opts,
      ca: this.customCA,
    };
    return super.connect(req, optsWithCA);
  }
}

// Cache proxy agents by token to avoid recreating them
const proxyAgentCache = new Map<string, AcpProxyAgent>();

function getProxyAgent(acpToken: string): AcpProxyAgent {
  if (proxyAgentCache.has(acpToken)) {
    return proxyAgentCache.get(acpToken)!;
  }

  const acpProxyUrl = process.env.ACP_PROXY_URL || DEFAULT_ACP_PROXY_URL;

  if (!existsSync(ACP_CA_CERT_PATH)) {
    throw new Error(
      `ACP CA certificate not found at ${ACP_CA_CERT_PATH}.\n\n` +
      `If ACP is not installed, visit https://github.com/mikekelly/acp`
    );
  }

  const acpCa = readFileSync(ACP_CA_CERT_PATH, 'utf8');
  const allCAs = [...tls.rootCertificates, acpCa];

  const agent = new AcpProxyAgent(acpProxyUrl, {
    headers: {
      'Proxy-Authorization': `Bearer ${acpToken}`,
    },
    ca: allCAs,
  });

  proxyAgentCache.set(acpToken, agent);
  return agent;
}

// Extended config type that includes optional acpToken
type AcpAxiosConfig = CreateAxiosDefaults & {
  acpToken?: string;
};

/**
 * Drop-in replacement for axios.create() that routes through ACP proxy.
 *
 * @param config - Standard axios config, plus optional `acpToken`
 *   - If `acpToken` is provided, it will be used for proxy auth
 *   - Otherwise falls back to ACP_TOKEN environment variable
 */
function create(config?: AcpAxiosConfig): AxiosInstance {
  const { acpToken: configToken, ...axiosConfig } = config || {};
  const acpToken = configToken || process.env.ACP_TOKEN;

  if (!acpToken) {
    throw new Error(
      `ACP_TOKEN is required but not found.\n\n` +
      `To configure your ACP token:\n` +
      `  1. Generate a token: acp token create\n` +
      `  2. Set it via one of these methods:\n` +
      `     - Environment variable: export ACP_TOKEN=acp_xxx\n` +
      `     - .env file in working directory: ACP_TOKEN=acp_xxx\n` +
      `     - MCP config: { "acpToken": "acp_xxx" }\n\n` +
      `If ACP is not installed, visit https://github.com/mikekelly/acp`
    );
  }

  const proxyAgent = getProxyAgent(acpToken);

  return axios.create({
    ...axiosConfig,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
    proxy: false,
  });
}

// Export a drop-in replacement for axios
const axiosAcp = {
  create,
  // Re-export other axios utilities that might be needed
  isAxiosError: axios.isAxiosError,
  // Allow access to the underlying axios for edge cases
  axios,
};

export default axiosAcp;
export { create, axios };
