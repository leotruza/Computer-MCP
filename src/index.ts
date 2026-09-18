// SPDX-License-Identifier: GPL-3.0-only
import { remoteOptionsFromArgs, remoteOptionsFromEnvironment, startRemoteProxy } from "./platform/remote-proxy.js";

const options = remoteOptionsFromArgs() ?? remoteOptionsFromEnvironment();
if (!options) {
  console.error("computer-mcp is a host proxy. Configure --remote-target user@linux-vm or COMPUTER_MCP_SSH_TARGET.");
  process.exit(1);
}
await startRemoteProxy(options);
