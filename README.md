# Eleição Digital - Offline-First

Projeto acadêmico de Web App/PWA para simular uma eleição que continua operando quando a internet é desligada.

## Tecnologias
- HTML5, CSS3 e JavaScript Vanilla
- PWA / Web App Manifest
- Service Worker
- Cache API
- IndexedDB
- Background Sync
- Notifications API

## Como executar

Service Worker não funciona corretamente abrindo o `index.html` diretamente com `file://`.
Use um servidor local.

### Opção 1 - VS Code
Instale a extensão **Live Server**.
1. Abra esta pasta no VS Code.
2. Clique com o botão direito em `index.html`.
3. Escolha **Open with Live Server**.

### Opção 2 - Node.js
No terminal, dentro da pasta:
```bash
npx serve .
```
Depois abra o endereço mostrado pelo terminal.

## Demonstração obrigatória: "Desligue a Internet"
1. Abra o projeto pelo Live Server.
2. Navegue por Votar, Resultados, Notificações e Sobre.
3. No Chrome, pressione F12 > Network.
4. Marque **Offline**.
5. Atualize a página.
6. Mostre que a aplicação continua abrindo.
7. Faça um voto.
8. Abra Resultados e mostre que o voto foi mantido.
9. Volte para Online e mostre a atualização do estado de sincronização.

## Requisitos demonstrados
- Service Worker instalado e ativo.
- Cache inicial dos arquivos essenciais.
- Estratégia cache-first para permitir operação offline.
- IndexedDB para persistência dos votos.
- Background Sync para registrar evento de sincronização.
- Notifications API.
- Interface responsiva e instalável como PWA.

## Observação acadêmica
Esta é uma simulação. Não deve ser usada como sistema eleitoral real. A persistência é local e o projeto não possui servidor de apuração oficial.
