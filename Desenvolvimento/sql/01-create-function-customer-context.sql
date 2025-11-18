-- ============================================================================
-- FUNCTION: get_customer_context
-- ============================================================================
-- Descrição: Retorna todos os dados de contexto do cliente em uma única query
-- 
-- Substitui 10 queries separadas por 1 chamada de função
-- 
-- Performance estimada: 300-500ms (vs 2400ms das 10 queries)
-- 
-- Uso:
--   SELECT get_customer_context(
--     '5511999887766@s.whatsapp.net',
--     'f53b8a68-5dfb-4d87-9aec-277a9e774104'::uuid
--   );
-- ============================================================================

CREATE OR REPLACE FUNCTION get_customer_context(
  p_session_id TEXT,
  p_company_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER  -- Executa com permissões do owner (bypass RLS)
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_customer_id UUID;
  v_customer_exists BOOLEAN;
BEGIN
  
  -- ========================================================================
  -- ETAPA 1: Verificar se cliente existe e pegar ID
  -- ========================================================================
  SELECT 
    id,
    (id IS NOT NULL) 
  INTO 
    v_customer_id,
    v_customer_exists
  FROM customers
  WHERE session_id = p_session_id 
    AND company_id = p_company_id
  LIMIT 1;

  -- ========================================================================
  -- ETAPA 2: Construir JSON com todos os dados
  -- ========================================================================
  SELECT json_build_object(
    
    -- ====================================================================
    -- 1. COMPANY DATA (substitui getCompanyData)
    -- ====================================================================
    'company', (
      SELECT json_build_object(
        'id', c.id,
        'name', c.name,
        'about', c.about,
        'created_at', c.created_at
      )
      FROM companies c
      WHERE c.id = p_company_id
    ),
    
    -- ====================================================================
    -- 2. CUSTOMER DATA (substitui getCustomerData)
    -- ====================================================================
    'customer', (
      CASE 
        WHEN v_customer_exists THEN
          (SELECT json_build_object(
            'id', cu.id,
            'name', cu.name,
            'email', cu.email,
            'birthdate', cu.birthdate,
            'session_id', cu.session_id,
            'company_id', cu.company_id,
            'last_message', cu.last_message,
            'created_at', cu.created_at
          )
          FROM customers cu
          WHERE cu.id = v_customer_id)
        ELSE NULL
      END
    ),
    
    -- ====================================================================
    -- 3. BUFFER MESSAGES (substitui getBufferMessages)
    -- ====================================================================
    'bufferMessages', (
      CASE 
        WHEN v_customer_exists THEN
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', cm.id,
                'message', cm.message,
                'created_at', cm.created_at,
                'from', cm.from,
                'session_id', cm.session_id
              )
              ORDER BY cm.created_at ASC
            )
            FROM customer_messages cm
            WHERE cm.customer_id = v_customer_id
              AND cm."isBuffer" = true),
            '[]'::json
          )
        ELSE '[]'::json
      END
    ),
    
    -- ====================================================================
    -- 4. CUSTOMER MEMORIES (substitui getCustomerMemories)
    -- ====================================================================
    'memories', (
      CASE 
        WHEN v_customer_exists THEN
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', mem.id,
                'memory', mem.memory,
                'created_at', mem.created_at
              )
              ORDER BY mem.created_at DESC
            )
            FROM (
              SELECT id, memory, created_at
              FROM customer_memories
              WHERE customer_id = v_customer_id
              ORDER BY created_at DESC
              LIMIT 20
            ) mem),
            '[]'::json
          )
        ELSE '[]'::json
      END
    ),
    
    -- ====================================================================
    -- 5. MESSAGE HISTORY (substitui getCustomerMessages)
    -- ====================================================================
    'messageHistory', (
      CASE 
        WHEN v_customer_exists THEN
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'message', cm.message,
                'from', cm.from,
                'created_at', cm.created_at
              )
              ORDER BY cm.created_at DESC
            )
            FROM (
              SELECT message, "from", created_at
              FROM customer_messages
              WHERE customer_id = v_customer_id
              ORDER BY created_at DESC
              LIMIT 20
            ) cm),
            '[]'::json
          )
        ELSE '[]'::json
      END
    ),
    
    -- ====================================================================
    -- 6. COMPANY SERVICES (substitui services tool)
    -- ====================================================================
    'services', (
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', s.id,
            'name', s.name,
            'description', s.description,
            'price', s.price,
            'price_on_request', s.price_on_request,
            'price_starting_from', s.price_starting_from,
            'is_recurring', s.is_recurring,
            'recurrence_type', s.recurrence_type,
            'created_at', s.created_at
          )
        )
        FROM (
          SELECT *
          FROM company_services
          WHERE company_id = p_company_id
          ORDER BY name
          LIMIT 100
        ) s),
        '[]'::json
      )
    ),
    
    -- ====================================================================
    -- 7. COMPANY LOCATIONS (substitui locations tool)
    -- ====================================================================
    'locations', (
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', l.id,
            'name', l.name,
            'address', l.address,
            'complement', l.complement,
            'parking', l.parking,
            'phone', l.phone,
            'created_at', l.created_at
          )
        )
        FROM (
          SELECT *
          FROM company_locations
          WHERE company_id = p_company_id
          ORDER BY name
          LIMIT 100
        ) l),
        '[]'::json
      )
    ),
    
    -- ====================================================================
    -- 8. COLABORATORS (substitui colaborators tool)
    -- ====================================================================
    'colaborators', (
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', col.id,
            'name', col.name,
            'title', col.title,
            'description', col.description,
            'active', col.active,
            'created_at', col.created_at
          )
        )
        FROM (
          SELECT *
          FROM colaborators
          WHERE company_id = p_company_id
            AND active = true
          ORDER BY name
          LIMIT 100
        ) col),
        '[]'::json
      )
    ),
    
    -- ====================================================================
    -- 9. SERVICE COMBINATIONS (substitui VIEW + múltiplas queries)
    -- ====================================================================
    'combinations', (
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'service_id', comb.service_id,
            'service_name', comb.service_name,
            'service_description', comb.service_description,
            'service_price', comb.service_price,
            'service_price_on_request', comb.service_price_on_request,
            'service_price_starting_from', comb.service_price_starting_from,
            'colaborator_id', comb.colaborator_id,
            'colaborator_name', comb.colaborator_name,
            'colaborator_title', comb.colaborator_title,
            'colaborator_description', comb.colaborator_description,
            'location_id', comb.location_id,
            'location_name', comb.location_name,
            'location_address', comb.location_address,
            'location_parking', comb.location_parking
          )
        )
        FROM (
          SELECT 
            -- Serviço
            s.id as service_id,
            s.name as service_name,
            s.description as service_description,
            s.price as service_price,
            s.price_on_request as service_price_on_request,
            s.price_starting_from as service_price_starting_from,
            
            -- Colaborador
            c.id as colaborator_id,
            c.name as colaborator_name,
            c.title as colaborator_title,
            c.description as colaborator_description,
            -- Localização
            l.id as location_id,
            l.name as location_name,
            l.address as location_address,
            l.parking as location_parking
          
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
          
          WHERE s.company_id = p_company_id
            AND c.company_id = p_company_id
            AND l.company_id = p_company_id
          
          ORDER BY s.name, c.name, l.name
          LIMIT 500
        ) comb),
        '[]'::json
      )
    ),
    
    -- ====================================================================
    -- 10. CUSTOMER EVENTS (agendamentos do cliente)
    -- ====================================================================
    'events', (
      CASE 
        WHEN v_customer_exists THEN
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', e.id,
                'event_date', e.event_date,
                'title', e.title,
                'description', e.description,
                'service_id', e.service_id,
                'service_name', s.name,
                'colaborator_id', e.colaborator_id,
                'colaborator_name', col.name,
                'location_id', e.location_id,
                'location_name', loc.name,
                'location_address', loc.address,
                'created_at', e.created_at
              )
              ORDER BY 
                CASE 
                  WHEN e.event_date IS NULL OR e.event_date::text = '' THEN NULL
                  ELSE e.event_date::timestamp 
                END ASC NULLS LAST
            )
            FROM events e
            LEFT JOIN company_services s ON e.service_id = s.id
            LEFT JOIN colaborators col ON e.colaborator_id = col.id
            LEFT JOIN company_locations loc ON e.location_id = loc.id
            WHERE e.customer_id = v_customer_id
              AND e.company_id = p_company_id
            LIMIT 50),
            '[]'::json
          )
        ELSE '[]'::json
      END
    ),
    
    -- ====================================================================
    -- METADATA (útil para debug e monitoramento)
    -- ====================================================================
    'metadata', json_build_object(
      'customer_exists', v_customer_exists,
      'customer_id', v_customer_id,
      'session_id', p_session_id,
      'company_id', p_company_id,
      'timestamp', NOW()
    )
    
  ) INTO v_result;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar JSON com informação do erro
    RETURN json_build_object(
      'error', true,
      'message', SQLERRM,
      'detail', SQLSTATE,
      'timestamp', NOW()
    );
    
END;
$$;

-- ============================================================================
-- COMENTÁRIOS SOBRE A FUNÇÃO
-- ============================================================================
COMMENT ON FUNCTION get_customer_context(TEXT, UUID) IS 
'Retorna contexto completo do cliente em uma única query.
Substitui 10 queries separadas por 1 chamada.
Parametros:
  - p_session_id: ID da sessão do WhatsApp (remoteJid)
  - p_company_id: UUID da empresa
Retorna: JSON com todos os dados de contexto';

-- ============================================================================
-- PERMISSÕES (necessário para chamar via API REST)
-- ============================================================================

-- Permitir que roles authenticated e anon executem a function
GRANT EXECUTE ON FUNCTION get_customer_context(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_context(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_customer_context(TEXT, UUID) TO service_role;

-- Se você usar service_role no N8N (recomendado), a linha acima já é suficiente

-- ============================================================================
-- SEGURANÇA: O QUE CADA LINHA FAZ
-- ============================================================================
--
-- SECURITY DEFINER:
--   - A function executa com permissões do OWNER (quem criou)
--   - Ignora Row Level Security (RLS)
--   - Útil porque service_role precisa acessar TODAS as tabelas
--   - CUIDADO: Valide sempre os parâmetros de entrada!
--
-- SET search_path = public:
--   - Previne ataques de search_path hijacking
--   - Garante que a function sempre busca tabelas no schema 'public'
--
-- GRANT EXECUTE:
--   - authenticated: Usuários logados (se usar auth)
--   - anon: Chamadas não autenticadas (público)
--   - service_role: Service Role Key (N8N usa esse)
--
-- ============================================================================
-- COMO USAR NO N8N
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MÉTODO 1: Execute SQL (RECOMENDADO - Mais simples)
-- ----------------------------------------------------------------------------
-- Nó: Supabase
-- Operation: Execute SQL
-- Credenciais: Use Service Role Key
-- Query:
--
-- SELECT get_customer_context(
--   '{{ $("webhook").item.json.body.data.key.remoteJid }}',
--   'f53b8a68-5dfb-4d87-9aec-277a9e774104'::uuid
-- ) as context;
--
-- Resultado estará em: {{ $json.context }}
--
-- VANTAGENS:
--   - Mais direto e simples
--   - Não precisa de permissões RLS
--   - É o que você provavelmente já está usando

-- ----------------------------------------------------------------------------
-- MÉTODO 2: RPC via HTTP Request (Alternativo)
-- ----------------------------------------------------------------------------
-- Nó: HTTP Request
-- Method: POST
-- URL: https://SEU-PROJETO.supabase.co/rest/v1/rpc/get_customer_context
-- Headers:
--   apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
--   Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
--   Content-Type: application/json
-- Body:
--   {
--     "p_session_id": "{{ $('webhook').item.json.body.data.key.remoteJid }}",
--     "p_company_id": "f53b8a68-5dfb-4d87-9aec-277a9e774104"
--   }
--
-- VANTAGENS:
--   - Pode ser chamado de qualquer lugar (frontend, mobile, etc)
--   - Usa API REST padrão do Supabase
--   - Melhor para integrações externas
-- ============================================================================

-- ============================================================================
-- TESTE RÁPIDO
-- ============================================================================
-- Descomente para testar (substitua pelos valores reais):
--
-- SELECT get_customer_context(
--   '5511999887766@s.whatsapp.net',
--   'f53b8a68-5dfb-4d87-9aec-277a9e774104'::uuid
-- );
-- ============================================================================

