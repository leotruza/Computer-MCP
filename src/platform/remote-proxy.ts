// SPDX-License-Identifier: GPL-3.0-only
import { spawn } from "node:child_process";

export interface RemoteProxyOptions {
  target: string;
  port?: string;
  identityFile?: string;
  knownHostsFile?: string;
  command: string;
}

/** Proxy the MCP stdio stream to a Linux guest over OpenSSH. No tool calls run on the host. */
export async function startRemoteProxy(options: RemoteProxyOptions): Promise<never> {
  const args = ["-T"];
  if (options.port) args.push("-p", options.port);
  if (options.identityFile) args.push("-i", options.identityFile);
  if (options.knownHostsFile) args.push("-o", `UserKnownHostsFile=${options.knownHostsFile}`);
  args.push(options.target, options.command);
  const child = spawn(process.env.COMPUTER_MCP_SSH_BIN || "ssh", args, { stdio: ["pipe", "pipe", "inherit"] });
  if (!child.stdin || !child.stdout) throw new Error("Unable to create SSH stdio streams.");
  process.stdin.pipe(child.stdin);
  child.stdout.pipe(process.stdout);
  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
  process.exit(exitCode);
}

export function remoteOptionsFromEnvironment(): RemoteProxyOptions | null {
  const target = process.env.COMPUTER_MCP_SSH_TARGET;
  if (!target) return null;
  return {
    target,
    port: process.env.COMPUTER_MCP_SSH_PORT,
    identityFile: process.env.COMPUTER_MCP_SSH_IDENTITY,
    knownHostsFile: process.env.COMPUTER_MCP_SSH_KNOWN_HOSTS,
    command: process.env.COMPUTER_MCP_REMOTE_COMMAND || "node /opt/computer-mcp/dist/index.js",
  };
}

export function remoteOptionsFromArgs(argv = process.argv.slice(2)): RemoteProxyOptions | null {
  const value = (name: string): string | undefined => { const index = argv.indexOf(name); return index >= 0 ? argv[index + 1] : undefined; };
  const target = value("--remote-target");
  if (!target) return null;
  return {
    target,
    port: value("--remote-port"),
    identityFile: value("--remote-identity"),
    knownHostsFile: value("--remote-known-hosts"),
    command: value("--remote-command") || "node /opt/computer-mcp/dist/index.js",
  };
}
