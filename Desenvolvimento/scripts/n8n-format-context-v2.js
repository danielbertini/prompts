// ============================================================================
// N8N CODE NODE: Formatar contexto para prompts (VERSÃO 2 - COM DESCRIÇÕES)
// ============================================================================
// Este código formata os dados retornados pela function get_customer_context()
// para serem usados nos prompts dos agentes de IA
//
// INPUT: Array com contexto do cliente (resultado da SQL function)
// OUTPUT: Objeto formatado pronto para usar em {{ $json.xxx }}
// ============================================================================

// Pegar o primeiro item do array (a function sempre retorna 1 item)
const inputData = $input.first().json;

// Validar se inputData existe e tem a estrutura correta
if (!inputData) {
  throw new Error(
    "Dados de entrada não encontrados. Verifique se o nó anterior retornou dados."
  );
}

// O Supabase pode retornar os dados em diferentes formatos
// Tentar acessar context ou usar inputData diretamente
const context = inputData.context || inputData;

// ============================================================================
// HELPER: Formatar preço
// ============================================================================
function formatPrice(service) {
  if (service.service_price_on_request) {
    return "Sob consulta";
  }

  if (service.service_price_starting_from) {
    return `A partir de R$ ${service.service_price}`;
  }

  return service.service_price ? `R$ ${service.service_price}` : "Sob consulta";
}

// ============================================================================
// HELPER: Formatar endereço
// ============================================================================
function formatAddress(address) {
  if (!address || !address.formatted) {
    return "Endereço não disponível";
  }
  return address.formatted;
}

// ============================================================================
// 1. FORMATAR COMBINATIONS (compacto e legível)
// ============================================================================
const formattedCombinations = (context.combinations || []).map(
  (combo, index) => {
    return {
      id: index + 1,
      service_id: combo.service_id,
      service_name: combo.service_name,
      service_description: combo.service_description || "Sem descrição", // ADICIONADO
      service_price: formatPrice(combo),
      colaborator_id: combo.colaborator_id,
      colaborator_name: combo.colaborator_name,
      colaborator_description: combo.colaborator_description || "Sem descrição", // ADICIONADO
      location_id: combo.location_id,
      location_name: combo.location_name,
      location_address: formatAddress(combo.location_address),
      parking: combo.location_parking ? "Sim" : "Não",
    };
  }
);

// Gerar texto formatado para o prompt (versão compacta)
let combinationsText = "### OPCOES DISPONIVEIS\n\n";
combinationsText += "Use os IDs (UUIDs) EXATAMENTE como aparecem abaixo:\n\n";

formattedCombinations.forEach((item) => {
  combinationsText += `[${item.id}] ${item.service_name} com ${item.colaborator_name} na ${item.location_name}\n`;
  combinationsText += `    Descrição Serviço: ${item.service_description}\n`; // ADICIONADO
  combinationsText += `    Sobre Profissional: ${item.colaborator_description}\n`; // ADICIONADO
  combinationsText += `    service_id: ${item.service_id}\n`;
  combinationsText += `    colaborator_id: ${item.colaborator_id}\n`;
  combinationsText += `    location_id: ${item.location_id}\n`;
  combinationsText += `    endereco: ${item.location_address}\n`;
  combinationsText += `    preco: ${item.service_price}\n`;
  combinationsText += `    estacionamento: ${item.parking}\n\n`;
});

// ============================================================================
// 2. FORMATAR MESSAGE HISTORY (cronológico - mais antigo primeiro)
// ============================================================================
const messageHistory = (context.messageHistory || [])
  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  .map((msg) => ({
    from: msg.from === "human" ? "Cliente" : "Assistente",
    message: msg.message,
    timestamp: new Date(msg.created_at).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

// Versão texto para prompt
let messageHistoryText = "### HISTORICO DA CONVERSA\n\n";
if (messageHistory.length === 0) {
  messageHistoryText += "Primeira interacao com o cliente.\n";
} else {
  messageHistory.forEach((msg) => {
    messageHistoryText += `[${msg.timestamp}] ${msg.from}: ${msg.message}\n`;
  });
}

// ============================================================================
// 3. FORMATAR MEMORIES
// ============================================================================
let memoriesText = "### MEMORIAS DO CLIENTE\n\n";
if (!context.memories || context.memories.length === 0) {
  memoriesText += "Nenhuma memoria registrada ainda.\n";
} else {
  context.memories.forEach((mem, index) => {
    const date = new Date(mem.created_at).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    memoriesText += `${index + 1}. ${mem.memory} (registrado em ${date})\n`;
  });
}

// ============================================================================
// 4. FORMATAR BUFFER MESSAGES (última mensagem do cliente)
// ============================================================================
const bufferText = (context.bufferMessages || [])
  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  .map((msg) => msg.message)
  .join("\n");

// ============================================================================
// 5. DADOS DA EMPRESA (formatado)
// ============================================================================
const companyInfo = context.company
  ? {
      name: context.company.name,
      about: context.company.about,
    }
  : {
      name: "Nome não disponível",
      about: "Informações não disponíveis",
    };

// ============================================================================
// 6. DADOS DO CLIENTE (formatado)
// ============================================================================
const customerInfo = context.customer
  ? {
      id: context.customer.id,
      name: context.customer.name || "Não informado",
      email: context.customer.email || "Não informado",
      birthdate: context.customer.birthdate || "Não informado",
      age: context.customer.birthdate
        ? new Date().getFullYear() -
          new Date(context.customer.birthdate).getFullYear()
        : null,
    }
  : null;

// ============================================================================
// 7. FORMATAR EVENTS (agendamentos do cliente)
// ============================================================================
const formattedEvents = (context.events || []).map((event, index) => {
  const eventDate = new Date(event.event_date);
  return {
    id: event.id,
    index: index + 1,
    service_id: event.service_id,
    service_name: event.service_name,
    colaborator_id: event.colaborator_id,
    colaborator_name: event.colaborator_name,
    location_id: event.location_id,
    location_name: event.location_name,
    location_address:
      event.location_address?.formatted || "Endereço não disponível",
    date: eventDate.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    time: eventDate.toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    }),
    datetime: event.event_date,
    title: event.title,
    description: event.description,
  };
});

// Versão texto para prompt
let eventsText = "### AGENDAMENTOS DO CLIENTE\n\n";
if (formattedEvents.length === 0) {
  eventsText += "Nenhum agendamento encontrado.\n";
} else {
  formattedEvents.forEach((event) => {
    eventsText += `[${event.index}] ${event.service_name} com ${event.colaborator_name}\n`;
    eventsText += `    Data: ${event.date}\n`;
    eventsText += `    Horário: ${event.time}\n`;
    eventsText += `    Local: ${event.location_name}\n`;
    eventsText += `    event_id: ${event.id}\n\n`;
  });
}

// ============================================================================
// 8. RESUMO DE CAMPOS OBRIGATÓRIOS (útil para o agente)
// ============================================================================
const missingFields = [];
if (!context.customer) {
  missingFields.push("Cliente não cadastrado");
} else {
  if (!context.customer.name) missingFields.push("nome");
  if (!context.customer.email) missingFields.push("email");
  if (!context.customer.birthdate) missingFields.push("data de nascimento");
}

const customerStatus =
  missingFields.length === 0
    ? "Cadastro completo"
    : `Faltam campos: ${missingFields.join(", ")}`;

// ============================================================================
// OUTPUT FINAL (otimizado para tokens)
// ============================================================================
return [
  {
    json: {
      // Dados brutos (caso precise acessar diretamente)
      raw: {
        company: context.company,
        customer: context.customer,
        services: context.services,
        locations: context.locations,
        colaborators: context.colaborators,
      },

      // Dados formatados para uso direto no prompt
      company: companyInfo,
      customer: customerInfo,
      customerStatus: customerStatus,
      missingFields: missingFields,

      // Textos formatados prontos para injetar no prompt
      combinationsText: combinationsText,
      messageHistoryText: messageHistoryText,
      memoriesText: memoriesText,
      eventsText: eventsText,
      bufferMessages: bufferText,

      // Arrays formatados (caso precise manipular)
      combinations: formattedCombinations,
      messageHistory: messageHistory,
      memories: context.memories,
      events: formattedEvents,

      // Metadata útil
      metadata: {
        total_combinations: formattedCombinations.length,
        total_messages: messageHistory.length,
        total_memories: (context.memories || []).length,
        total_events: formattedEvents.length,
        customer_exists: context.metadata?.customer_exists || false,
        timestamp: context.metadata?.timestamp || new Date().toISOString(),
      },
    },
  },
];
