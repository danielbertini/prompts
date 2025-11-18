-- Script para limpar dados órfãos que causam violação de foreign key

-- 1. Limpar colaborator_x_services órfãos (apontam para colaboradores inexistentes)
DELETE FROM colaborator_x_services
WHERE colaborator_id NOT IN (SELECT id FROM colaborators WHERE active = true);

-- 2. Limpar colaborator_x_services órfãos (apontam para serviços inexistentes)
DELETE FROM colaborator_x_services
WHERE service_id NOT IN (SELECT id FROM company_services);

-- 3. Limpar colaborator_x_locations órfãos (apontam para colaboradores inexistentes)
DELETE FROM colaborator_x_locations
WHERE colaborator_id NOT IN (SELECT id FROM colaborators WHERE active = true);

-- 4. Limpar colaborator_x_locations órfãos (apontam para localizações inexistentes)
DELETE FROM colaborator_x_locations
WHERE location_id NOT IN (SELECT id FROM company_locations);

-- 5. Verificar integridade após limpeza
SELECT 'colaborator_x_services órfãos' as table_name, COUNT(*) as orphaned_count
FROM colaborator_x_services cs
LEFT JOIN colaborators c ON cs.colaborator_id = c.id
LEFT JOIN company_services s ON cs.service_id = s.id
WHERE c.id IS NULL OR s.id IS NULL

UNION ALL

SELECT 'colaborator_x_locations órfãos' as table_name, COUNT(*) as orphaned_count
FROM colaborator_x_locations cl
LEFT JOIN colaborators c ON cl.colaborator_id = c.id
LEFT JOIN company_locations l ON cl.location_id = l.id
WHERE c.id IS NULL OR l.id IS NULL;

-- Resultado esperado: 0 registros órfãos após limpeza

