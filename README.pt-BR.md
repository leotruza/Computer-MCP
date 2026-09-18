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

### Pacotes instalados pelo `setup-vm.sh`

O helper é implementado atualmente para Debian/Ubuntu e instala estes pacotes APT exatos, além das dependências:

| Capacidade | Pacotes instalados pelo script |
|---|---|
| Screenshot do desktop | `ffmpeg` |
| Mouse e teclado X11 | `xdotool` |
| Clipboard X11 | `xclip` |
| Descoberta de monitores | `x11-xserver-utils` (`xrandr`) |
| Checkout e diagnósticos | `git`, `curl` |
| Builds nativos e módulos Node | `build-essential` |
| Navegador | `firefox-esr` |
| Runtime JavaScript | `nodejs`, `npm` |

O script também executa `apt-get update`; ele não instala MCPO, Selenium separadamente, hipervisor, Docker nem ambiente desktop. O Node.js da distribuição pode ser mais antigo que a versão 20 exigida, portanto o script verifica a versão e falha explicitamente em vez de aceitar um runtime incompatível.

O próprio script termina quando `apt-get` não está disponível. Em outras distribuições, instale manualmente os equivalentes funcionais e depois execute `npm ci`, `npm run build`, `npm test` e `npm run lint` (ou use `scripts/test-vm.sh`):

| Distribuição | Comando equivalente | Observações |
|---|---|---|
| Fedora/RHEL-like | `sudo dnf install ffmpeg-free xdotool xclip xrandr git curl gcc gcc-c++ make firefox nodejs npm` | Suporte completo a codecs FFmpeg pode exigir o repositório multimídia aprovado pela distribuição; a disponibilidade varia entre Fedora e derivados RHEL. |
| Arch/Manjaro | `sudo pacman -S --needed ffmpeg xdotool xclip xorg-xrandr git curl base-devel firefox nodejs npm` | `base-devel` equivale às ferramentas de build. |
| openSUSE | `sudo zypper install ffmpeg xdotool xclip xrandr git curl gcc gcc-c++ make firefox nodejs npm` | Codecs podem depender dos repositórios openSUSE habilitados. |
| Alpine | `sudo apk add ffmpeg xdotool xclip xrandr git curl build-base firefox nodejs npm` | Alpine usa musl; confirme que navegador e Selenium Manager funcionam na imagem desktop escolhida. |

Nomes e repositórios podem mudar. Confirme cada pacote com o gerenciador da distribuição antes de instalar. Esses comandos instalam somente pacotes do convidado; não criam nem configuram a VM.

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

### Troubleshooting do MCPO

O comando depois de `--` deve ser o servidor compilado dentro do convidado Linux. Depois de baixar um novo commit, compile antes de iniciar o MCPO:

```bash
git pull --ff-only origin main
npm ci
npm run build
mcpo --host 127.0.0.1 --port 8084 -- node /caminho/absoluto/para/Computer-MCP/dist/index.js
```

Não aponte o MCPO para `C:\Program Files\nodejs\node.exe` nem para um checkout Windows. O servidor encerra explicitamente quando executado no Windows e não faz fallback para WSL. Se o MCPO reportar `McpError: Connection closed`, execute `node dist/index.js` diretamente na VM Linux, confirme que o build passou e examine stderr antes de tentar o MCPO novamente. Um `dist/index.js` ausente/desatualizado, plataforma host incompatível ou falha na inicialização do Node aparecem para o MCPO como uma conexão stdio fechada.

## Ferramentas MCP

### Controle do computador

`computer_screenshot`, `computer_screen_size`, `computer_environment`, `computer_move_mouse`, `computer_click`, `computer_mouse_down`, `computer_mouse_up`, `computer_scroll`, `computer_type`, `computer_key`, `computer_hotkey`, `computer_clipboard_get` e `computer_clipboard_set`.

As coordenadas usam origem `(0,0)` no canto superior esquerdo; x cresce para a direita e y para baixo. Screenshot e input usam o mesmo espaço de coordenadas X11. Screenshots são retornados como conteúdo de imagem MCP em memória, PNG ou JPEG.

### Shell e filesystem

`shell_exec`, `filesystem_read`, `filesystem_write`, `filesystem_list` e `filesystem_remove`. Operam dentro da VM e não fornecem acesso ao host. `shell_exec` executa como o usuário do servidor; operações root exigem uma conta VM apropriadamente autorizada, uma decisão explícita de configuração da VM.

### Selenium

`browser_start`, `browser_stop`, `browser_navigate`, `browser_page`, `browser_find`, `browser_click`, `browser_type`, `browser_key`, `browser_wait`, `browser_execute`, `browser_tabs`, `browser_switch_window`, `browser_switch_frame`, `browser_default_content`, `browser_cookies`, `browser_storage`, `browser_alert` e `browser_screenshot`.

`browser_start` inicia Firefox visível por padrão e aceita `headless`, `minimalProfile`, `profilePath` e `binaryPath`. Use headless quando não for necessária inspeção visual; headed continua sendo o padrão para continuidade com GUI. O perfil mínimo desativa telemetria, verificações de atualização, conexões especulativas, algumas atividades de background e animações, preservando JavaScript, cookies, WebAssembly, WebGL, rede e mecanismos de segurança. O Selenium Manager pode baixar um driver compatível no primeiro uso, portanto a VM precisa de rede ou de um driver previamente instalado. `profilePath` deve apontar somente para um perfil dedicado dentro da VM. Screenshots Selenium são do viewport; `computer_screenshot` captura o desktop inteiro.

### Benchmark de navegadores

A escolha do navegador é uma decisão de engenharia, não uma suposição. Execute a mesma carga Selenium contra candidatos Firefox instalados:

```bash
npm run benchmark:browsers
BROWSER_CANDIDATES=firefox,firefox-esr npm run benchmark:browsers -- --headless
```

Os candidatos usam `nome[:caminho-do-binário]`, por exemplo `BROWSER_CANDIDATES=firefox:/usr/bin/firefox,waterfox:/opt/waterfox/waterfox`. O benchmark informa tempo de inicialização, confiabilidade do WebDriver, RAM/CPU idle, RAM/CPU com uma página, duas abas, carga JavaScript e uma amostra de estabilidade de cinco segundos. Use as mesmas condições da VM para cada candidato. O script mede, mas não escolhe automaticamente o vencedor. Só escolha um fork se ele demonstrar menor uso prático mantendo compatibilidade moderna e Selenium; caso contrário, use a melhor opção Firefox/ESR medida.

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
