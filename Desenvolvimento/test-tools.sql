-- SCRIPTS DE VERIFICAÇÃO DO BANCO DE DADOS
-- Execute estes comandos para diagnosticar o problema

-- ============================================================
-- 1. VERIFICAR SE O SERVIÇO EXISTE
-- ============================================================
SELECT 
    id as service_id,
    name as service_name,
    price
FROM services 
WHERE name ILIKE '%depilação%laser%'
   OR name ILIKE '%depilacao%laser%';

-- Resultado esperado: 1 linha com o serviço "Depilação a Laser"
-- Se retornar vazio: o serviço não existe no banco!


-- ============================================================
-- 2. VERIFICAR SE O CARLOS EXISTE
-- ============================================================
SELECT 
    id as colaborator_id,
    name as colaborator_name
FROM colaborators 
WHERE name ILIKE '%carlos%';

-- Resultado esperado: 1 linha com o Carlos
-- Se retornar vazio: o Carlos não existe no banco!


-- ============================================================
-- 3. VERIFICAR ASSOCIAÇÃO (CRÍTICO)
-- ============================================================
SELECT 
    cs.id,
    cs.colaborator_id,
    c.name as colaborator_name,
    cs.service_id,
    s.name as service_name
FROM colaborators_x_services cs
JOIN colaborators c ON c.id = cs.colaborator_id
JOIN services s ON s.id = cs.service_id
WHERE s.name ILIKE '%depilação%laser%'
  AND c.name ILIKE '%carlos%';

-- Resultado esperado: 1 linha mostrando Carlos ↔ Depilação a Laser
-- Se retornar vazio: A ASSOCIAÇÃO NÃO EXISTE! (Esse é o problema!)


-- ============================================================
-- 4. LISTAR TODAS AS ASSOCIAÇÕES DO CARLOS
-- ============================================================
SELECT 
    c.name as colaborator_name,
    s.name as service_name,
    cs.created_at
FROM colaborators_x_services cs
JOIN colaborators c ON c.id = cs.colaborator_id
JOIN services s ON s.id = cs.service_id
WHERE c.name ILIKE '%carlos%'
ORDER BY s.name;

-- Mostra todos os serviços que o Carlos faz
-- Se "Depilação a Laser" não aparecer aqui: associação não existe


-- ============================================================
-- 5. LISTAR QUEM FAZ DEPILAÇÃO A LASER
-- ============================================================
SELECT 
    s.name as service_name,
    c.name as colaborator_name,
    l.name as location_name
FROM colaborators_x_services cs
JOIN colaborators c ON c.id = cs.colaborator_id
JOIN services s ON s.id = cs.service_id
LEFT JOIN colaborators_x_locations cl ON cl.colaborator_id = c.id
LEFT JOIN locations l ON l.id = cl.location_id
WHERE s.name ILIKE '%depilação%laser%';

-- Mostra TODOS os profissionais que fazem Depilação a Laser
-- Se retornar vazio: NINGUÉM está associado a este serviço!


-- ============================================================
-- 6. CRIAR ASSOCIAÇÃO (SE NÃO EXISTIR)
-- ============================================================
-- ATENÇÃO: Substitua os UUIDs pelos valores reais do seu banco

-- Primeiro, pegue os IDs:
-- Carlos UUID:
SELECT id FROM colaborators WHERE name ILIKE '%carlos%';

-- Depilação a Laser UUID:
SELECT id FROM services WHERE name ILIKE '%depilação%laser%';

-- Depois, insira a associação:
INSERT INTO colaborators_x_services (
    id,
    colaborator_id,
    service_id,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(), -- ou uuid_generate_v4() dependendo do PostgreSQL
    'COLE-UUID-DO-CARLOS-AQUI',
    'COLE-UUID-DO-SERVICO-AQUI',
    NOW(),
    NOW()
);

-- Após inserir, execute a query #3 novamente para confirmar


-- ============================================================
-- 7. VERIFICAR ESTRUTURA DA TABELA
-- ============================================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'colaborators_x_services'
ORDER BY ordinal_position;

-- Confirma se os nomes das colunas estão corretos
-- Pode ser "colaborator_id" ou "collaborator_id" (com double L)


-- ============================================================
-- 8. CONTAR ASSOCIAÇÕES TOTAIS
-- ============================================================
SELECT 
    COUNT(*) as total_associations
FROM colaborators_x_services;

-- Se retornar 0: tabela está vazia!
-- Se retornar > 0: existem associações, mas talvez não a do Carlos


-- ============================================================
-- RESUMO DE DIAGNÓSTICO
-- ============================================================
-- Execute as queries na ordem e anote os resultados:
-- 
-- Query 1: Serviço existe? [ ] SIM [ ] NÃO
-- Query 2: Carlos existe? [ ] SIM [ ] NÃO  
-- Query 3: Associação existe? [ ] SIM [ ] NÃO ⚠️
-- Query 4: Carlos faz quais serviços? ______________
-- Query 5: Quem faz Depilação a Laser? ______________
--
-- Se Query 3 = NÃO: Execute Query 6 para criar a associação
-- Se Query 3 = SIM: O problema é no código/prompt, não no banco
