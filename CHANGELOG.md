# Changelog

Todas as alterações relevantes do Controle de Movimentação Melodia Pet são registradas neste arquivo.

## v1.1.6 — 21/09/2026

### Melhorias

- Admin passa a ter manifesto PWA próprio, com nome e instalação independentes.

### Correções de bugs

- Aplicativo instalado a partir de `/admin` passa a abrir diretamente no Admin, sem redirecionar para Produção.

## v1.1.5 — 18/09/2026

### Melhorias

- Melhor organização visual da tela de acesso administrativo e da área de Configurações.

### Correções de bugs

- Checkbox **Manter conectado neste dispositivo** alinhado corretamente ao texto.
- Separação visual adicionada entre os botões **Entrar** e **Mostrar senha**.

## v1.1.4 — 18/09/2026

### Melhorias

- Opção **Manter conectado neste dispositivo** no acesso administrativo.
- Botão **Sair** no cabeçalho do Admin.

### Correções de bugs

- Cores corrigidas para abas ativas e inativas do Admin.
- Botões **Aplicar**, **Gerar PDF** e **Baixar CSV** receberam as cores definidas.

## v1.1.3 — 18/09/2026

### Melhorias

- Paletas finais: Admin `#E2752A`, Produção `#001A38` e Logística `#FCB539`.
- Abas inativas do Admin possuem tons próprios por área, mantendo a cor forte apenas na aba ativa.
- Avulsos pendentes podem ser adicionados ou retirados do recebimento em andamento pela aba **Avulsos** do Admin.

### Correções de bugs

- Botões do relatório voltam a ter dois níveis visuais de destaque.
- Fundo dos recebimentos no Admin foi suavizado e o espaçamento após o filtro mensal foi ampliado.

## v1.1.2 — 18/09/2026

### Melhorias

- Paletas refinadas: Admin `#E2752A`, Produção `#FFE242` e Logística `#FCB539`.
- Abas ativas ganham a cor forte da área; abas inativas permanecem discretas.
- Botões **Aplicar**, **Gerar PDF** e **Baixar CSV** retomam distinção visual dentro da paleta do Admin.

### Correções de bugs

- A tela do Admin permanece identificada como **ADMIN**, inclusive nas abas operacionais.
- Fundos dos recebimentos receberam tom mais suave para melhorar a leitura.
- Changelog administrativo passa a mostrar corretamente as três versões mais recentes.

## v1.1.1 — 18/09/2026

### Melhorias

- Identidade visual monocromática própria para Admin, Produção e Logística.
- Áreas operacionais dentro do Admin adotam a identidade de Produção ou Logística.

### Correções de bugs

- Cabeçalho simplificado, sem a linha visual abaixo dele.

## v1.1.0 — 18/09/2026

### Melhorias

- Observação opcional em cada recebimento, disponível no relatório e PDF.
- Instalações independentes para Produção e Logística, cada uma abrindo sua própria área.
- Diferenciação visual das áreas por cor e identificação no cabeçalho.

### Correções de bugs

- Instalação iniciada pela Logística não abre mais a tela da Produção.

## v1.0.1 — 10/09/2026

### Melhorias

- Sistema configurado como aplicativo instalável (PWA) em dispositivos compatíveis.
- Ícone, abertura em janela própria e suporte ao menu **Instalar app** do navegador.
- Backup local das configurações, incluindo o webhook do Discord, junto aos dados operacionais.

### Correções de bugs

- Sem correções nesta versão.

## v1.0.0 — 10/09/2026

### Melhorias

- Registro e recebimento de paletes por QR Code, com suporte a leitura manual no Admin.
- Fluxo de unidades avulsas, incluindo retirada e devolução parcial ao palete de origem.
- Resumos de pendências por paletes, avulsos e produto nas áreas de Produção e Logística.
- Leitor de QR Code com moldura de centralização, troca de câmera, foco contínuo e zoom quando disponíveis no aparelho.
- Relatório mensal com filtro, CSV, impressão em PDF e detalhamento cronológico de cada recebimento.
- PDF em retrato com logo, totalizadores, assinatura e identificação de data/hora de geração e versão do sistema.
- Configurações centralizadas para Discord e linhas de produto, com cores editáveis, campo hexadecimal e cor padrão.
- Changelog acessível na área administrativa e neste repositório.

### Correções de bugs

- As cores configuradas das linhas de produto agora são aplicadas também nas telas de Produção e Logística.
- A ação **Aplicar** no relatório atualiza os dados mesmo quando o mesmo mês já está selecionado.
- Controles do leitor de QR Code permanecem visíveis em telas menores.
