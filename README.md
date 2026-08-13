# educado-app

Aplicativo mobile da plataforma **Educado**, uma plataforma educacional voltada
para catadores de material reciclável no Brasil. O projeto é uma parceria entre
a **Universidade de Brasília (UnB)** e a **Aalborg University** (Dinamarca), sob
a organização [ErasmusEgalitarian](https://github.com/ErasmusEgalitarian).

Este repositório é o app do estudante: navegar o catálogo de cursos,
matricular-se, assistir às aulas em vídeo com atividades intercaladas (quiz,
leitura, associação de imagens), acompanhar progresso, ganhar pontos e badges,
ver o ranking, emitir certificado e **baixar o curso inteiro para uso offline**.

O backend é o `educado-api`, consumido via REST.

## Stack

Versões fixadas no `package.json`:

- **Expo SDK 56** (`expo ~56.0.12`), com New Architecture ligada
  (`newArchEnabled: true` no `app.config.ts`, obrigatório por causa do
  reanimated v4).
- **React Native** `0.85.3`, **React** `19.2.3`.
- **expo-router** `~56.2.11` (navegação file-based, `typedRoutes` ligado).
- **TypeScript** `~6.0.3` em modo `strict`. React Compiler habilitado.
- **@tanstack/react-query** `5.90.20` para data fetching e cache.
- **i18n-js** `^4.5.1` (pt-BR default, en fallback).
- **expo-video** (player), **expo-secure-store** (token JWT), **AsyncStorage**
  (dados locais), **expo-file-system** (downloads offline).
- **@microsoft/react-native-clarity** para analytics de sessão.

**Foco em Android.** Todos os perfis de build do EAS e a configuração nativa são
Android. O script `npm run ios` existe, mas não há perfil de build iOS.

## Pré-requisitos

- **Node.js 20+** e npm.
- **Java 17** (o `.sdkmanrc` fixa `17.0.16-tem`, via SDKMAN).
- **Android SDK**: Android Studio ou o Command Line Tools. São necessários
  build-tools, as platforms 35/36 e o NDK 27, além de um dispositivo físico com
  depuração USB ou um emulador AVD.
- Opcional: **Nix**. O `flake.nix` provê o Android SDK completo (build-tools,
  platforms, NDK, cmake, emulator, system images). Basta `nix develop` para
  entrar no devshell já configurado.

## Como rodar

```bash
git clone https://github.com/ErasmusEgalitarian/educado-app.git
cd educado-app
npm install
cp .env.example .env   # ajuste EXPO_PUBLIC_API_URL, ver abaixo
```

Dev server (Metro):

```bash
npm run start
```

Rodar no Android (build nativo + instalação no device/emulador):

```bash
npm run android
```

Outros scripts:

```bash
npm run web        # expo start --web
npm run lint       # eslint .
npm run lint:fix   # eslint . --fix
npx tsc --noEmit   # typecheck (não há script dedicado)
```

Não há suíte de testes automatizados neste repositório. Os checks obrigatórios
antes de abrir um PR são `npm run lint` e `npx tsc --noEmit`.

As pastas nativas `/android` e `/ios` são geradas por prebuild e não são
versionadas. O projeto roda via config plugins do Expo.

## Variáveis de ambiente

Só existe uma variável, e ela é obrigatória:

| Variável | Descrição |
| -------- | --------- |
| `EXPO_PUBLIC_API_URL` | URL base da `educado-api`. Sem ela o app lança erro logo no boot (`utils/api-config.ts`). |

Produção:

```env
EXPO_PUBLIC_API_URL=https://api-educado.tominho.com
```

Desenvolvimento local contra a API rodando na sua máquina:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5001     # emulador Android (localhost do host)
EXPO_PUBLIC_API_URL=http://192.168.x.y:5001  # device físico na mesma rede
```

O config plugin `plugins/withAndroidSecurity.js` libera tráfego cleartext apenas
para hosts de desenvolvimento (`10.0.2.2`, `localhost`, redes locais). Em
produção cleartext é bloqueado, então a API precisa ser HTTPS.

O `.env` não é versionado (está no `.gitignore`). Use o `.env.example` como
ponto de partida.

### Atenção: o endereço antigo da API está morto

Builds antigos do EAS e arquivos `.env` antigos apontam para
`https://igg084s4s08sk0w08gsc0cgk.tominho.com`. Aquele hostname era gerado
automaticamente pelo Coolify e **não existe mais**: hoje responde 503.

O endereço novo e estável é **`https://api-educado.tominho.com`**.

Consequência prática: **todo APK/AAB já publicado com o endereço antigo precisa
de rebuild no EAS** para voltar a funcionar. Variável `EXPO_PUBLIC_*` é embutida
no bundle em tempo de build, não é lida em runtime, então mudar o valor depois
não conserta um binário já distribuído. Antes de gerar um build novo, confirme a
variável no ambiente do EAS:

```bash
eas env:list
eas env:create --name EXPO_PUBLIC_API_URL --value https://api-educado.tominho.com
```

## Build com EAS

Perfis definidos em `eas.json` (todos Android):

| Perfil | Saída | Uso |
| ------ | ----- | --- |
| `development` | app-bundle, dev client | desenvolvimento com dev client |
| `preview` | app-bundle, distribuição interna | testes internos |
| `preview-apk` | apk, distribuição interna | instalação direta no device |
| `production` | app-bundle | Play Store |

Build na nuvem:

```bash
npm run eas:development
npm run eas:preview
npm run eas:production
```

Build local (`--local`, carrega o `.env` via `dotenv-cli`):

```bash
npm run eas:development-local
npm run eas:preview-local
npm run eas:production-local
```

Submit para a Play Store:

```bash
npm run eas:submit
```

`appVersionSource` é `remote` e todos os perfis usam `autoIncrement`, então o
versionCode é gerenciado pelo EAS.

## Modo offline

O app suporta consumo de curso sem rede, implementado em
`services/download-manager.ts`:

- O estudante baixa um **curso inteiro** a partir da tela de downloads
  (`app/(tabs)/downloads.tsx`), via `downloadCourse()`.
- O manager busca o detalhe do curso na API, guarda o JSON do curso em
  AsyncStorage (`@educado:offline-course:<courseId>`) e baixa cada mídia (vídeos
  e imagens) de `/media/<id>/stream` para
  `documentDirectory/downloads/<courseId>/` usando `expo-file-system`.
- Cada curso baixado tem um **manifesto** (`DownloadManifest`: id, título, data,
  status `downloading`/`complete`/`error`, lista de arquivos com URI local e
  total de seções) persistido sob a chave `@educado:downloads`.
- Os hooks de curso (`hooks/useCourses.ts`, `hooks/useDownloads.ts`) caem para a
  versão offline quando a API falha: o conteúdo é transformado para apontar para
  os arquivos locais em vez das URLs de streaming, então player e atividades
  funcionam sem rede.
- O progresso feito offline é guardado localmente
  (`utils/progress-storage.ts`) e sincronizado depois (`utils/progress-sync.ts`,
  `hooks/usePeriodicSync.ts`).

Isso é intencional e central para o público do projeto: catadores nem sempre têm
rede disponível ou franquia de dados sobrando.

## Internacionalização (i18n)

- Configuração em `i18n/config.ts` (i18n-js). Traduções em `locales/en.json` e
  `locales/pt-BR.json`.
- Locale default e fallback: **pt-BR**. Idioma alternativo: **en**.
- A escolha do usuário é persistida em AsyncStorage (`@educado:language`).
- **Nenhuma string de UI é hardcoded.** Todo texto visível vem de
  `t('chave.aninhada')`, importado de `@/i18n/config`. Ao adicionar texto novo,
  adicione a chave nos **dois** arquivos de locale (ambos têm hoje 267 linhas e
  devem permanecer em paridade).

## Estrutura de pastas

```
app/                  rotas (expo-router, file-based)
  (auth)/             login, register (fluxo não autenticado)
  (tabs)/             área autenticada: home, explore, ranking, certificates,
                      downloads, profile, courses/[courseId]
  (landing)/          landing
components/           UI por domínio (Auth, Course, Section, Certificate,
                      Explore, Home, Common, Providers)
contexts/             AuthContext, UserContext, LanguageContext
services/             api.ts (cliente REST), secure-storage.ts,
                      download-manager.ts
hooks/                hooks de domínio sobre react-query
utils/                utilitários puros (api-config, progress-storage,
                      progress-sync, formatters, device-id, ...)
i18n/                 config.ts (instância i18n-js + helper t())
locales/              en.json, pt-BR.json
constants/theme/      AppColors (primary teal #35A1B1)
types/                tipos compartilhados
data/                 tipos de domínio e dados mock
plugins/              config plugins Expo (withAndroidSecurity)
assets/               imagens e fontes
```

Imports usam o alias `@/`, mapeado para a raiz do projeto em `tsconfig.json`.

## Contribuindo

Leia o [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir um PR, e o
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Vulnerabilidade de segurança segue o
[SECURITY.md](SECURITY.md): não abra issue pública.

## Colaboradores

- Lucas Gabriel da Silva Antunes (UnB)
- Emil Lykke Grann
- Jakob Rossander Kristensen
- Mikkel Martinus Fahnoee
- Albert

## Licença

Apache License 2.0. Ver [LICENSE](LICENSE).

Copyright 2026 Educado Project (University of Brasilia and Aalborg University).
