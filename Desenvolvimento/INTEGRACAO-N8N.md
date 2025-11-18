# Guia de Integração N8N

## Fluxo do Workflow

```
┌──────────────────┐
│ Webhook Trigger  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Supabase: Query  │  ← Consultar VIEW available_service_combinations
│ VIEW             │    WHERE company_id = {{ $('getCompanyData').item.json.id }}
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Code: Format     │  ← Usar código: n8n-format-combinations.js
│ Combinations     │    Output: formattedForPrompt (string)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ OpenAI: Chat     │  ← Usar prompt: agent-v4-preloaded.md
│ GPT-4o-mini      │    System Message: [conteúdo do prompt]
└────────┬─────────┘         Inserir: {{ $json.formattedForPrompt }}
         │
         ▼
┌──────────────────┐
│ Responder        │
└──────────────────┘
```

## 1. Nó Supabase - Query VIEW

**Tipo**: Supabase
**Operação**: Select Rows
**Tabela**: `available_service_combinations`

**Query (SQL):**
```sql
SELECT * FROM available_service_combinations
WHERE company_id = '{{ $('getCompanyData').item.json.id }}'
ORDER BY service_name, colaborator_name
```

**Ou usando Query Builder:**
- Table: `available_service_combinations`
- Select: `*`
- Filter: `company_id` = `{{ $('getCompanyData').item.json.id }}`

---

## 2. Nó Code - Formatar Dados

**Tipo**: Code
**Modo**: Run Once for All Items

**Código**: (copie de `n8n-format-combinations.js`)

```javascript
const combinations = $input.all().map(item => item.json);

const formatted = combinations.map((item, index) => {
  let price = 'Sob consulta';
  if (!item.service_price_on_request) {
    price = item.service_price_starting_from 
      ? `A partir de R$ ${item.service_price}` 
      : `R$ ${item.service_price}`;
  }
  
  const address = item.location_address?.formatted || 'Endereço não disponível';
  
  return {
    id: index + 1,
    service_id: item.service_id,
    service_name: item.service_name,
    service_price: price,
    colaborator_id: item.colaborator_id,
    colaborator_name: item.colaborator_name,
    location_id: item.location_id,
    location_name: item.location_name,
    location_address: address
  };
});

let promptText = '# OPCOES DISPONIVEIS\n\n';
promptText += 'Use os UUIDs EXATAMENTE como aparecem abaixo:\n\n';

formatted.forEach(item => {
  promptText += `[${item.id}] ${item.service_name} com ${item.colaborator_name} na ${item.location_name}\n`;
  promptText += `    service_id: ${item.service_id}\n`;
  promptText += `    colaborator_id: ${item.colaborator_id}\n`;
  promptText += `    location_id: ${item.location_id}\n`;
  promptText += `    endereco: ${item.location_address}\n`;
  promptText += `    preco: ${item.service_price}\n\n`;
});

return [{
  json: {
    combinations: formatted,
    formattedForPrompt: promptText,
    totalOptions: formatted.length
  }
}];
```

---

## 3. Nó OpenAI - Chat

**Tipo**: OpenAI
**Operação**: Chat
**Modelo**: gpt-4o-mini

**System Message**: (copie de `agent-v4-preloaded.md`)

Na seção CONTEXTO do prompt, onde está:
```markdown
{{ $json.availableCombinations }}
```

Substitua por:
```markdown
{{ $json.formattedForPrompt }}
```

**User Message**:
```
{{ $('webhook').item.json.body.data.message.conversation }}
```

**Settings importantes**:
- Temperature: `0` (para evitar alucinações)
- Max Tokens: `500` (respostas curtas)
- Top P: `1`

---

## 4. Exemplo de Saída Formatada

O que o nó Code vai gerar para o prompt:

```
# OPCOES DISPONIVEIS

Use os UUIDs EXATAMENTE como aparecem abaixo:

[1] Barbearia com Roger Lemos na Unidade Santana
    service_id: bd90809c-09e9-48b7-ac78-9e46ee0269ab
    colaborator_id: 54fa5c3d-75d2-40b4-9478-ad0bb90954f1
    location_id: 74f0f10b-0946-4a38-b9e0-bdf1a867cdce
    endereco: Rua Aviador Gil Guilherme, 116 - Santana, São Paulo - SP, 02012-130, Brasil
    preco: R$ 70.00

[2] Manicure com Katia Fonseca na Unidade Santana
    service_id: 4d22a723-e82c-45ae-8a28-e06f90f201a5
    colaborator_id: 945656e7-a58e-405b-b52c-8a08e5acebce
    location_id: 74f0f10b-0946-4a38-b9e0-bdf1a867cdce
    endereco: Rua Aviador Gil Guilherme, 116 - Santana, São Paulo - SP
    preco: R$ 60.00

[3] Cabeleireiro - Hair Stylist com Daiana Vaz na Unidade Tucuruvi
    service_id: 2df2767f-63be-4eff-9f42-f897a2b9eb3d
    colaborator_id: ffbd223b-9a7e-424e-8271-8a8328dd8851
    location_id: 2f96e0a9-6424-4138-aab2-3b35f8ceef1a
    endereco: R. Dona Gabriela, 307 - Vila Dom Pedro II, São Paulo - SP
    preco: A partir de R$ 150.00
```

---

## Benefícios desta formatação:

✅ **Numerada**: [1], [2], [3] - fácil referenciar
✅ **UUIDs visíveis**: Cada UUID em linha separada
✅ **Hierarquia clara**: Nome em negrito, detalhes indentados
✅ **Endereço simplificado**: Só o `formatted`, não o JSON completo
✅ **Preço formatado**: "R$ 70.00" ou "Sob consulta"
✅ **Compacto**: ~8 linhas por opção vs ~50 linhas do JSON original
✅ **Economia**: ~85% menos tokens

---

## Checklist de Implementação:

1. ⬜ Criar VIEW no Supabase (`view-available-combinations.sql`)
2. ⬜ Adicionar nó Supabase Query no N8N
3. ⬜ Adicionar nó Code com `n8n-format-combinations.js`
4. ⬜ No prompt, substituir `{{ $json.availableCombinations }}` por `{{ $json.formattedForPrompt }}`
5. ⬜ Configurar Temperature = 0 no nó OpenAI
6. ⬜ Testar com "quero fazer a barba"

---

## Estimativa de Redução de Tokens:

| Formato | Tokens por opção | Total (7 opções) |
|---------|------------------|------------------|
| JSON original | ~250 | ~1750 |
| Formatado otimizado | ~40 | ~280 |
| **Economia** | **-84%** | **-1470 tokens** |

Menos tokens = mais barato + mais rápido + mais espaço para contexto!

