/**
 * Drop-in replacement for axios that routes requests through GAP proxy.
 *
 * Usage:
 *   import axios from "../utils/axiosGap.js";
 *
 *   // Uses GAP_TOKEN from environment
 *   const instance = axios.create({ baseURL: "https://api.example.com" });
 *
 *   // Or pass token explicitly
 *   const instance = axios.create({ baseURL: "https://api.example.com", gapToken: "gap_xxx" });
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

const DEFAULT_GAP_PROXY_URL = "http://localhost:9443";
const GAP_CA_CERT_PATH = join(homedir(), ".config", "gap", "ca.crt");

/**
 * Custom proxy agent that injects CA certificates for TLS verification.
 */
class GapProxyAgent extends HttpsProxyAgent {
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
const proxyAgentCache = new Map<string, GapProxyAgent>();

function getProxyAgent(gapToken: string): GapProxyAgent {
  if (proxyAgentCache.has(gapToken)) {
    return proxyAgentCache.get(gapToken)!;
  }

  const gapProxyUrl = process.env.GAP_PROXY_URL || DEFAULT_GAP_PROXY_URL;

  if (!existsSync(GAP_CA_CERT_PATH)) {
    throw new Error(
      `GAP CA certificate not found at ${GAP_CA_CERT_PATH}.\n\n` +
      `If GAP is not installed, visit https://github.com/mikekelly/gap`
    );
  }

  const gapCa = readFileSync(GAP_CA_CERT_PATH, 'utf8');
  const allCAs = [...tls.rootCertificates, gapCa];

  const agent = new GapProxyAgent(gapProxyUrl, {
    headers: {
      'Proxy-Authorization': `Bearer ${gapToken}`,
    },
    ca: allCAs,
  });

  proxyAgentCache.set(gapToken, agent);
  return agent;
}

// Extended config type that includes optional gapToken
type GapAxiosConfig = CreateAxiosDefaults & {
  gapToken?: string;
};

/**
 * Drop-in replacement for axios.create() that routes through GAP proxy.
 *
 * @param config - Standard axios config, plus optional `gapToken`
 *   - If `gapToken` is provided, it will be used for proxy auth
 *   - Otherwise falls back to GAP_TOKEN environment variable
 */
function create(config?: GapAxiosConfig): AxiosInstance {
  const { gapToken: configToken, ...axiosConfig } = config || {};
  const gapToken = configToken || process.env.GAP_TOKEN;

  if (!gapToken) {
    throw new Error(
      `GAP_TOKEN is required but not found.\n\n` +
      `To configure your GAP token:\n` +
      `  1. Generate a token: gap token create\n` +
      `  2. Set it via one of these methods:\n` +
      `     - Environment variable: export GAP_TOKEN=gap_xxx\n` +
      `     - .env file in working directory: GAP_TOKEN=gap_xxx\n` +
      `     - MCP config: { "gapToken": "gap_xxx" }\n\n` +
      `If GAP is not installed, visit https://github.com/mikekelly/gap`
    );
  }

  const proxyAgent = getProxyAgent(gapToken);

  return axios.create({
    ...axiosConfig,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
    proxy: false,
  });
}

// Export a drop-in replacement for axios
const axiosGap = {
  create,
  // Re-export other axios utilities that might be needed
  isAxiosError: axios.isAxiosError,
  // Allow access to the underlying axios for edge cases
  axios,
};

export default axiosGap;
export { create, axios };
