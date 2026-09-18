# Computer-MCP Host Proxy

Proxy MCP stdio executado no host. O processo pode rodar no Windows ou Linux e encaminha o tráfego MCP por OpenSSH para o [`Computer-MCP-Backend`](https://github.com/leotruza/Computer-MCP-Backend), que executa GUI, shell/filesystem, Selenium, X11 e navegador dentro da VM Linux.

## Arquitetura

```text
Open WebUI / MCPO -> Computer-MCP no host -> SSH stdio -> Computer-MCP-Backend na VM Linux
```

Este repositório não contém implementação de GUI, X11, shell, filesystem ou Selenium. O runtime guest está no repositório Backend. SSH é o transporte suportado.

## Instalação no host

```bash
npm ci
npm run build
npm test
```

No Windows, use PowerShell com OpenSSH Client, Node.js 20+ e MCPO instalados. No Linux, use o cliente OpenSSH da distribuição e Node.js 20+.

## Configuração da VM Linux

Clone e compile o Backend dentro da VM:

```bash
git clone https://github.com/leotruza/Computer-MCP-Backend.git /opt/computer-mcp-backend
cd /opt/computer-mcp-backend
./scripts/setup-vm.sh
npm ci
npm run build
```

A VM precisa ter sessão X11 ativa, pacotes GUI, Firefox e servidor SSH aceitando a chave do host. Consulte o README do Backend para pacotes, preparação, Selenium e validação.

## Execução via SSH

```powershell
$env:COMPUTER_MCP_SSH_TARGET = "vmuser@192.168.122.50"
$env:COMPUTER_MCP_SSH_PORT = "22"
$env:COMPUTER_MCP_SSH_IDENTITY = "C:\Users\me\.ssh\computer-vm"
$env:COMPUTER_MCP_REMOTE_COMMAND = "node /opt/computer-mcp-backend/dist/index.js"
mcpo --host 127.0.0.1 --port 8084 -- node C:\path\to\Computer-MCP\dist\index.js
```

Ou diretamente por argumentos:

```powershell
mcpo --host 127.0.0.1 --port 8084 -- node C:\path\to\Computer-MCP\dist\index.js --remote-target vmuser@192.168.122.50 --remote-port 22 --remote-identity C:\Users\me\.ssh\computer-vm --remote-command "node /opt/computer-mcp-backend/dist/index.js"
```

Em host Linux:

```bash
node dist/index.js --remote-target vmuser@192.168.122.50 --remote-command 'node /opt/computer-mcp-backend/dist/index.js'
```

## Configuração

Variáveis: `COMPUTER_MCP_SSH_TARGET`, `COMPUTER_MCP_SSH_PORT`, `COMPUTER_MCP_SSH_IDENTITY`, `COMPUTER_MCP_SSH_KNOWN_HOSTS`, `COMPUTER_MCP_SSH_BIN` e `COMPUTER_MCP_REMOTE_COMMAND`. Os argumentos equivalentes são `--remote-target`, `--remote-port`, `--remote-identity`, `--remote-known-hosts` e `--remote-command`.

O host é somente um proxy transparente do MCP stdio. Não executa ferramentas, não acessa X11, não guarda estado do navegador e não fornece acesso ao filesystem do host. Se o MCPO reportar `McpError: Connection closed`, verifique chave SSH, known-hosts, caminho no guest, Node.js e build do Backend.

## Licença

GPL-3.0-only. O runtime guest e sua documentação são mantidos em `Computer-MCP-Backend`.
