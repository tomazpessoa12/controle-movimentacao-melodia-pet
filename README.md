# Controle de Transferência de Paletes — Protótipo

Protótipo web para testar o fluxo entre Produção e Logística.

## Acessos

- Produção: `http://localhost:7000/producao`
- Logística: `http://localhost:7000/logistica`
- Administração: `http://localhost:7000/admin`

Produção e Logística não usam login. A área administrativa usa a senha definida pela variável privada `ADMIN_PASSWORD` no servidor.

## Executar

É necessário Node.js 18 ou superior. No diretório do projeto, execute:

```bash
npm start
```

Para acessar por celular ou tablet na mesma rede, abra `http://IP-DO-SERVIDOR:7000/producao` ou `http://IP-DO-SERVIDOR:7000/logistica`.

## Formato do QR Code

Enquanto o layout do Sankhya não estiver pronto, use este texto para testar a leitura manual:

```text
IDENTIFICADOR_UNICO|PRODUTO|NUMERO_OP|QUANTIDADE
```

Exemplo:

```text
10123-030926-11:57:30-000381|M1x Seed Papagaio|1001|500
```

O QR final da capa deve conter a mesma estrutura. O identificador precisa ser único, por exemplo: `CODPROD-DDMMAA-HH:MI:SS-SEQUENCIA`.

Na tela de Produção e na de Recebimento, use o botão **Ler QR Code** para testar com a webcam. Autorize o navegador a usar a câmera. O campo manual fica disponível apenas como contingência.

## Aviso Discord

No link Administração, informe o webhook do canal de logística, selecione os dias da semana e defina o horário no formato 24h. Clique em **Enviar teste** para validar o webhook.

## Observação para implantação

Este protótipo usa um arquivo `data.json` como base de dados, adequado para validar a rotina. Para a implantação definitiva, é recomendável substituir esse arquivo por banco de dados com backup automático e acesso HTTPS.

## Implantação com Git e Docker

Entregue a pasta `pallet-transfer-prototype` ao TI para ser colocada em um repositório Git. No servidor, ele deve:

1. Clonar o repositório.
2. Criar um arquivo `.env` a partir de `.env.example` e definir a senha administrativa.
3. Executar `docker compose up -d --build` na pasta do projeto.
4. Configurar o acesso externo para as rotas `/producao`, `/logistica` e `/admin`.

Os dados do controle ficarão na pasta `data` ao lado do projeto, preservados quando o contêiner for atualizado. Essa pasta deve entrar na rotina de backup do servidor.
