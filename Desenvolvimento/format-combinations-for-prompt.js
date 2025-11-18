// Função para formatar combinações disponíveis de forma otimizada para LLM
// Reduz tokens desnecessários e mantém apenas o essencial

function formatCombinationsForPrompt(combinations) {
  // Remover duplicatas e ordenar
  const formatted = combinations.map(item => {
    return {
      // IDs obrigatórios
      service_id: item.service_id,
      colaborator_id: item.colaborator_id,
      location_id: item.location_id,
      
      // Nomes (para matching)
      service_name: item.service_name,
      colaborator_name: item.colaborator_name,
      location_name: item.location_name,
      
      // Endereço formatado (simplificado)
      location_address: item.location_address?.formatted || 'Endereço não disponível',
      
      // Preço (simplificado)
      service_price: item.service_price_on_request 
        ? 'Sob consulta' 
        : (item.service_price_starting_from ? `A partir de R$ ${item.service_price}` : `R$ ${item.service_price}`)
    };
  });

  // Agrupar por serviço para facilitar busca
  const grouped = formatted.reduce((acc, item) => {
    if (!acc[item.service_name]) {
      acc[item.service_name] = [];
    }
    acc[item.service_name].push(item);
    return acc;
  }, {});

  // Criar formato legível e compacto
  let output = '';
  
  Object.keys(grouped).sort().forEach(serviceName => {
    output += `## ${serviceName}\n\n`;
    grouped[serviceName].forEach((option, index) => {
      output += `OPCAO ${index + 1}:\n`;
      output += `- Colaborador: ${option.colaborator_name}\n`;
      output += `- Unidade: ${option.location_name}\n`;
      output += `- Endereço: ${option.location_address}\n`;
      output += `- Preço: ${option.service_price}\n`;
      output += `- IDs: service=${option.service_id} | colab=${option.colaborator_id} | loc=${option.location_id}\n\n`;
    });
  });

  return output;
}

// Versão alternativa: Formato tabular ultra-compacto
function formatCombinationsCompact(combinations) {
  let output = 'SERVICO | COLABORADOR | UNIDADE | PRECO | SERVICE_ID | COLABORATOR_ID | LOCATION_ID\n';
  output += '-'.repeat(150) + '\n';
  
  combinations.forEach(item => {
    const price = item.service_price_on_request 
      ? 'Consulta' 
      : (item.service_price_starting_from ? `>${item.service_price}` : item.service_price);
      
    output += `${item.service_name} | ${item.colaborator_name} | ${item.location_name} | R$${price} | ${item.service_id} | ${item.colaborator_id} | ${item.location_id}\n`;
  });
  
  return output;
}

// Versão recomendada: Formato lista numerada
function formatCombinationsNumbered(combinations) {
  let output = '# OPCOES DISPONIVEIS\n\n';
  output += 'Use os UUIDs EXATAMENTE como aparecem abaixo:\n\n';
  
  combinations.forEach((item, index) => {
    output += `[${index + 1}] ${item.service_name} com ${item.colaborator_name} na ${item.location_name}\n`;
    output += `    service_id: ${item.service_id}\n`;
    output += `    colaborator_id: ${item.colaborator_id}\n`;
    output += `    location_id: ${item.location_id}\n`;
    output += `    endereco: ${item.location_address?.formatted || 'N/A'}\n`;
    output += `    preco: ${item.service_price_on_request ? 'Sob consulta' : 'R$ ' + item.service_price}\n\n`;
  });
  
  return output;
}

// Para usar no N8N:
// 1. No nó de código, após buscar da VIEW:
//    return formatCombinationsNumbered($input.all());
//
// 2. No prompt:
//    {{ $json.formattedCombinations }}

// Exemplo de saída formatada:
/*
# OPCOES DISPONIVEIS

Use os UUIDs EXATAMENTE como aparecem abaixo:

[1] Barbearia com Roger Lemos na Unidade Santana
    service_id: bd90809c-09e9-48b7-ac78-9e46ee0269ab
    colaborator_id: 54fa5c3d-75d2-40b4-9478-ad0bb90954f1
    location_id: 74f0f10b-0946-4a38-b9e0-bdf1a867cdce
    endereco: Rua Aviador Gil Guilherme, 116 - Santana, São Paulo - SP
    preco: R$ 70.00

[2] Manicure com Katia Fonseca na Unidade Santana
    service_id: 4d22a723-e82c-45ae-8a28-e06f90f201a5
    colaborator_id: 945656e7-a58e-405b-b52c-8a08e5acebce
    location_id: 74f0f10b-0946-4a38-b9e0-bdf1a867cdce
    endereco: Rua Aviador Gil Guilherme, 116 - Santana, São Paulo - SP
    preco: R$ 60.00
*/

module.exports = {
  formatCombinationsForPrompt,
  formatCombinationsCompact,
  formatCombinationsNumbered
};

