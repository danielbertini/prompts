-- ============================================
-- VIEWS OTIMIZADAS PARA REDUCAO DE TOKENS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. VIEW: Servicos (company_services)
-- Usada por: get_services_by_company_id
-- ============================================
DROP VIEW IF EXISTS v_services_minimal;

CREATE VIEW v_services_minimal AS
SELECT 
  id,
  company_id,
  name,
  description,
  price,
  price_on_request,
  price_starting_from
FROM company_services;

COMMENT ON VIEW v_services_minimal IS 'View otimizada de servicos para reducao de tokens nas tools de IA';

-- ============================================
-- 2. VIEW: Colaboradores (colaborators)
-- Usada por: get_colaborators_by_company_id
-- ============================================
DROP VIEW IF EXISTS v_colaborators_minimal;

CREATE VIEW v_colaborators_minimal AS
SELECT 
  id,
  company_id,
  name,
  title,
  description
FROM colaborators
WHERE active = true;

COMMENT ON VIEW v_colaborators_minimal IS 'View otimizada de colaboradores para reducao de tokens nas tools de IA';

-- ============================================
-- 3. VIEW: Unidades/Locais (company_locations)
-- Usada por: get_locations_by_company_id
-- ============================================
DROP VIEW IF EXISTS v_locations_minimal;

CREATE VIEW v_locations_minimal AS
SELECT 
  id,
  company_id,
  name,
  address->>'formatted' AS address,
  address->>'neighborhood' AS neighborhood,
  phone
FROM company_locations;

COMMENT ON VIEW v_locations_minimal IS 'View otimizada de unidades para reducao de tokens nas tools de IA';

-- ============================================
-- 4. VIEW: Relacionamentos (colaborator_x_service_x_location)
-- Usada por: get_relationships
-- ============================================
DROP VIEW IF EXISTS v_relationships_minimal;

CREATE VIEW v_relationships_minimal AS
SELECT 
  company_id,
  service_id,
  colaborator_id,
  location_id
FROM colaborator_x_service_x_location;

COMMENT ON VIEW v_relationships_minimal IS 'View otimizada de relacionamentos para reducao de tokens nas tools de IA';

-- ============================================
-- 5. VIEW: Eventos/Agendamentos (events)
-- Usada por: get_events
-- ============================================
DROP VIEW IF EXISTS v_events_minimal;

CREATE VIEW v_events_minimal AS
SELECT 
  id,
  company_id,
  customer_id,
  event_date,
  service_id,
  colaborator_id,
  location_id
FROM events;

COMMENT ON VIEW v_events_minimal IS 'View otimizada de eventos para reducao de tokens nas tools de IA';

-- ============================================
-- 6. VIEW: Clientes (customers)
-- Usada por: GetCustomer no Recepcionist
-- ============================================
DROP VIEW IF EXISTS v_customers_minimal;

CREATE VIEW v_customers_minimal AS
SELECT 
  id,
  company_id,
  session_id,
  name,
  email,
  birthdate
FROM customers;

COMMENT ON VIEW v_customers_minimal IS 'View otimizada de clientes para reducao de tokens nas tools de IA';

-- ============================================
-- PERMISSOES (RLS)
-- As views herdam as policies das tabelas base
-- Mas precisamos garantir acesso via anon key
-- ============================================

-- Garante que o role anon pode ler as views
GRANT SELECT ON v_services_minimal TO anon;
GRANT SELECT ON v_colaborators_minimal TO anon;
GRANT SELECT ON v_locations_minimal TO anon;
GRANT SELECT ON v_relationships_minimal TO anon;
GRANT SELECT ON v_events_minimal TO anon;
GRANT SELECT ON v_customers_minimal TO anon;

-- Garante que o role authenticated tambem pode ler
GRANT SELECT ON v_services_minimal TO authenticated;
GRANT SELECT ON v_colaborators_minimal TO authenticated;
GRANT SELECT ON v_locations_minimal TO authenticated;
GRANT SELECT ON v_relationships_minimal TO authenticated;
GRANT SELECT ON v_events_minimal TO authenticated;
GRANT SELECT ON v_customers_minimal TO authenticated;

-- ============================================
-- VERIFICACAO
-- Execute para confirmar que as views foram criadas
-- ============================================

SELECT 
  table_name as view_name,
  'criada com sucesso' as status
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'v_%_minimal';

