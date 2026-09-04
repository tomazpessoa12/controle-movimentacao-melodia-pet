# Controle de Movimentação Melodia Pet

Aplicação web desenvolvida para digitalizar o controle de transferência de produtos acabados entre a fábrica e o galpão de armazenagem da Melodia Pet.

## O desafio

O acompanhamento das movimentações era feito em papel: para cada palete pronto, a equipe anotava produto, número da ordem de produção (OP), quantidade e as confirmações de saída e recebimento. Além de consumir tempo, esse processo dificultava a consulta do saldo pendente, a consolidação mensal e a comunicação diária com a logística.

O objetivo do projeto foi substituir esse controle manual por uma rotina simples de usar no celular ou tablet, sem exigir digitação no processo operacional.

## A solução

Cada capa de produção passa a receber um QR Code com as informações do palete:

```text
IDENTIFICADOR_UNICO|PRODUTO|NUMERO_OP|QUANTIDADE
```

Exemplo:

```text
10123-030926-11:57:30-000381|M1x Seed Papagaio|1001|500
```

Com a leitura do QR Code, o sistema registra automaticamente o palete como pronto para transferência. O identificador combina código do produto, data/hora e sequência para evitar duplicidades.

## Fluxos operacionais

### Produção

- Registra paletes prontos por leitura de QR Code;
- Mantém a lista de paletes pendentes até a transferência real;
- Permite cancelar um palete pendente, exigindo o motivo;
- Permite retirar unidades avulsas de um palete para adiantamentos, reduzindo o saldo do palete original.

### Logística

- Adiciona os paletes recebidos por leitura de QR Code;
- Inclui unidades avulsas disponíveis no mesmo recebimento;
- Agrupa vários paletes e/ou avulsos em uma única confirmação;
- Exige assinatura digital antes de habilitar a confirmação do recebimento;
- Permite corrigir inclusões acidentais antes da confirmação.

### Administração

- Centraliza todas as funções de Produção e Logística, inclusive entradas manuais como contingência;
- Exibe relatório mensal de movimentações com totalizadores;
- Diferencia visualmente recebimentos de paletes e de unidades avulsas;
- Mostra a assinatura, data/hora e os itens que compõem cada recebimento;
- Configura o webhook, dias e horário do resumo automático enviado ao Discord.

## Comunicação com a logística

O sistema consolida os paletes pendentes e pode enviar um resumo automático ao canal de logística no Discord, por exemplo:

```text
5 paletes
1.000 unidades de M1x Seed Papagaio
500 unidades de M1x Seed Periquito
```

O envio é configurável por dia da semana e horário, permitindo adaptar a rotina ao encerramento diário da fábrica.

## Decisões de projeto

- **Sem login na operação:** Produção e Logística usam links diretos para reduzir burocracia. A validação do destino é registrada pela assinatura digital.
- **QR Code em vez de digitação:** reduz erros e torna o registro rápido no chão de fábrica.
- **Recebimento em lote:** reflete a operação real, na qual vários paletes são transportados e recebidos juntos.
- **Dados persistentes separados da aplicação:** permite atualizar o sistema sem perder os registros operacionais.
- **Interface responsiva:** pensada para uso em celular, tablet e computador na rede interna.

## Tecnologias utilizadas

- Node.js, utilizando apenas recursos nativos para o servidor HTTP e APIs;
- HTML, CSS e JavaScript puro no front-end;
- Leitura de QR Code pela câmera do dispositivo, quando suportada pelo navegador;
- Docker e Docker Compose para padronizar a execução no servidor;
- Webhook do Discord para a comunicação automática com a logística.

## Próximos passos possíveis

O projeto foi estruturado para validar a rotina operacional. Em uma evolução futura, o armazenamento local pode ser migrado para um banco de dados relacional, com backup automatizado e maior suporte a acessos simultâneos.
