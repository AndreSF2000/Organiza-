# Organiza+ - App de Organização e Produtividade

Um aplicativo web completo para organização pessoal, produtividade e gerenciamento da vida diária com design inspirado no iOS.

## 🚀 Funcionalidades

### 📅 Calendário e Eventos
- Visualização mensal do calendário
- Criação e gerenciamento de eventos
- Notificações de lembretes
- Visualização de compromissos diários

### ✅ Gerenciamento de Tarefas
- Criação de tarefas com prioridades
- Filtros por status (todas, pendentes, concluídas)
- Data de vencimento
- Marcação de conclusão

### 💊 Saúde e Bem-estar
- Cadastro de medicamentos
- Controle de horários de medicação
- Agendamento de consultas médicas
- Monitoramento de sinais vitais (em desenvolvimento)

### 📝 Notas Pessoais
- Criação e edição de notas
- Organização visual em grid
- Busca e categorização
- Sincronização em tempo real

### 🎯 Controle de Hábitos
- Criação de hábitos personalizados
- Acompanhamento de streaks
- Visualização de progresso semanal
- Diferentes frequências (diário, semanal, mensal)

### 🔔 Sistema de Notificações
- Notificações web nativas
- Lembretes de eventos e medicamentos
- Suporte a PWA (Progressive Web App)
- Funcionamento offline

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Design**: iOS-inspired UI/UX
- **PWA**: Service Workers, Web App Manifest
- **Notificações**: Web Notifications API

## 📱 Instalação e Configuração

### 1. Pré-requisitos
- Node.js 16+ instalado
- Conta no Supabase

### 2. Instalação

```bash
# Clone o projeto
git clone <url-do-repositorio>
cd lifecare-app

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# Execute o SQL no Supabase
# Copie e execute o conteúdo de supabase-schema.sql no SQL Editor do Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

### 3. Comandos Disponíveis

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start

# Build (se necessário)
npm run build
```

### 4. Acesso

Abra seu navegador em: `http://localhost:3000`

## 🎨 Design e UX

O Organiza+ foi desenvolvido com inspiração no design do iOS, oferecendo:

- **Interface limpa e minimalista**
- **Cores suaves e harmoniosas**
- **Animações fluidas**
- **Navegação intuitiva**
- **Responsividade completa**
- **Modo escuro (planejado)**

## 📊 Estrutura do Banco de Dados

O projeto utiliza as seguintes tabelas no Supabase:

- `users` - Dados dos usuários (gerenciado pelo Supabase Auth)
- `events` - Eventos e compromissos do calendário
- `tasks` - Tarefas e atividades
- `medications` - Medicamentos e horários
- `appointments` - Consultas médicas
- `notes` - Notas pessoais
- `habits` - Hábitos e rotinas
- `habit_logs` - Registro de progresso dos hábitos

## 🔒 Segurança

- Autenticação segura via Supabase
- Row Level Security (RLS) habilitado
- Dados isolados por usuário
- Validação de entrada de dados
- Proteção contra XSS e CSRF
- Headers de segurança com Helmet.js

## 📁 Estrutura do Projeto

```
organiza-plus-app/
├── public/           # Arquivos estáticos
│   ├── index.html   # Página principal
│   ├── styles.css   # Estilos CSS
│   ├── app.js       # JavaScript principal
│   ├── manifest.json # PWA manifest
│   └── sw.js        # Service Worker
├── server.js        # Servidor Express
├── package.json     # Dependências Node.js
├── .env            # Variáveis de ambiente
└── supabase-schema.sql # Schema do banco
```

## 🚀 Deploy

### Vercel
```bash
npm install -g vercel
vercel
```

### Heroku
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Railway
```bash
railway login
railway init
railway up
```

## 🚀 Funcionalidades Futuras

- [ ] Modo escuro
- [ ] Sincronização com calendários externos
- [ ] Relatórios e estatísticas
- [ ] Backup e exportação de dados
- [ ] Integração com wearables
- [ ] Compartilhamento de hábitos
- [ ] Gamificação e conquistas
- [ ] Suporte a múltiplos idiomas
- [ ] API REST completa
- [ ] Testes automatizados

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato através dos issues do projeto.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**Organiza+** - Organize sua vida com simplicidade e estilo 💙"# Organiza-" 
