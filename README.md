
# Script Windows CMD (.bat) que cria automaticamente toda a estrutura de diretórios e arquivos do projeto estoque-inteligente, conforme sua arquitetura.

1. Script criar-projeto.bat
Crie um arquivo chamado criar-projeto.bat e adicione o conteúdo:



@echo off
chcp 65001 > nul
setlocal

echo.
echo ==========================================
echo       ESTOQUE INTELIGENTE
echo       Criando estrutura do projeto
echo ==========================================
echo.

set "PROJECT=estoque-inteligente"

:: Criar diretorio principal
mkdir "%PROJECT%" 2>nul

:: BACKEND
mkdir "%PROJECT%\backend\src\config" 2>nul
mkdir "%PROJECT%\backend\src\repositories" 2>nul
mkdir "%PROJECT%\backend\src\services" 2>nul
mkdir "%PROJECT%\backend\src\routes" 2>nul
mkdir "%PROJECT%\backend\src\utils" 2>nul
mkdir "%PROJECT%\backend\scripts" 2>nul

:: FRONTEND
mkdir "%PROJECT%\frontend\css" 2>nul
mkdir "%PROJECT%\frontend\js" 2>nul
mkdir "%PROJECT%\frontend\assets\img" 2>nul

:: DOCUMENTACAO
mkdir "%PROJECT%\docs" 2>nul

:: BACKEND - ARQUIVOS
type nul > "%PROJECT%\backend\src\app.js"

type nul > "%PROJECT%\backend\src\config\database.js"
type nul > "%PROJECT%\backend\src\config\sqlserver.js"
type nul > "%PROJECT%\backend\src\config\mysql.js"
type nul > "%PROJECT%\backend\src\config\mongodb.js"

type nul > "%PROJECT%\backend\src\repositories\estoque.repository.js"
type nul > "%PROJECT%\backend\src\repositories\produto.repository.js"

type nul > "%PROJECT%\backend\src\services\estoque.service.js"
type nul > "%PROJECT%\backend\src\services\backup.service.js"
type nul > "%PROJECT%\backend\src\services\migracao.service.js"

type nul > "%PROJECT%\backend\src\routes\estoque.routes.js"
type nul > "%PROJECT%\backend\src\routes\produto.routes.js"
type nul > "%PROJECT%\backend\src\routes\index.js"

type nul > "%PROJECT%\backend\src\utils\crypto.js"
type nul > "%PROJECT%\backend\src\utils\logger.js"
type nul > "%PROJECT%\backend\src\utils\nosql-emulator.js"

:: SCRIPTS SQL
type nul > "%PROJECT%\backend\scripts\sqlserver.sql"
type nul > "%PROJECT%\backend\scripts\mysql.sql"

:: CONFIGURACOES
type nul > "%PROJECT%\backend\.env.example"
type nul > "%PROJECT%\backend\package.json"

:: FRONTEND
type nul > "%PROJECT%\frontend\index.html"
type nul > "%PROJECT%\frontend\css\style.css"
type nul > "%PROJECT%\frontend\js\api.js"
type nul > "%PROJECT%\frontend\js\app.js"

:: DOCUMENTACAO
type nul > "%PROJECT%\docs\AULAS.md"
type nul > "%PROJECT%\README.md"

echo.
echo ==========================================
echo Projeto criado com sucesso!
echo ==========================================
echo.
echo Diretorio: %PROJECT%
echo.

tree "%PROJECT%" /F

echo.
pause



2. Como executar
1. Abra o Bloco de Notas.
2. Cole o script acima.
3. Salve como criar-projeto.bat.
4. Execute com duplo clique ou pelo CMD:

3. Estrutura criada
Além da estrutura original, incluí arquivos iniciais para facilitar a implementação:
- SQL Server: configuração e script DDL.
- MySQL: configuração e script DDL.
- MongoDB: configuração de conexão.
- Repositories: abstração da persistência.
- Services: regras de negócio, backup e migração.
- Utils: criptografia, logger e emulador NoSQL.
- Frontend: HTML, CSS e JavaScript separados.


backend/
├── src/
│   ├── config/
│   │   ├── database.js          ✅ NOVO
│   │   ├── sqlserver.js
│   │   ├── mysql.js
│   │   └── mongodb.js
│   ├── repositories/
│   │   ├── produto.repository.js
│   │   ├── estoque.repository.js  ✅ NOVO
│   │   └── impl/
│   │       ├── mongodb.produto.js
│   │       ├── mongodb.estoque.js  ✅ NOVO
│   │       ├── mysql.produto.js
│   │       ├── mysql.estoque.js    ✅ NOVO
│   │       ├── sqlserver.produto.js
│   │       └── sqlserver.estoque.js ✅ NOVO
│   ├── services/
│   │   ├── estoque.service.js     ✅ NOVO
│   │   ├── backup.service.js
│   │   └── migracao.service.js
│   ├── routes/
│   │   ├── index.js               ✅ NOVO
│   │   ├── produtos.routes.js
│   │   ├── estoque.routes.js      ✅ NOVO
│   │   └── nosql.routes.js
│   ├── utils/
│   │   ├── logger.js              ✅ NOVO
│   │   ├── crypto.js
│   │   └── nosql-emulators.js
│   └── app.js                     ✅ ATUALIZADO
├── scripts/
│   ├── sqlserver.sql              ✅ ATUALIZADO
│   └── mysql.sql                  ✅ ATUALIZADO
├── logs/                          ✅ NOVO (criado automaticamente)
├── backups/
├── .env.example
└── package.json




# 1. Execute os scripts SQL nos respectivos bancos
# SQL Server: SSMS ou Azure Data Studio → abrir sqlserver.sql → executar
# MySQL: MySQL Workbench ou CLI → abrir mysql.sql → executar

# 2. Configure o .env com suas connection strings

# 3. Inicie o servidor
cd backend
npm install
npm run dev

# 4. Teste
curl http://localhost:3000/api/health
curl http://localhost:3000/api






🚀 Próximos Passos (Você escolhe o que quer fazer agora):
Opção 1: Popular o banco com dados reais (Recomendado)
Rode o script de seed para encher o sistema de produtos, categorias e movimentações de exemplo. Assim o dashboard fica bonito e cheio de dados para você mostrar:
bash:
   npm run seed


Opção 2: Testar as funcionalidades das Aulas 11 a 16
Podemos testar juntos:
Salvar um par Chave-Valor e ler de volta.
Criar um nó no Grafo e achar o caminho.
Fazer uma migração do MySQL para o MongoDB e ver o campo _migratedFrom aparecer.
Gerar um backup e ver o arquivo .json na pasta backups/.

Opção 3: Criar o README.md profissional para o GitHub
Posso gerar um arquivo README.md completo, com badges, instruções de instalação, prints (espaços reservados) e explicação de como o projeto atende às Aulas 10-18, perfeito para entregar ao professor.
Opção 4: Resolver o SQL Server
Quando você tiver um tempinho, podemos ativar o TCP/IP no SQL Server Configuration Manager e fazê-lo conectar também.
Me diga qual opção você quer seguir agora, ou se quer apenas explorar o sistema no navegador (http://localhost:3000) e testar as abas! Estou à disposição. 🏆
