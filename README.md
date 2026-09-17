# Computer-MCP

MCP server for a Linux VM development environment with three complementary layers: generic desktop control, shell/filesystem operations, and genuine Selenium WebDriver browser automation. The VM is created and configured manually by the user; this project does not provision a VM, manage a hypervisor, or access the host.

## Architecture

- **Computer control:** screenshots, mouse, keyboard, clipboard, display information, and arbitrary Linux GUI applications.
- **Shell/filesystem:** commands, files, packages, processes, services, builds, tests, and Docker inside the VM. The project does not impose an artificial filesystem sandbox inside the VM.
- **Selenium:** visible Firefox by default, with navigation, DOM queries, page text/source, element lookup, JavaScript, tabs/windows, cookies, and browser screenshots.

The layers operate against the same VM. A Selenium-launched visible browser is accessible to the GUI layer, but this project does not claim to attach Selenium to a browser process that it did not start. Use Selenium for ordinary web operations and GUI tools for native dialogs, canvas-like controls, browser permission dialogs, and other desktop applications.

## Requirements

- Linux guest with a logged-in graphical **X11** session. Wayland is detected but not bypassed by the current GUI implementation.
- Node.js 20 or newer and npm.
- `ffmpeg`, `xdotool`, `xclip`, `xrandr`, Git, curl, and build tools.
- Firefox installed inside the VM (`firefox-esr` on Debian/Ubuntu is suitable). Chromium is supported where installed and compatible with Selenium Manager.
- MCPO installed separately when an HTTP/OpenAPI bridge is needed.

On Debian/Ubuntu:

```bash
sudo apt update
sudo apt install ffmpeg xdotool xclip x11-xserver-utils git curl build-essential nodejs npm firefox-esr
```

The distribution's Node.js package may be older than 20. Install a supported Node.js release by an approved method if needed.

## Manual VM setup and validation

Create and isolate the VM manually, install a Linux desktop, log into X11 as a dedicated user, and keep the display session active. Do not mount host filesystems, expose the host Docker socket, copy host credentials, or use the host browser profile. Confirm `DISPLAY` is set and `xrandr --query` lists a monitor. Run the server as the same desktop user; do not use `sudo` to bypass X11 authorization.

The Debian/Ubuntu preparation helper installs guest packages and validates the project without creating or modifying the VM:

```bash
chmod +x scripts/setup-vm.sh
./scripts/setup-vm.sh
```

The non-destructive validator checks the actual X11 display, FFmpeg capture, required commands, build, tests, and MCP discovery. It does not move the mouse, click, type, or change the clipboard:

```bash
./scripts/test-vm.sh
./scripts/test-vm.sh --quick
```

A `READY` result verifies technical prerequisites, not the full manual GUI/browser workflow. MCPO is reported as a warning when absent because it is installed separately.

## Installation and use

```bash
npm ci
npm run build
npm test
npm run lint
npm start
```

The server uses MCP over stdio. It does not create a custom HTTP API.

## MCPO and Open WebUI

MCPO launches this stdio server and exposes generated OpenAPI-compatible routes:

```bash
mcpo --host 127.0.0.1 --port 8084 -- node /absolute/path/to/Computer-MCP/dist/index.js
```

Inspect `http://127.0.0.1:8084/docs`, then configure that external OpenAPI tool server in Open WebUI. Keep MCPO bound to loopback unless a separately authenticated network design is required.

## MCP tools

### Computer control

`computer_screenshot`, `computer_screen_size`, `computer_environment`, `computer_move_mouse`, `computer_click`, `computer_mouse_down`, `computer_mouse_up`, `computer_scroll`, `computer_type`, `computer_key`, `computer_hotkey`, `computer_clipboard_get`, and `computer_clipboard_set`.

Coordinates use origin `(0,0)` at the top-left; x increases right and y increases down. Screenshot and input coordinates use the same X11 desktop coordinate space. Screenshots are returned as in-memory MCP image content in PNG or JPEG.

### Shell and filesystem

`shell_exec`, `filesystem_read`, `filesystem_write`, `filesystem_list`, and `filesystem_remove`. These operate inside the VM and intentionally do not provide host access. `shell_exec` runs as the server user; root-level operations require running the server under an appropriately authorized VM account, which should be a deliberate VM configuration decision.

### Selenium

`browser_start`, `browser_stop`, `browser_navigate`, `browser_page`, `browser_find`, `browser_execute`, `browser_tabs`, `browser_switch_window`, `browser_cookies`, and `browser_screenshot`.

`browser_start` defaults to visible Firefox. Selenium Manager may download a compatible driver at first use, so the VM needs network access or a preinstalled driver. `profilePath` may point to a dedicated profile inside the VM; never point it at a host profile. A browser started by this server is not headless by default. Selenium screenshots are browser viewport screenshots; `computer_screenshot` captures the whole desktop.

The Selenium and GUI layers are complementary: Selenium can inspect DOM state and page content, while GUI tools can operate native dialogs and the visible desktop. Generic GUI tools are intentionally not duplicated as browser-specific click/type tools.

## Browser state and security

Browser profiles, cookies, downloads, storage, cache, and authentication state remain inside the VM. Use a dedicated profile and do not reuse host browser directories. The VM is the isolation boundary. The project does not implement host filesystem access, host command execution, host process control, host SSH-key access, host credentials, host browser profiles, host Docker sockets, hypervisor management, or VM escape mechanisms. Docker may be installed and used inside the VM; never expose the host Docker socket.

## Testing

```bash
npm run build
npm test
npm run lint
./scripts/test-vm.sh
```

Manual integration should verify: X11 startup, MCPO launch and discovery, desktop screenshot/dimensions, mouse/keyboard/clipboard, terminal and Firefox GUI use, Selenium visible Firefox startup, navigation, element lookup, page text, forms, tabs/windows, cookies, browser screenshot, switching to GUI interaction with the visible browser, native dialogs, shell commands, builds, and clean shutdown. Selenium and GUI session continuity is only claimed for browsers launched by this server and must be tested in the target VM.

## Dependencies and license

Runtime dependencies are the MCP TypeScript SDK, Zod, and Selenium WebDriver. Linux facilities are invoked directly. Selenium WebDriver is genuine Selenium, not a wrapper around Playwright or Puppeteer. The project is GPL-3.0-only; see [LICENSE](LICENSE). Review third-party package licenses before redistribution.

## AI-generated code disclaimer

This project was generated entirely with the assistance of artificial intelligence. The source code, documentation, tests, configuration, and other project materials were produced by AI and may contain errors, security vulnerabilities, incorrect assumptions, or other defects.

This project is intended for development, testing, research, and experimentation. Review, test, and audit the project before using it in security-sensitive or production environments. This disclaimer does not replace the GPL-3.0-only license or applicable third-party licenses.

## Limitations

The GUI layer currently targets X11. Wayland compositor security may prevent direct capture and input. Selenium browser startup and driver resolution depend on the installed browser, Selenium Manager, and VM network configuration. Existing browser-process attachment is not implemented or claimed. The project is not a VM security audit.
