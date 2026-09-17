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

Node.js 20+, graphical X11 session, and `ffmpeg`, `xdotool`, `xclip`, and `xrandr`. On Debian-like systems: `sudo apt install ffmpeg xdotool xclip x11-xserver-utils`. Wayland is detected but not bypassed; use an X11 session for the implemented capabilities.

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
> This project was generated entirely with the assistance of artificial intelligence. The code, documentation, tests, configuration, and other project materials were produced by AI and may contain errors, security vulnerabilities, incorrect assumptions, or other defects.
>
> This project is provided for development, testing, research, and experimentation. Review, test, and audit the code before using it in security-sensitive or production environments.
>
> The AI-generation disclaimer does not replace the terms of the GPL-3.0 license or any applicable third-party licenses.

> ## Aviso sobre código gerado por IA
>
> Este projeto foi gerado inteiramente com auxílio de inteligência artificial. O código, a documentação, os testes, a configuração e os demais materiais podem conter erros, vulnerabilidades, suposições incorretas ou outros defeitos. Revise, teste e audite o projeto antes de usá-lo em ambientes sensíveis ou de produção. Este aviso não substitui a GPL-3.0 nem licenças de terceiros aplicáveis.
