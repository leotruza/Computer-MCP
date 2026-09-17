# Computer-MCP

Servidor MCP para um ambiente de desenvolvimento em VM Linux com três camadas complementares: controle genérico da área de trabalho, operações de shell/filesystem e automação real de navegador com Selenium WebDriver. A VM é criada e configurada manualmente pelo usuário; o projeto não provisiona VM, gerencia hipervisor nem acessa o host.

## Arquitetura

- **Controle do computador:** screenshots, mouse, teclado, clipboard, informações de tela e aplicações GUI Linux arbitrárias.
- **Shell/filesystem:** comandos, arquivos, pacotes, processos, serviços, builds, testes e Docker dentro da VM. O projeto não impõe sandbox artificial ao filesystem da VM.
- **Selenium:** Firefox visível por padrão, com navegação, consultas DOM, texto/source da página, busca de elementos, JavaScript, abas/janelas, cookies e screenshots do navegador.

As camadas operam na mesma VM. Um navegador visível iniciado pelo Selenium fica acessível à camada GUI, mas o projeto não afirma conseguir anexar o Selenium a um processo de navegador que ele não iniciou. Use Selenium para operações web comuns e GUI para diálogos nativos, controles visuais complexos, permissões do navegador e outras aplicações desktop.

## Requisitos

- VM Linux com sessão gráfica **X11** efetivamente iniciada. Wayland é detectado, mas não é contornado pela implementação GUI atual.
- Node.js 20 ou superior e npm.
- `ffmpeg`, `xdotool`, `xclip`, `xrandr`, Git, curl e ferramentas de compilação.
- Firefox instalado dentro da VM (`firefox-esr` no Debian/Ubuntu é adequado). Chromium é suportado quando instalado e compatível com o Selenium Manager.
- MCPO instalado separadamente quando for necessária a ponte HTTP/OpenAPI.

No Debian/Ubuntu:

```bash
sudo apt update
sudo apt install ffmpeg xdotool xclip x11-xserver-utils git curl build-essential nodejs npm firefox-esr
```

O pacote Node.js da distribuição pode ser mais antigo que a versão 20. Instale uma versão compatível por um método aprovado quando necessário.

## Configuração manual e validação da VM

Crie e isole a VM manualmente, instale um desktop Linux, entre em uma sessão X11 com um usuário dedicado e mantenha a sessão ativa. Não monte filesystems do host, exponha o Docker socket do host, copie credenciais do host nem use o perfil de navegador do host. Confirme `DISPLAY` e que `xrandr --query` lista um monitor. Execute o servidor como o mesmo usuário desktop; não use `sudo` para contornar a autorização X11.

O helper para Debian/Ubuntu instala pacotes do convidado e valida o projeto sem criar ou modificar a VM:

```bash
chmod +x scripts/setup-vm.sh
./scripts/setup-vm.sh
```

O validador não destrutivo verifica display X11 real, captura FFmpeg, comandos necessários, build, testes e descoberta MCP. Ele não move o mouse, clica, digita nem altera o clipboard:

```bash
./scripts/test-vm.sh
./scripts/test-vm.sh --quick
```

Um resultado `READY` confirma pré-requisitos técnicos, não o fluxo GUI/browser manual completo. A ausência de MCPO é apenas um aviso porque ele é instalado separadamente.

## Instalação e uso

```bash
npm ci
npm run build
npm test
npm run lint
npm start
```

O servidor usa MCP sobre stdio e não cria uma API HTTP própria.

## MCPO e Open WebUI

O MCPO inicia este servidor stdio e expõe rotas OpenAPI compatíveis:

```bash
mcpo --host 127.0.0.1 --port 8084 -- node /caminho/absoluto/para/Computer-MCP/dist/index.js
```

Abra `http://127.0.0.1:8084/docs` e configure esse servidor OpenAPI externo no Open WebUI. Mantenha o MCPO em loopback, salvo se houver uma configuração de rede autenticada separada.

## Ferramentas MCP

### Controle do computador

`computer_screenshot`, `computer_screen_size`, `computer_environment`, `computer_move_mouse`, `computer_click`, `computer_mouse_down`, `computer_mouse_up`, `computer_scroll`, `computer_type`, `computer_key`, `computer_hotkey`, `computer_clipboard_get` e `computer_clipboard_set`.

As coordenadas usam origem `(0,0)` no canto superior esquerdo; x cresce para a direita e y para baixo. Screenshot e input usam o mesmo espaço de coordenadas X11. Screenshots são retornados como conteúdo de imagem MCP em memória, PNG ou JPEG.

### Shell e filesystem

`shell_exec`, `filesystem_read`, `filesystem_write`, `filesystem_list` e `filesystem_remove`. Operam dentro da VM e não fornecem acesso ao host. `shell_exec` executa como o usuário do servidor; operações root exigem uma conta VM apropriadamente autorizada, uma decisão explícita de configuração da VM.

### Selenium

`browser_start`, `browser_stop`, `browser_navigate`, `browser_page`, `browser_find`, `browser_execute`, `browser_tabs`, `browser_switch_window`, `browser_cookies` e `browser_screenshot`.

`browser_start` inicia Firefox visível por padrão. O Selenium Manager pode baixar um driver compatível no primeiro uso, portanto a VM precisa de rede ou de um driver instalado previamente. `profilePath` pode apontar para um perfil dedicado dentro da VM; nunca use um perfil do host. O navegador não é headless por padrão. Screenshots Selenium são do viewport; `computer_screenshot` captura o desktop inteiro.

As camadas Selenium e GUI são complementares: Selenium inspeciona DOM e conteúdo, enquanto GUI opera diálogos nativos e a área de trabalho visível. Ferramentas genéricas de clique/digitação não são duplicadas como ferramentas browser-specific.

## Estado do navegador e segurança

Perfis, cookies, downloads, storage, cache e autenticação permanecem dentro da VM. Use um perfil dedicado e não reutilize diretórios de navegador do host. A VM é a fronteira de isolamento. O projeto não implementa filesystem do host, comandos no host, controle de processos do host, chaves SSH do host, credenciais do host, perfis do host, Docker socket do host, gerenciamento de hipervisor ou escape da VM. Docker pode ser instalado e usado dentro da VM; nunca exponha o socket do host.

## Testes

```bash
npm run build
npm test
npm run lint
./scripts/test-vm.sh
```

A integração manual deve verificar: X11, MCPO e descoberta, screenshot/dimensões, mouse/teclado/clipboard, terminal e Firefox GUI, inicialização do Firefox visível pelo Selenium, navegação, busca de elementos, texto, formulários, abas/janelas, cookies, screenshot browser, troca para GUI no navegador visível, diálogos nativos, shell, builds e shutdown limpo. A continuidade Selenium/GUI só é afirmada para navegadores iniciados por este servidor e deve ser testada na VM-alvo.

## Dependências, licença e aviso de IA

As dependências de runtime são MCP TypeScript SDK, Zod e Selenium WebDriver. As facilidades Linux são chamadas diretamente. Selenium WebDriver é Selenium real, não um wrapper de Playwright ou Puppeteer. O projeto usa GPL-3.0-only; veja [LICENSE](LICENSE).

Este projeto foi gerado inteiramente com auxílio de inteligência artificial. Código, documentação, testes, configuração e demais materiais podem conter erros, vulnerabilidades, suposições incorretas ou outros defeitos. O projeto é destinado a desenvolvimento, testes, pesquisa e experimentação. Revise, teste e audite antes de usar em ambientes sensíveis ou de produção. Este aviso não substitui a GPL-3.0-only nem licenças de terceiros.

## Limitações

A camada GUI atualmente tem como alvo X11. A segurança do compositor Wayland pode impedir captura e input diretos. A inicialização do navegador e a resolução do driver dependem do navegador instalado, Selenium Manager e rede da VM. Anexar a um processo de navegador existente não é implementado nem afirmado. O projeto não é uma auditoria de segurança da VM.
