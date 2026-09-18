# Computer-MCP Host Proxy

Host-side MCP stdio proxy for a Linux guest runtime. The host process may run on Windows or Linux; it forwards MCP traffic over OpenSSH to [`Computer-MCP-Backend`](https://github.com/leotruza/Computer-MCP-Backend), which executes GUI, shell/filesystem, Selenium, X11, and browser operations inside the Linux VM.

## Architecture

```text
Open WebUI / MCPO -> Computer-MCP on host -> SSH stdio -> Computer-MCP-Backend in Linux VM
```

The host repository intentionally contains no GUI, X11, shell, filesystem, or Selenium implementation. The guest implementation lives in the Backend repository. SSH is the supported transport, using the host's OpenSSH client and guest host-key authentication.

## Host installation

```bash
npm ci
npm run build
npm test
```

On Windows, use PowerShell and ensure OpenSSH client, Node.js 20+, and MCPO are installed. On Linux, use the distribution's OpenSSH client and Node.js 20+.

## Linux guest setup

Clone and build the Backend inside the VM:

```bash
git clone https://github.com/leotruza/Computer-MCP-Backend.git /opt/computer-mcp-backend
cd /opt/computer-mcp-backend
./scripts/setup-vm.sh
npm ci
npm run build
```

The guest must have a logged-in X11 session, the required GUI packages, Firefox, and an SSH server accepting the host's key. See the Backend README for package lists, VM preparation, Selenium, and validation.

## Running through SSH

PowerShell:

```powershell
$env:COMPUTER_MCP_SSH_TARGET = "vmuser@192.168.122.50"
$env:COMPUTER_MCP_SSH_PORT = "22"
$env:COMPUTER_MCP_SSH_IDENTITY = "C:\Users\me\.ssh\computer-vm"
$env:COMPUTER_MCP_REMOTE_COMMAND = "node /opt/computer-mcp-backend/dist/index.js"
mcpo --host 127.0.0.1 --port 8084 -- node C:\path\to\Computer-MCP\dist\index.js
```

Equivalent CLI configuration:

```powershell
mcpo --host 127.0.0.1 --port 8084 -- node C:\path\to\Computer-MCP\dist\index.js --remote-target vmuser@192.168.122.50 --remote-port 22 --remote-identity C:\Users\me\.ssh\computer-vm --remote-command "node /opt/computer-mcp-backend/dist/index.js"
```

Linux host:

```bash
node dist/index.js --remote-target vmuser@192.168.122.50 --remote-command 'node /opt/computer-mcp-backend/dist/index.js'
```

## Configuration

Environment variables:

- `COMPUTER_MCP_SSH_TARGET` — required in remote mode, for example `vmuser@192.168.122.50`.
- `COMPUTER_MCP_SSH_PORT` — optional SSH port.
- `COMPUTER_MCP_SSH_IDENTITY` — optional private key path.
- `COMPUTER_MCP_SSH_KNOWN_HOSTS` — optional dedicated known-hosts file.
- `COMPUTER_MCP_SSH_BIN` — optional OpenSSH executable path.
- `COMPUTER_MCP_REMOTE_COMMAND` — guest command; defaults to `node /opt/computer-mcp-backend/dist/index.js`.

CLI equivalents are `--remote-target`, `--remote-port`, `--remote-identity`, `--remote-known-hosts`, and `--remote-command`.

The host is only a transparent MCP stdio proxy. No tool execution, credentials, browser state, X11 access, or host filesystem access is provided by this repository. If SSH fails, the proxy forwards the failure through stderr and exits; verify the guest command directly with SSH.

## Testing and troubleshooting

```bash
npm run build
npm test
npm run lint
ssh vmuser@192.168.122.50 'node /opt/computer-mcp-backend/dist/index.js'
```

When MCPO reports `McpError: Connection closed`, verify the host build, SSH key, known-hosts configuration, guest path, guest Node.js installation, and the Backend build. Do not point the host proxy at a Windows Node.js process or expect WSL fallback.

## License

GPL-3.0-only. See [LICENSE](LICENSE). The guest runtime and its documentation are maintained in `Computer-MCP-Backend`.
