# Agendamentos no Contexto Pré-carregado

## O QUE FOI ADICIONADO

Agora a function `get_customer_context()` também retorna **todos os agendamentos do cliente** (últimos 30 dias).

---

## MUDANÇAS NOS ARQUIVOS

### 1. SQL Function (`01-create-function-customer-context.sql`)

Adicionada seção que busca eventos:

```sql
-- 10. CUSTOMER EVENTS (agendamentos do cliente)
'events', (
  SELECT json_agg(...)
  FROM events e
  LEFT JOIN company_services s ON e.service_id = s.id
  LEFT JOIN colaborators col ON e.colaborator_id = col.id
  LEFT JOIN company_locations loc ON e.location_id = loc.id
  WHERE e.customer_id = v_customer_id
    AND e.company_id = p_company_id
    AND e.event_date >= NOW() - INTERVAL '30 days'
  LIMIT 50
)
```

**Características:**
- ✅ Busca eventos dos últimos 30 dias (passados e futuros)
- ✅ Ordena por data (mais próximo primeiro)
- ✅ Faz JOIN com services, colaborators e locations
- ✅ Retorna até 50 agendamentos
- ✅ Retorna `[]` se cliente não tiver agendamentos

### 2. JavaScript Formatador (`n8n-format-context-for-prompt.js`)

Adicionada formatação de eventos:

```javascript
// Formata cada evento
const formattedEvents = context.events.map((event, index) => {
  return {
    id: event.id,
    index: index + 1,  // [1], [2], [3]...
    service_name: event.service_name,
    colaborator_name: event.colaborator_name,
    location_name: event.location_name,
    date: "Segunda-feira, 18 de novembro de 2025",
    time: "10:00",
    datetime: event.event_date
  };
});

// Gera texto formatado
let eventsText = '# AGENDAMENTOS DO CLIENTE\n\n';
formattedEvents.forEach(event => {
  eventsText += `[${event.index}] ${event.service_name} com ${event.colaborator_name}\n`;
  eventsText += `    Data: ${event.date}\n`;
  eventsText += `    Horário: ${event.time}\n`;
  eventsText += `    Local: ${event.location_name}\n`;
  eventsText += `    event_id: ${event.id}\n\n`;
});
```

### 3. Prompt do Agente (`agent-v6-preloaded-optimized.md`)

Adicionada seção de agendamentos no contexto:

```markdown
{{ $('formatContext').item.json.eventsText }}
```

---

## DADOS DISPONÍVEIS NO PROMPT

### **Texto formatado (RECOMENDADO):**

```javascript
{{ $json.eventsText }}
```

**Output:**
```
# AGENDAMENTOS DO CLIENTE

[1] Manicure com Katia Fonseca
    Data: Sexta-feira, 21 de novembro de 2025
    Horário: 17:00
    Local: Unidade Santana
    event_id: abc-123-def-456

[2] Barbearia com Roger Lemos
    Data: Terça-feira, 18 de novembro de 2025
    Horário: 08:00
    Local: Unidade Santana
    event_id: xyz-789-ghi-012
```

### **Array de objetos (para manipulação):**

```javascript
{{ JSON.stringify($json.events, null, 2) }}
```

**Output:**
```json
[
  {
    "id": "abc-123-def-456",
    "index": 1,
    "service_id": "4d22a723-e82c-45ae-8a28-e06f90f201a5",
    "service_name": "Manicure",
    "colaborator_id": "945656e7-a58e-405b-b52c-8a08e5acebce",
    "colaborator_name": "Katia Fonseca",
    "location_id": "74f0f10b-0946-4a38-b9e0-bdf1a867cdce",
    "location_name": "Unidade Santana",
    "location_address": "Rua Aviador Gil Guilherme, 116...",
    "date": "Sexta-feira, 21 de novembro de 2025",
    "time": "17:00",
    "datetime": "2025-11-21T17:00:00",
    "title": "Daniel",
    "description": "..."
  }
]
```

### **Metadata:**

```javascript
{{ $json.metadata.total_events }}  // 2
```

---

## COMO USAR NO PROMPT

### **Exemplo 1: Listar agendamentos**

```markdown
# AGENDAMENTOS DO CLIENTE

{{ $json.eventsText }}

---

Quando o cliente pedir para ver seus agendamentos, mostre essa lista.
Para reagendar, use o event_id da opção escolhida.
```

### **Exemplo 2: Verificar se tem agendamentos**

```markdown
O cliente tem {{ $json.metadata.total_events }} agendamento(s).

{{ $json.metadata.total_events > 0 ? $json.eventsText : 'Nenhum agendamento encontrado.' }}
```

### **Exemplo 3: Reagendamento**

```markdown
## Reagendamento

1. Mostre a lista de agendamentos com números [1], [2], [3]...
2. Cliente escolhe o número
3. Use o event_id correspondente para chamar calendar.updateEvent()

Exemplo:
Cliente escolhe [1] → use event_id: {{ $json.events[0].id }}
```

---

## FLUXOS COMUNS

### **1. Cliente quer ver agendamentos:**

```
Cliente: "Quais são meus agendamentos?"

Agente:
{{ $json.eventsText }}

(Automaticamente mostra lista formatada)
```

### **2. Cliente quer reagendar:**

```
Cliente: "Preciso reagendar"

Agente: "Você tem X agendamentos:"
{{ $json.eventsText }}

Cliente: "O número 1"

Agente: [Chama calendar com event_id: {{ $json.events[0].id }}]
```

### **3. Cliente quer cancelar:**

```
Cliente: "Quero cancelar meu agendamento"

Agente: "Qual você gostaria de cancelar?"
{{ $json.eventsText }}

Cliente: "O da manicure"

Agente: [Chama calendar.removeEvent(event_id)]
```

---

## CAMPOS DO EVENTO

Cada evento tem:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `id` | UUID do evento | "abc-123-def-456" |
| `index` | Número na lista [1], [2]... | 1 |
| `service_id` | UUID do serviço | "4d22a723-..." |
| `service_name` | Nome do serviço | "Manicure" |
| `colaborator_id` | UUID do colaborador | "945656e7-..." |
| `colaborator_name` | Nome do profissional | "Katia Fonseca" |
| `location_id` | UUID da unidade | "74f0f10b-..." |
| `location_name` | Nome da unidade | "Unidade Santana" |
| `location_address` | Endereço completo | "Rua Aviador..." |
| `date` | Data formatada | "Sexta-feira, 21 de nov..." |
| `time` | Horário formatado | "17:00" |
| `datetime` | ISO 8601 | "2025-11-21T17:00:00" |
| `title` | Título do evento | "Daniel" |
| `description` | Descrição | "Cliente prefere manhã" |

---

## ATUALIZAR A FUNCTION NO SUPABASE

Para aplicar essa mudança, execute novamente o SQL no Supabase Dashboard:

1. Abra **Supabase Dashboard** → **SQL Editor**
2. Cole TODO o conteúdo do arquivo `01-create-function-customer-context.sql`
3. Clique em **Run**
4. ✅ A function será recriada com suporte a eventos

A function usa `CREATE OR REPLACE`, então não vai quebrar nada existente.

---

## PERFORMANCE

**Impacto na performance:**
- ✅ 1 JOIN adicional (events → services, colaborators, locations)
- ✅ Limite de 50 eventos (muito rápido)
- ✅ Filtro por índice (customer_id, company_id, event_date)
- ✅ Adiciona ~50-100ms na query total

**Estimativa:**
- Antes: ~400ms
- Depois: ~450-500ms
- Ainda **5x mais rápido** que o método antigo (2400ms)

---

## ÍNDICES RECOMENDADOS (Opcional)

Para performance máxima, adicione esses índices:

```sql
-- Índice para buscar eventos do cliente
CREATE INDEX IF NOT EXISTS idx_events_customer_date 
ON events(customer_id, company_id, event_date DESC);

-- Índice para JOINs
CREATE INDEX IF NOT EXISTS idx_events_service 
ON events(service_id);

CREATE INDEX IF NOT EXISTS idx_events_colaborator 
ON events(colaborator_id);

CREATE INDEX IF NOT EXISTS idx_events_location 
ON events(location_id);
```

---

## EXEMPLO COMPLETO NO PROMPT

```markdown
# CONTEXTO

## Informações do Cliente

Nome: {{ $json.customer.name }}
Email: {{ $json.customer.email }}
Status: {{ $json.customerStatus }}

{{ $json.messageHistoryText }}

{{ $json.memoriesText }}

{{ $json.eventsText }}

---

# INSTRUÇÕES

Quando cliente pedir para:
- **Ver agendamentos**: Mostre a lista acima
- **Reagendar**: Use os números [1], [2] da lista e o event_id
- **Cancelar**: Confirme qual da lista e use event_id
- **Criar novo**: Use as opções disponíveis abaixo

{{ $json.combinationsText }}
```

---

## BENEFÍCIOS

✅ **Agente já sabe** quais agendamentos o cliente tem  
✅ **Não precisa chamar** tool para buscar eventos  
✅ **Reagendamento mais rápido** (já tem os IDs)  
✅ **Cancelamento mais rápido** (já tem os IDs)  
✅ **Contexto completo** em uma única query  

---

## PRÓXIMOS PASSOS

1. ✅ Executar SQL atualizado no Supabase
2. ✅ Testar se eventos aparecem no contexto
3. ✅ Atualizar prompt para usar `{{ $json.eventsText }}`
4. ✅ Testar fluxo de reagendamento
5. ✅ Testar fluxo de cancelamento

---

**Pronto! Agora o agente tem acesso a TODOS os agendamentos do cliente automaticamente.** 🚀

