# Guia de Integração - PostgreSQL Function no N8N

## Estrutura do Fluxo

```
┌──────────────┐
│   Webhook    │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Supabase: Execute SQL                  │
│  get_customer_context()                 │
│  [1 query = 10 queries antigas]         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Code: Format Context                   │
│  [Formata dados para o prompt]          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  AI Agent: Orchestrator                 │
│  [Usa dados formatados no prompt]       │
└─────────────────────────────────────────┘
```

---

## PASSO 1: Nó Supabase (Execute SQL)

### Configuração:
- **Nome do nó**: `getCustomerContext`
- **Tipo**: Supabase
- **Operation**: Execute SQL
- **Credenciais**: Service Role Key

### Query SQL:
```sql
SELECT get_customer_context(
  '{{ $("webhook").item.json.body.data.key.remoteJid }}',
  'f53b8a68-5dfb-4d87-9aec-277a9e774104'::uuid
) as context;
```

### Resultado:
```
{{ $json.context }}
```

---

## PASSO 2: Nó Code (Formatar)

### Configuração:
- **Nome do nó**: `formatContext`
- **Tipo**: Code
- **Mode**: Run Once for All Items

### Código:
Copie TODO o conteúdo de: `n8n-format-context-for-prompt.js`

### Resultado:
Múltiplos campos formatados disponíveis em `{{ $json.xxx }}`

---

## PASSO 3: Usar no Prompt do AI Agent

### ANTES (com 10 nós):

```javascript
# INFORMAÇÕES DA EMPRESA

Nome: {{ $('getCompanyData').item.json.name }}
Sobre: {{ $('getCompanyData').item.json.about }}

# INFORMAÇÕES DO CLIENTE

Nome: {{ $('mergeData').item.json.name }}
Email: {{ $('mergeData').item.json.email }}

# HISTÓRICO DA CONVERSA

{{ $('getCustomerMessages').first().json.isNotEmpty() 
   ? JSON.stringify($('aggregateMessages').item.json.customerMessages, null, 2) 
   : 'Primeira interação' }}

# MEMÓRIAS

{{ $('getCustomerMemories').first().json.isNotEmpty() 
   ? JSON.stringify($('aggregateMemory').item.json.customerMemories, null, 2) 
   : 'Nenhuma memória registrada' }}
```

---

### DEPOIS (com 2 nós: SQL + Code):

```javascript
# INFORMAÇÕES DA EMPRESA

Nome: {{ $('formatContext').item.json.company.name }}
Sobre: {{ $('formatContext').item.json.company.about }}

# INFORMAÇÕES DO CLIENTE

Nome: {{ $('formatContext').item.json.customer.name }}
Email: {{ $('formatContext').item.json.customer.email }}
Idade: {{ $('formatContext').item.json.customer.age }} anos
Status: {{ $('formatContext').item.json.customerStatus }}

{{ $('formatContext').item.json.messageHistoryText }}

{{ $('formatContext').item.json.memoriesText }}

{{ $('formatContext').item.json.combinationsText }}
```

**Muito mais simples e legível!**

---

## DADOS DISPONÍVEIS NO PROMPT

Após o nó `formatContext`, você tem acesso a:

### 1. Textos Formatados (Prontos para usar)
```javascript
{{ $json.combinationsText }}      // Opções formatadas [1], [2], [3]...
{{ $json.messageHistoryText }}    // Histórico formatado com timestamps
{{ $json.memoriesText }}           // Memórias formatadas e numeradas
{{ $json.bufferMessages }}         // Última mensagem do cliente
```

### 2. Dados da Empresa
```javascript
{{ $json.company.name }}           // "The AI Salon"
{{ $json.company.about }}          // Descrição da empresa
```

### 3. Dados do Cliente
```javascript
{{ $json.customer.name }}          // "Daniel"
{{ $json.customer.email }}         // "danielbertini@gmail.com"
{{ $json.customer.birthdate }}     // "1976-09-25"
{{ $json.customer.age }}           // 48 (calculado automaticamente)
{{ $json.customerStatus }}         // "Cadastro completo" ou "Faltam campos: email"
{{ $json.missingFields }}          // ["email", "birthdate"] (array)
```

### 4. Arrays Formatados (Para loops)
```javascript
{{ $json.combinations }}           // Array de objetos { id, service_id, ... }
{{ $json.messageHistory }}         // Array de mensagens ordenadas
{{ $json.memories }}               // Array de memórias
```

### 5. Metadata (Debug e monitoramento)
```javascript
{{ $json.metadata.total_combinations }}  // 11
{{ $json.metadata.total_messages }}      // 20
{{ $json.metadata.customer_exists }}     // true
{{ $json.metadata.timestamp }}           // "2025-11-18T02:01:03.632058+00:00"
```

---

## EXEMPLO COMPLETO DE PROMPT

```markdown
# OBJETIVO

Você é Sofia, recepcionista da {{ $json.company.name }}.

{{ $json.company.about }}

---

# INFORMAÇÕES DO CLIENTE

Nome: {{ $json.customer.name }}
Email: {{ $json.customer.email }}
Idade: {{ $json.customer.age }} anos

Status do cadastro: {{ $json.customerStatus }}

{{ $json.messageHistoryText }}

{{ $json.memoriesText }}

---

# SERVIÇOS DISPONÍVEIS

{{ $json.combinationsText }}

---

# CONTEXTO ATUAL

- Total de opções disponíveis: {{ $json.metadata.total_combinations }}
- Histórico de mensagens: {{ $json.metadata.total_messages }}
- Data/Hora: {{ $json.metadata.timestamp }}
```

---

## COMPARAÇÃO: ANTES vs DEPOIS

### ANTES (10 queries):
| Item | Valor |
|------|-------|
| **Nós necessários** | 10 nós Supabase |
| **Queries executadas** | 10 queries |
| **Latência total** | ~2400ms |
| **Complexidade do prompt** | Alta (múltiplas referências) |
| **Manutenção** | Difícil (muitos pontos de falha) |

### DEPOIS (1 function + 1 code):
| Item | Valor |
|------|-------|
| **Nós necessários** | 1 Supabase + 1 Code |
| **Queries executadas** | 1 query |
| **Latência total** | ~400ms |
| **Complexidade do prompt** | Baixa (referências simples) |
| **Manutenção** | Fácil (2 pontos apenas) |

---

## TROUBLESHOOTING

### Erro: "context is undefined"
**Solução**: Verifique se o nó Supabase retornou dados. O resultado deve estar em `{{ $json.context }}`

### Erro: "Cannot read property 'name' of null"
**Solução**: Cliente não existe ainda. Use:
```javascript
{{ $json.customer ? $json.customer.name : 'Cliente novo' }}
```

### Combinações vazias
**Solução**: Verifique se existem relacionamentos na tabela `colaborator_x_services` e `colaborator_x_locations`

### Performance lenta
**Solução**: 
1. Verifique índices no banco (ver arquivo SQL da function)
2. Execute `EXPLAIN ANALYZE` na function
3. Limite de 100 items já está configurado

---

## PRÓXIMOS PASSOS

1. ✅ Executar SQL no Supabase Dashboard
2. ✅ Criar nó Supabase no N8N com a query
3. ✅ Criar nó Code com o formatador
4. ✅ Atualizar prompt do AI Agent
5. ✅ Testar com mensagem real
6. ✅ Verificar logs e performance

---

## OTIMIZAÇÕES FUTURAS

- [ ] Cache da function (TTL de 1 minuto)
- [ ] Paginação de mensagens (mais de 20)
- [ ] Compressão do JSON retornado
- [ ] Versões da function (v1, v2)
- [ ] Métricas de performance (APM)

---

**Performance esperada**: ~400ms (vs ~2400ms antes) = **83% mais rápido** 🚀

