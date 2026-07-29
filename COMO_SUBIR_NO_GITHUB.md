# Verissimo — Como rodar o projeto e subir no seu GitHub

Você recebeu a pasta do projeto em um arquivo `.zip`. Este guia tem duas partes:

- **Parte A** — como rodar o projeto no seu computador, do zero.
- **Parte B** — como subir o projeto para o seu próprio GitHub.

---

# PARTE A — Rodando o projeto do zero

## A1. Extrair o zip

1. Descompacte o arquivo `verissimo.zip` em algum lugar do seu computador (ex: `Documentos\verissimo`).
2. Dentro da pasta você **não** vai encontrar as pastas `node_modules`, `.next`, `.vercel` — são pastas grandes e geradas automaticamente, você vai recriá-las no próximo passo. O arquivo `.env.local` (com a chave de API) **já vem incluso** no zip, prontinho pra uso.

## A2. Instalar o Node.js

O projeto usa Next.js, que precisa do Node.js instalado.

1. Baixe em https://nodejs.org (escolha a versão **LTS**).
2. Instale (próximo-próximo-próximo).
3. Confirme abrindo o terminal e digitando:
   ```
   node --version
   npm --version
   ```
   Deve mostrar os números de versão.

## A3. Instalar as dependências do projeto

1. Abra o terminal **dentro da pasta do projeto** (Explorador de Arquivos → clique direito dentro da pasta → "Abrir no Terminal").
2. Rode:
   ```
   npm install
   ```
   Isso recria a pasta `node_modules` (pode demorar alguns minutos).

## A4. Chave de API (arquivo `.env.local`)

O projeto usa a API do Gemini (Google) pra funcionar. A chave já vem configurada no arquivo `.env.local`, que está dentro da pasta do projeto — não precisa criar nem mexer em nada aqui.

Só um cuidado: **não compartilhe esse arquivo publicamente** (não poste print dele, não mande pra grupos, não suba pro GitHub — sobre isso, veja a Parte B).

## A5. Rodar o projeto em modo de desenvolvimento

Ainda no terminal, dentro da pasta do projeto:
```
npm run dev
```
Depois abra o navegador em **http://localhost:3000** — o site deve aparecer rodando.

Para parar, volte no terminal e aperte `Ctrl + C`.

## A6. Outros comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Roda o projeto em modo desenvolvimento (com atualização automática ao salvar) |
| `npm run build` | Gera a versão de produção (otimizada) |
| `npm run start` | Roda a versão de produção já buildada (rode `build` antes) |
| `npm run lint` | Verifica erros de estilo/qualidade no código |
| `npm run test` | Roda os testes automatizados |

---

# PARTE B — Subindo o projeto pro seu GitHub

Este guia assume que você já tem (ou vai criar) uma conta própria no GitHub, diferente da conta usada pelo Vinícius (System Hope).

## 1. Criar conta no GitHub (se ainda não tiver)

1. Acesse https://github.com/signup
2. Crie a conta com seu e-mail pessoal.
3. Confirme o e-mail quando o GitHub pedir.

## 2. Criar o repositório vazio

1. Logada na sua conta, clique no `+` no canto superior direito → **New repository**.
2. Preencha:
   - **Repository name**: `verissimo` (ou o nome que preferir)
   - **Visibility**: Private (recomendado, a menos que queira público)
3. **NÃO marque** nenhuma das opções "Add a README", "Add .gitignore" ou "Choose a license" — o repositório precisa ficar totalmente vazio.
4. Clique em **Create repository**.
5. Na próxima tela o GitHub mostra uma URL parecida com:
   ```
   https://github.com/SEU_USUARIO/verissimo.git
   ```
   Copie essa URL, vai usar no passo 4.

## 3. Instalar as ferramentas necessárias (se ainda não tiver)

- **Git**: https://git-scm.com/downloads (baixe e instale, próximo-próximo-próximo)
- Verifique se instalou certo abrindo o **Terminal** (ou "Git Bash") e digitando:
  ```
  git --version
  ```
  Deve mostrar algo como `git version 2.x.x`.

## 4. Configurar sua identidade no Git (só uma vez, por computador)

No terminal, rode (trocando pelos seus dados):
```
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```
Use o **mesmo e-mail** da sua conta do GitHub.

## 5. Subir o projeto

1. Abra o terminal **dentro da pasta do projeto** (`verissimo`). No Windows, você pode abrir a pasta no Explorador de Arquivos, clicar com botão direito dentro dela e escolher "Abrir no Terminal" ou "Git Bash Here".

2. Rode os comandos abaixo, um de cada vez:

```bash
git init
git add .
git commit -m "Primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/verissimo.git
git push -u origin main
```

> Troque `https://github.com/SEU_USUARIO/verissimo.git` pela URL que você copiou no passo 2.

3. Na hora do `git push`, o GitHub vai pedir login:
   - Vai abrir uma janela do navegador pedindo pra autorizar o Git — clique em **Authorize**.
   - Se pedir usuário/senha no terminal (método mais antigo), o GitHub **não aceita mais sua senha normal** — é preciso gerar um "Personal Access Token" e usar ele no lugar da senha:
     1. No GitHub: clique na sua foto → **Settings** → **Developer settings** (final da página) → **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
     2. Dê um nome, marque a opção **repo**, gere o token.
     3. Copie o token (só aparece uma vez!) e use ele no lugar da senha quando o terminal pedir.

4. Pronto! Atualize a página do repositório no navegador — os arquivos devem aparecer lá.

## 6. Para enviar atualizações futuras

Sempre que fizer mudanças no código, dentro da pasta do projeto:
```bash
git add .
git commit -m "Descrição do que mudou"
git push
```

## Observações importantes

- O arquivo `.env.local` (que guarda chaves/senhas do projeto) **não vai subir** para o GitHub — isso é proposital e correto, por segurança. Ele já está protegido pelo arquivo `.gitignore`.
- Se algo der errado no passo do `git push` (erro de autenticação, etc.), me chama o print do erro que te ajudo a resolver.
