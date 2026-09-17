# Computer-MCP

MCP stdio server for controlling a Linux desktop through screenshots, mouse, keyboard, and clipboard. It treats Firefox, Chromium, terminals, office applications, dialogs, and other programs as ordinary GUI applications. **Browser control is screenshot + coordinates + keyboard only**; this project does not use Playwright, Puppeteer, Selenium, WebDriver, CDP, DOM APIs, extensions, or browser endpoints.

## Descrição / Description

O servidor roda **dentro da VM Linux configurada manualmente pelo usuário**. Ele não cria, provisiona, virtualiza nem modifica a VM e não abre um listener HTTP próprio. A interface primária é MCP sobre stdio; o [MCPO](https://github.com/open-webui/mcpo) pode fornecer a ponte OpenAPI/HTTP para o Open WebUI.

The server runs **inside a manually configured Linux VM**. It does not create, provision, virtualize, or modify the VM and does not open its own HTTP listener. MCP over stdio is the primary interface; MCPO provides the OpenAPI/HTTP bridge for Open WebUI.

## Status de suporte / Support status

| Área | Estado |
|---|---|
| X11 screenshot/input/clipboard | Implemented; requires `DISPLAY`, `ffmpeg`, `xdotool`, `xclip`, and `xrandr` |
| Wayland | Detected and reported; no compositor bypass is attempted |
| Browser automation | GUI-only by design |
| Multiple monitors | Parsed from `xrandr` when available |
| HTTP API | Not implemented; use MCPO |

## Requisitos / Requirements

Node.js 20+, a logged-in graphical **X11** session, and `ffmpeg`, `xdotool`, `xclip`, `xrandr`, Git, and curl are required. On Debian-like systems: `sudo apt install ffmpeg xdotool xclip x11-xserver-utils git curl build-essential`. MCPO is a separate requirement for the HTTP/OpenAPI bridge and is not installed by this project. Wayland is detected but not bypassed; use an X11 session for the implemented capabilities.

## Configuração manual da VM / Manual VM setup

O projeto não cria nem configura a VM. Execute os passos abaixo dentro da VM, usando uma distribuição Linux com ambiente gráfico e um usuário dedicado à sessão. Os nomes das telas variam entre VirtualBox, KVM/QEMU, VMware e Hyper-V, mas os requisitos dentro do convidado são os mesmos.

1. **Crie uma VM isolada**, instale uma distribuição Linux com desktop (por exemplo, Debian ou Ubuntu Desktop), crie um usuário para a sessão gráfica, mantenha o sistema atualizado e faça um snapshot antes de testes destrutivos.
2. **Escolha uma sessão X11** na tela de login, como “GNOME on Xorg”, “Ubuntu on Xorg” ou uma sessão Xfce/X11. Esta implementação não contorna as políticas de Wayland. A variável `DISPLAY` deve apontar para o servidor X da mesma sessão e do mesmo usuário que executará o MCP.
3. **Instale as ferramentas dentro da VM**:

   ```bash
   sudo apt update
   sudo apt install ffmpeg xdotool xclip x11-xserver-utils curl git build-essential
   ```

   Em outras distribuições, instale os equivalentes de `ffmpeg`, `xdotool`, `xclip` e `xrandr`. Em Debian/Ubuntu, `x11-xserver-utils` fornece `xrandr`.
4. **Instale Node.js 20 ou superior** por um método aprovado pela distribuição ou pelo administrador. Confirme que a sessão gráfica está acessível:

   ```bash
   node --version
   npm --version
   echo "$DISPLAY"
   echo "${WAYLAND_DISPLAY:-unset}"
   xrandr --query
   ```

   `DISPLAY` deve estar definido, `xrandr --query` deve listar ao menos um monitor e `WAYLAND_DISPLAY` deve estar vazio para o caminho X11. O terminal não deve ser apenas uma sessão SSH sem encaminhamento X11. Não execute o processo com `sudo` para contornar autenticação X11; use o mesmo usuário da sessão e confirme que a tela da VM permanece desbloqueada e ativa.
5. **Copie o projeto para a VM** por Git ou por um artefato revisado. Não monte o filesystem do host, não compartilhe diretórios pessoais, não exponha o socket Docker do host e não copie credenciais ou chaves SSH do host:

   ```bash
   git clone https://github.com/leotruza/Computer-MCP.git
   cd Computer-MCP
   npm ci
   npm run build
   npm test
   ```
6. **Execute pela integração MCPO**, evitando instâncias duplicadas:

   ```bash
   mcpo --host 127.0.0.1 --port 8084 -- node "$PWD/dist/index.js"
   ```

   Se MCPO for executado por um serviço separado, configure explicitamente o usuário da sessão, `DISPLAY` e a autorização X11. Mantenha MCPO em `127.0.0.1` quando não houver necessidade de acesso remoto.
7. **Valide a VM** primeiro com `computer_environment`, depois `computer_screen_size` e `computer_screenshot`. Confirme visualmente que a imagem corresponde à tela da VM. Só depois teste mouse, teclado, clipboard, terminal e aplicações. O teste do Firefox deve usar exclusivamente screenshot, coordenadas e teclado.

This project does not create or configure the VM. Inside the VM, install a Linux desktop, select an X11 session, install `ffmpeg`, `xdotool`, `xclip`, and `xrandr`, install Node.js 20+, clone the project, run `npm ci`, `npm run build`, and verify `DISPLAY`, `xrandr --query`, `computer_environment`, `computer_screen_size`, and `computer_screenshot`. Use the same desktop user for the X11 session and the MCP process. Avoid host filesystem mounts, host credentials, Docker sockets, and broad network exposure. Prefer NAT or another restricted VM network mode and keep MCPO bound to loopback.

### Script de preparação / Setup script

Depois de clonar o projeto dentro de uma VM Debian/Ubuntu já existente e iniciar uma sessão gráfica X11, o script pode automatizar a instalação dos pacotes do convidado e a validação do projeto:

```bash
cd Computer-MCP
chmod +x scripts/setup-vm.sh
./scripts/setup-vm.sh
```

O script usa `sudo` somente para `apt-get`, executa como o usuário da sessão gráfica e não cria, provisiona, virtualiza nem altera a VM ou o host. Ele instala `ffmpeg`, `xdotool`, `xclip`, `xrandr`, Git, curl, ferramentas de compilação e, por padrão, `nodejs`/`npm`; depois exige Node.js 20 ou superior, executa `npm ci`, build, testes e lint, e imprime o comando MCPO. Como a versão de Node fornecida pelo repositório da distribuição pode ser antiga, instale Node.js 20+ por um método aprovado antes de executar o script ou use `--skip-node`; o script falhará explicitamente se a versão permanecer abaixo de 20. Para apenas verificar o ambiente, use `./scripts/setup-vm.sh --check-only`. Use `--skip-build` para instalar somente os pré-requisitos. O script é específico para Debian/Ubuntu; em outra distribuição, instale os pacotes equivalentes manualmente.

### Validação da VM / VM validation

Para testar a configuração sem instalar pacotes, mover o mouse, clicar, digitar ou alterar o clipboard, execute:

```bash
./scripts/test-vm.sh
```

O validador verifica Linux, usuário não-root, `DISPLAY`, ausência de `WAYLAND_DISPLAY`, Node.js 20+, ferramentas Linux, acesso ao monitor via `xrandr`, captura X11 real com FFmpeg, build, testes e descoberta das ferramentas MCP. `MCPO` ausente gera um aviso, pois é instalado separadamente. `./scripts/test-vm.sh --quick` pula build, testes e descoberta. O resultado **READY** significa que os pré-requisitos técnicos foram verificados; ainda é necessário iniciar o MCPO e fazer os testes funcionais de screenshot, mouse, teclado e clipboard.

## Instalação / Installation

```bash
npm install
npm run build
npm start
```

## MCPO e Open WebUI / MCPO and Open WebUI

MCPO runs this stdio MCP server and exposes generated OpenAPI-compatible HTTP routes. The current documented command form is:

```bash
mcpo --host 127.0.0.1 --port 8084 -- node /absolute/path/to/Computer-MCP/dist/index.js
```

Inspect `http://127.0.0.1:8084/docs`, then add the resulting external OpenAPI tool-server URL in Open WebUI. MCPO, not this project, owns the HTTP layer.

## Ferramentas MCP / MCP tools

`computer_screenshot`, `computer_screen_size`, `computer_environment`, `computer_move_mouse`, `computer_click`, `computer_mouse_down`, `computer_mouse_up`, `computer_scroll`, `computer_type`, `computer_key`, `computer_hotkey`, `computer_clipboard_get`, and `computer_clipboard_set`.

Coordinates use origin `(0,0)` at the top-left; x increases right and y increases down. Use coordinates from the most recent screenshot. Screenshots are returned as MCP image content in PNG or JPEG, in memory, with optional scaling and JPEG quality. No permanent screenshot files are created.

## Browser-only GUI procedure / Procedimento GUI para navegador

Take a screenshot, visually identify a control, click its coordinates, type with `computer_type`, press keys with `computer_key`, and take another screenshot. No DOM, accessibility tree, JavaScript injection, browser protocol, or extension is used. Downloads and ordinary applications are likewise operated through GUI actions.

## Timing, errors, and security / Temporização, erros e segurança

Mouse duration, click interval, typing interval, and screenshot scaling are configurable per call. Errors identify the detected environment, required capability, and suggested action. Hotkey modifiers are released in a `finally` cleanup path. SIGINT, SIGTERM, uncaught exceptions, and unhandled rejections trigger shutdown handling.

The VM is the intended sandbox. Normal GUI actions inside it are intentionally permitted. The project does not implement host filesystem mounts, host command execution, hypervisor control, VM escape functionality, host credential extraction, host SSH-key access, host Docker-socket access, or host process control. Bind MCPO to loopback unless a separate authenticated network design is required.

## Testing / Testes

```bash
npm run build
npm test
npm run lint
```

Manual integration: start X11, launch through MCPO, discover tools, capture a screenshot, query dimensions, move/click/type/key/hotkey/scroll, read/write clipboard, open a terminal and Firefox, navigate and interact using only screenshots/mouse/keyboard, download and open a file, close applications, and verify errors when `DISPLAY` is unavailable. Do not use Playwright, Selenium, Puppeteer, CDP, WebDriver, or DOM inspection.

## Limitations / Limitações

X11 access is subject to session permissions. Wayland compositor policies may block direct capture and input. `xdotool` scrolling uses standard X11 wheel buttons; horizontal scrolling depends on the environment. This repository is not a VM security audit.

## Development, licensing / Desenvolvimento, licença

Source is in `src/`; output is in `dist/`. Runtime dependencies are the official MCP TypeScript SDK and Zod; Linux facilities are invoked directly. Run `npm run lint` before submitting changes. Licensed GPL-3.0-only; see [LICENSE](LICENSE) and [man/computer-mcp.1](man/computer-mcp.1).

> ## AI-Generated Code Disclaimer
>
> This project was generated entirely by artificial intelligence. The code, documentation, tests, configuration, and other project materials were produced by AI and may contain errors, security vulnerabilities, incorrect assumptions, or other defects.
>
> This project is provided for development, testing, research, and experimentation. Review, test, and audit the code before using it in security-sensitive or production environments.
>
> The AI-generation disclaimer does not replace the terms of the GPL-3.0 license or any applicable third-party licenses.

> ## Aviso sobre código gerado por IA
>
> Este projeto foi gerado inteiramente por inteligência artificial. O código, a documentação, os testes, a configuração e os demais materiais podem conter erros, vulnerabilidades, suposições incorretas ou outros defeitos. Revise, teste e audite o projeto antes de usá-lo em ambientes sensíveis ou de produção. Este aviso não substitui a GPL-3.0 nem licenças de terceiros aplicáveis.
