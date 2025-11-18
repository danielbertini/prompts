// ============================================
// CÓDIGO PARA NÓ "CODE" NO N8N
// ============================================
//
// INSTRUÇÕES:
// 1. Adicione este código em um nó "Code"
// 2. Conecte DEPOIS do nó que consulta a VIEW
// 3. No prompt, use: {{ $json.formattedForPrompt }}
//
// ============================================

// Receber dados do nó anterior
const combinations = $input.all().map((item) => item.json);

// Formatar de forma otimizada para o LLM
const formatted = combinations.map((item, index) => {
  // Simplificar preço
  let price = "Sob consulta";
  if (!item.service_price_on_request) {
    price = item.service_price_starting_from
      ? `A partir de R$ ${item.service_price}`
      : `R$ ${item.service_price}`;
  }

  // Simplificar endereço
  const address = item.location_address?.formatted || "Endereço não disponível";

  return {
    id: index + 1,
    service_id: item.service_id,
    service_name: item.service_name,
    service_description: item.service_description || "Sem descrição",
    service_price: price,
    colaborator_id: item.colaborator_id,
    colaborator_name: item.colaborator_name,
    colaborator_title: item.colaborator_title || "",
    colaborator_description: item.colaborator_description || "Sem descrição",
    location_id: item.location_id,
    location_name: item.location_name,
    location_address: address,
    location_parking: item.location_parking
      ? "Com estacionamento"
      : "Sem estacionamento",
    location_phone: item.location_phone || "Telefone não disponível",
  };
});

// Criar string formatada para o prompt (otimizada para tokens)
let promptText = "# OPCOES DISPONIVEIS\n\n";
promptText += "Use os UUIDs EXATAMENTE como aparecem abaixo:\n\n";

formatted.forEach((item) => {
  promptText += `[${item.id}] ${item.service_name} com ${item.colaborator_name} na ${item.location_name}\n`;
  promptText += `    service_id: ${item.service_id}\n`;
  promptText += `    service_description: ${item.service_description}\n`;
  promptText += `    service_price: ${item.service_price}\n`;
  promptText += `    colaborator_id: ${item.colaborator_id}\n`;
  promptText += `    colaborator_title: ${item.colaborator_title}\n`;
  promptText += `    colaborator_description: ${item.colaborator_description}\n`;
  promptText += `    location_id: ${item.location_id}\n`;
  promptText += `    location_address: ${item.location_address}\n`;
  promptText += `    location_parking: ${item.location_parking}\n`;
  promptText += `    location_phone: ${item.location_phone}\n\n`;
});

// Retornar para próximo nó
// IMPORTANTE: Adicionar pairedItem para manter vínculo com itens de entrada
// Como estamos agregando TODOS os itens em UM único output,
// vinculamos a todos os itens de entrada
return [
  {
    json: {
      combinations: formatted,
      formattedForPrompt: promptText,
      totalOptions: formatted.length,
    },
    pairedItem: combinations.map((_, index) => index),
  },
];
