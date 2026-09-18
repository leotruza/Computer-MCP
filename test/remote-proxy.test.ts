// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { remoteOptionsFromArgs } from "../src/platform/remote-proxy.js";

test("remote proxy parses explicit CLI configuration", () => {
  assert.deepEqual(remoteOptionsFromArgs([
    "--remote-target", "vmuser@192.168.122.50",
    "--remote-port", "2222",
    "--remote-identity", "/tmp/vm-key",
    "--remote-known-hosts", "/tmp/known-hosts",
    "--remote-command", "node /opt/computer-mcp/dist/index.js",
  ]), {
    target: "vmuser@192.168.122.50",
    port: "2222",
    identityFile: "/tmp/vm-key",
    knownHostsFile: "/tmp/known-hosts",
    command: "node /opt/computer-mcp/dist/index.js",
  });
});

test("remote proxy is disabled without a target", () => {
  assert.equal(remoteOptionsFromArgs([]), null);
});
