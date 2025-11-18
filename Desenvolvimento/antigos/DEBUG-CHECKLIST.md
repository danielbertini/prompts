# CHECKLIST DE DEBUGGING - PROBLEMA COM VALIDAÇÃO DE PROFISSIONAIS

## PROBLEMA
Orchestrator diz "não temos profissionais" quando Carlos ESTÁ associado ao serviço "Depilação a Laser"

---

## ETAPA 1: VERIFICAR TOOLS NO N8N

### [ ] 1.1 Abrir workflow no n8n
- Vá para o workflow do orchestrator

### [ ] 1.2 Clicar no nó "orchestrator" (AI Agent)
- Verifique a seção "Tools"

### [ ] 1.3 Verificar se ESTAS tools estão conectadas:
- [ ] services
- [ ] locations
- [ ] customer
- [ ] updateCustomer
- [ ] colaborators
- [ ] colaborators_x_services ⚠️ CRÍTICA
- [ ] colaborators_x_locations ⚠️ CRÍTICA

**Se alguma NÃO estiver conectada, esse é o problema!**

### [ ] 1.4 Clicar no nó "calendar" (AI Agent)
- Verificar que NÃO tem essas tools conectadas
- Se tiver, REMOVER

---

## ETAPA 2: TESTAR TOOLS ISOLADAMENTE

### [ ] 2.1 Testar tool "colaborators_x_services" diretamente

1. Adicione um nó temporário "HTTP Request" ou "Execute Workflow"
2. Chame a tool `colaborators_x_services` com o service_id de "Depilação a Laser"
3. Verifique o retorno

**Resultado esperado:**
```json
[
  {
    "colaborator_id": "uuid-do-carlos",
    "service_id": "uuid-depilacao-laser"
  }
]
```

**Se retornar vazio `[]`:**
- O problema está no BANCO DE DADOS, não no prompt
- A associação Carlos ↔ Depilação a Laser não existe no banco

### [ ] 2.2 Verificar banco de dados

Execute estas queries no banco:

```sql
-- Buscar o serviço
SELECT * FROM services WHERE name LIKE '%Depilação%Laser%';

-- Buscar o Carlos
SELECT * FROM colaborators WHERE name LIKE '%Carlos%';

-- Buscar a associação
SELECT * FROM colaborators_x_services 
WHERE service_id = 'uuid-depilacao-laser' 
AND colaborator_id = 'uuid-carlos';
```

**Se a última query retornar 0 registros:**
- O Carlos NÃO está associado ao serviço no banco
- Você precisa criar essa associação

---

## ETAPA 3: VERIFICAR LOGS DE EXECUÇÃO

### [ ] 3.1 Executar workflow com debug ativado

1. Execute o workflow manualmente
2. Digite: "Quero depilação a laser"
3. Aguarde resposta

### [ ] 3.2 Abrir log de execução do orchestrator

1. Clique no nó "orchestrator" executado (fica verde)
2. Vá na aba "Executions"
3. Clique na última execução

### [ ] 3.3 Verificar quais tools foram chamadas

Procure no log por:
```
Tool called: services ✓
Tool called: colaborators ✓
Tool called: colaborators_x_services ⚠️ DEVE TER ISSO!
Tool called: colaborators_x_locations ✓
```

**Se NÃO aparecer "colaborators_x_services":**
- A tool não foi chamada
- Ou não está conectada OU o agente não está seguindo o prompt

### [ ] 3.4 Verificar resposta da tool

Se a tool foi chamada, procure:
```json
{
  "tool": "colaborators_x_services",
  "input": { "service_id": "xxx" },
  "output": [...]  ⚠️ OLHE AQUI
}
```

**Se output for `[]` (vazio):**
- Problema no banco de dados (associação não existe)

**Se output tiver dados mas agente diz "não tem":**
- Problema no prompt (agente ignora resposta)

---

## ETAPA 4: TESTAR COM PROMPT SIMPLIFICADO

### [ ] 4.1 Criar versão mínima do prompt

Substitua temporariamente o prompt do orchestrator por:

```markdown
# OBJETIVO
Você é um agente de testes.

# TOOLS
- colaborators_x_services: retorna profissionais que fazem um serviço

# INSTRUÇÕES

Quando o usuário disser "testar", faça:

1. Chame colaborators_x_services com service_id = "uuid-do-servico-depilacao-laser"
2. Mostre EXATAMENTE o que a tool retornou
3. Se retornou dados, diga: "TOOL RETORNOU DADOS"
4. Se retornou vazio, diga: "TOOL RETORNOU VAZIO"

NÃO invente nada. Apenas mostre o resultado da tool.
```

### [ ] 4.2 Testar com prompt mínimo

Digite: "testar"

**Se disser "TOOL RETORNOU VAZIO":**
- Problema no banco de dados (associação não existe)

**Se disser "TOOL RETORNOU DADOS":**
- O banco está OK, problema é no prompt complexo

---

## ETAPA 5: VERIFICAR FORMATO DA TOOL

### [ ] 5.1 Verificar como a tool está configurada no n8n

1. Encontre o nó da tool "colaborators_x_services"
2. Verifique os parâmetros de entrada
3. Verifique o formato de saída

**Pergunta crítica:** A tool espera `service_id` ou `serviceId`?

Inconsistências comuns:
- Tool espera: `service_id` (snake_case)
- Agente envia: `serviceId` (camelCase)
- Resultado: erro silencioso, retorna vazio

### [ ] 5.2 Verificar tipo de dado

A tool espera:
- String UUID? `"uuid-123"`
- Número? `123`
- Array? `["uuid-123"]`

Se o agente enviar formato errado, retorna vazio.

---

## DIAGNÓSTICO FINAL

Com base nos testes acima, identifique o problema:

### CASO 1: Tools não conectadas
**Sintoma:** Logs não mostram chamadas das tools
**Solução:** Conectar tools ao orchestrator no n8n

### CASO 2: Banco de dados vazio
**Sintoma:** Tool retorna `[]` quando testada diretamente
**Solução:** Criar associação no banco:
```sql
INSERT INTO colaborators_x_services (id, colaborator_id, service_id)
VALUES (uuid_generate_v4(), 'uuid-carlos', 'uuid-depilacao-laser');
```

### CASO 3: Formato de entrada errado
**Sintoma:** Tool retorna `[]` mas associação existe no banco
**Solução:** Ajustar prompt para enviar formato correto

### CASO 4: Agente ignora resultado
**Sintoma:** Tool retorna dados mas agente diz "não tem"
**Solução:** Prompt ainda mais explícito + temperature 0.05

---

## PRÓXIMOS PASSOS

1. Complete todas as etapas acima
2. Anote os resultados de cada verificação
3. Identifique qual caso se aplica
4. Aplique a solução correspondente
5. Teste novamente

---

## INFORMAÇÕES ADICIONAIS PARA COLETAR

Quando responder, forneça:
- [ ] Screenshot do nó orchestrator mostrando tools conectadas
- [ ] Resultado da query no banco (passo 2.2)
- [ ] Log de execução completo (passo 3.2)
- [ ] Resposta do teste com prompt mínimo (passo 4.2)

