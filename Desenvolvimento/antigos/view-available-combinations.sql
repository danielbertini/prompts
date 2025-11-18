-- VIEW: Combinações disponíveis de Serviço x Colaborador x Localização
-- Esta VIEW elimina a necessidade do LLM fazer JOINs mentalmente

CREATE OR REPLACE VIEW available_service_combinations AS
SELECT 
  -- Serviço
  s.id as service_id,
  s.name as service_name,
  s.description as service_description,
  s.price as service_price,
  s.price_on_request as service_price_on_request,
  s.price_starting_from as service_price_starting_from,
  s.is_recurring as service_is_recurring,
  s.recurrence_type as service_recurrence_type,
  
  -- Colaborador
  c.id as colaborator_id,
  c.name as colaborator_name,
  c.title as colaborator_title,
  c.description as colaborator_description,
  
  -- Localização
  l.id as location_id,
  l.name as location_name,
  l.address as location_address,
  l.complement as location_complement,
  l.parking as location_parking,
  l.phone as location_phone,
  
  -- Empresa (para filtrar multi-tenant)
  s.company_id as company_id

FROM company_services s
INNER JOIN colaborator_x_services cs 
  ON s.id = cs.service_id
  AND cs.service_id IS NOT NULL
  AND cs.colaborator_id IS NOT NULL
INNER JOIN colaborators c 
  ON cs.colaborator_id = c.id 
  AND c.active = true
  AND c.id IS NOT NULL
INNER JOIN colaborator_x_locations cl 
  ON c.id = cl.colaborator_id
  AND cl.colaborator_id IS NOT NULL
  AND cl.location_id IS NOT NULL
INNER JOIN company_locations l 
  ON cl.location_id = l.id
  AND l.id IS NOT NULL

WHERE s.company_id IS NOT NULL
  AND c.company_id IS NOT NULL
  AND l.company_id IS NOT NULL

ORDER BY s.name, c.name, l.name;

-- Índices recomendados para performance
CREATE INDEX IF NOT EXISTS idx_colaborator_x_services_lookup 
  ON colaborator_x_services(service_id, colaborator_id);

CREATE INDEX IF NOT EXISTS idx_colaborator_x_locations_lookup 
  ON colaborator_x_locations(colaborator_id, location_id);

CREATE INDEX IF NOT EXISTS idx_colaborators_active 
  ON colaborators(active) WHERE active = true;

-- Exemplo de uso:
-- SELECT * FROM available_service_combinations WHERE service_name ILIKE '%barba%';
-- SELECT * FROM available_service_combinations WHERE company_id = 'uuid-da-empresa';

