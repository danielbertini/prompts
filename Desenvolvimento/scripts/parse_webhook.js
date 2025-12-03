// ========================================
// EXTRAÇÃO E NORMALIZAÇÃO DE MENSAGENS
// Evolution API + WhatsApp via n8n
// ========================================

// Extrai o remoteJid correto priorizando o formato @s.whatsapp.net
// A Evolution API pode enviar em remoteJid ou remoteJidAlt dependendo do addressingMode
function getValidRemoteJid(key) {
  if (key.remoteJid && key.remoteJid.endsWith("@s.whatsapp.net")) {
    return key.remoteJid;
  }
  if (key.remoteJidAlt && key.remoteJidAlt.endsWith("@s.whatsapp.net")) {
    return key.remoteJidAlt;
  }
  return key.remoteJid;
}

function processMessage(inputData) {
  const data = inputData.body.data;
  const message = data.message;
  const key = data.key;

  // Objeto de resposta padronizado
  const result = {
    // Tipo da mensagem
    messageType: null,

    // Conteúdo principal extraído
    content: null,

    // Metadados importantes
    metadata: {
      remoteJid: getValidRemoteJid(key),
      fromMe: key.fromMe,
      messageId: key.id,
      pushName: data.pushName,
      timestamp: data.messageTimestamp,
      status: data.status,
      instance: inputData.body.instance,
      source: data.source,
    },

    // Dados adicionais específicos por tipo
    additionalData: {},

    // Flag para mensagens efêmeras
    isEphemeral: false,

    // Mensagem original completa (para debug)
    rawMessage: message,
  };

  // ========================================
  // VERIFICAR SE É MENSAGEM EFÊMERA
  // ========================================
  let messageToProcess = message;

  if (message.ephemeralMessage?.message) {
    result.isEphemeral = true;
    messageToProcess = message.ephemeralMessage.message;
    result.additionalData.expirationTime =
      message.ephemeralMessage.message?.contextInfo?.expiration || 0;
  }

  // ========================================
  // 1. MENSAGENS DE TEXTO
  // ========================================

  // Texto simples
  if (messageToProcess.conversation) {
    result.messageType = "text";
    result.content = messageToProcess.conversation;
    return result;
  }

  // Texto estendido (com contexto, reply, link preview)
  if (messageToProcess.extendedTextMessage) {
    result.messageType = "text_extended";
    result.content = messageToProcess.extendedTextMessage.text;

    // Dados do contexto (reply, menção, etc)
    if (messageToProcess.extendedTextMessage.contextInfo) {
      const ctx = messageToProcess.extendedTextMessage.contextInfo;
      result.additionalData.contextInfo = {
        quotedMessage: ctx.quotedMessage || null,
        mentionedJid: ctx.mentionedJid || [],
        isForwarded: ctx.isForwarded || false,
      };
    }
    return result;
  }

  // ========================================
  // 2. MENSAGENS DE MÍDIA
  // ========================================

  // Imagem
  if (messageToProcess.imageMessage) {
    result.messageType = "image";
    result.content =
      messageToProcess.imageMessage.caption || "[Imagem sem legenda]";
    result.additionalData = {
      mimetype: messageToProcess.imageMessage.mimetype,
      url: messageToProcess.imageMessage.url,
      mediaKey: messageToProcess.imageMessage.mediaKey,
      fileLength: messageToProcess.imageMessage.fileLength,
    };
    return result;
  }

  // Vídeo
  if (messageToProcess.videoMessage) {
    result.messageType = "video";
    result.content =
      messageToProcess.videoMessage.caption || "[Vídeo sem legenda]";
    result.additionalData = {
      mimetype: messageToProcess.videoMessage.mimetype,
      url: messageToProcess.videoMessage.url,
      mediaKey: messageToProcess.videoMessage.mediaKey,
      fileLength: messageToProcess.videoMessage.fileLength,
      seconds: messageToProcess.videoMessage.seconds,
    };
    return result;
  }

  // Áudio
  if (messageToProcess.audioMessage) {
    result.messageType = "audio";
    result.content = "[Mensagem de áudio]";
    result.additionalData = {
      mimetype: messageToProcess.audioMessage.mimetype,
      url: messageToProcess.audioMessage.url,
      mediaKey: messageToProcess.audioMessage.mediaKey,
      fileLength: messageToProcess.audioMessage.fileLength,
      seconds: messageToProcess.audioMessage.seconds,
      ptt: messageToProcess.audioMessage.ptt || false, // Push to talk (áudio de voz)
    };
    return result;
  }

  // Documento
  if (messageToProcess.documentMessage) {
    result.messageType = "document";
    result.content = messageToProcess.documentMessage.caption || "[Documento]";
    result.additionalData = {
      fileName: messageToProcess.documentMessage.fileName,
      mimetype: messageToProcess.documentMessage.mimetype,
      url: messageToProcess.documentMessage.url,
      mediaKey: messageToProcess.documentMessage.mediaKey,
      fileLength: messageToProcess.documentMessage.fileLength,
      title: messageToProcess.documentMessage.title,
    };
    return result;
  }

  // Sticker
  if (messageToProcess.stickerMessage) {
    result.messageType = "sticker";
    result.content = "[Figurinha/Sticker]";
    result.additionalData = {
      mimetype: messageToProcess.stickerMessage.mimetype,
      url: messageToProcess.stickerMessage.url,
      mediaKey: messageToProcess.stickerMessage.mediaKey,
      isAnimated: messageToProcess.stickerMessage.isAnimated || false,
    };
    return result;
  }

  // ========================================
  // 3. MENSAGENS DE LOCALIZAÇÃO
  // ========================================

  if (messageToProcess.locationMessage) {
    result.messageType = "location";
    const lat = messageToProcess.locationMessage.degreesLatitude;
    const lng = messageToProcess.locationMessage.degreesLongitude;
    result.content = `Localização: ${lat}, ${lng}`;
    result.additionalData = {
      latitude: lat,
      longitude: lng,
      name: messageToProcess.locationMessage.name,
      address: messageToProcess.locationMessage.address,
    };
    return result;
  }

  // ========================================
  // 4. MENSAGENS DE CONTATO
  // ========================================

  if (messageToProcess.contactMessage) {
    result.messageType = "contact";
    result.content = `Contato: ${messageToProcess.contactMessage.displayName}`;
    result.additionalData = {
      displayName: messageToProcess.contactMessage.displayName,
      vcard: messageToProcess.contactMessage.vcard,
    };
    return result;
  }

  // Múltiplos contatos
  if (messageToProcess.contactsArrayMessage) {
    result.messageType = "contacts";
    result.content = `${messageToProcess.contactsArrayMessage.contacts.length} contatos compartilhados`;
    result.additionalData = {
      contacts: messageToProcess.contactsArrayMessage.contacts,
    };
    return result;
  }

  // ========================================
  // 5. REAÇÕES
  // ========================================

  if (messageToProcess.reactionMessage) {
    result.messageType = "reaction";
    result.content =
      messageToProcess.reactionMessage.text || "[Reação removida]";
    result.additionalData = {
      messageId: messageToProcess.reactionMessage.key.id,
      emoji: messageToProcess.reactionMessage.text,
    };
    return result;
  }

  // ========================================
  // 6. ENQUETES/POLLS
  // ========================================

  if (messageToProcess.pollCreationMessage) {
    result.messageType = "poll";
    result.content = messageToProcess.pollCreationMessage.name;
    result.additionalData = {
      pollName: messageToProcess.pollCreationMessage.name,
      options:
        messageToProcess.pollCreationMessage.options?.map(
          (opt) => opt.optionName
        ) || [],
      selectableOptionsCount:
        messageToProcess.pollCreationMessage.selectableOptionsCount,
    };
    return result;
  }

  // Resposta a enquete
  if (messageToProcess.pollUpdateMessage) {
    result.messageType = "poll_response";
    result.content = "[Resposta de enquete]";
    result.additionalData = {
      pollCreationMessageKey:
        messageToProcess.pollUpdateMessage.pollCreationMessageKey,
      vote: messageToProcess.pollUpdateMessage.vote,
    };
    return result;
  }

  // ========================================
  // 7. BOTÕES E LISTAS
  // ========================================

  // Mensagem com botões
  if (messageToProcess.buttonsMessage) {
    result.messageType = "buttons";
    result.content =
      messageToProcess.buttonsMessage.contentText || "[Mensagem com botões]";
    result.additionalData = {
      buttons:
        messageToProcess.buttonsMessage.buttons?.map((btn) => ({
          buttonId: btn.buttonId,
          buttonText: btn.buttonText?.displayText,
        })) || [],
    };
    return result;
  }

  // Resposta de botão
  if (messageToProcess.buttonsResponseMessage) {
    result.messageType = "button_response";
    result.content =
      messageToProcess.buttonsResponseMessage.selectedDisplayText;
    result.additionalData = {
      selectedButtonId:
        messageToProcess.buttonsResponseMessage.selectedButtonId,
    };
    return result;
  }

  // Mensagem com lista
  if (messageToProcess.listMessage) {
    result.messageType = "list";
    result.content =
      messageToProcess.listMessage.description || "[Mensagem com lista]";
    result.additionalData = {
      title: messageToProcess.listMessage.title,
      buttonText: messageToProcess.listMessage.buttonText,
      sections: messageToProcess.listMessage.sections,
    };
    return result;
  }

  // Resposta de lista
  if (messageToProcess.listResponseMessage) {
    result.messageType = "list_response";
    result.content = messageToProcess.listResponseMessage.title;
    result.additionalData = {
      selectedRowId:
        messageToProcess.listResponseMessage.singleSelectReply?.selectedRowId,
    };
    return result;
  }

  // ========================================
  // 8. CHAMADAS
  // ========================================

  if (messageToProcess.callMessage) {
    result.messageType = "call";
    result.content = "[Chamada de voz/vídeo]";
    result.additionalData = {
      callKey: messageToProcess.callMessage.callKey,
    };
    return result;
  }

  // ========================================
  // 9. MENSAGENS DE SISTEMA/PROTOCOLO
  // ========================================

  if (messageToProcess.protocolMessage) {
    result.messageType = "protocol";
    const type = messageToProcess.protocolMessage.type;

    switch (type) {
      case 0: // REVOKE (mensagem apagada)
        result.content = "[Mensagem apagada]";
        result.additionalData.action = "revoke";
        break;
      default:
        result.content = "[Mensagem de protocolo]";
        result.additionalData.protocolType = type;
    }
    return result;
  }

  // ========================================
  // 10. MENSAGEM DE PRODUTO/CATÁLOGO
  // ========================================

  if (messageToProcess.productMessage) {
    result.messageType = "product";
    result.content =
      messageToProcess.productMessage.product?.title || "[Produto]";
    result.additionalData = {
      productId: messageToProcess.productMessage.product?.productId,
      businessOwnerJid: messageToProcess.productMessage.businessOwnerJid,
    };
    return result;
  }

  // ========================================
  // 11. MENSAGEM DE TEMPLATE
  // ========================================

  if (messageToProcess.templateMessage) {
    result.messageType = "template";
    result.content = "[Mensagem template]";
    result.additionalData = {
      hydratedTemplate: messageToProcess.templateMessage.hydratedTemplate,
    };
    return result;
  }

  // ========================================
  // 12. LIVE LOCATION
  // ========================================

  if (messageToProcess.liveLocationMessage) {
    result.messageType = "live_location";
    const lat = messageToProcess.liveLocationMessage.degreesLatitude;
    const lng = messageToProcess.liveLocationMessage.degreesLongitude;
    result.content = `Localização ao vivo: ${lat}, ${lng}`;
    result.additionalData = {
      latitude: lat,
      longitude: lng,
      accuracyInMeters: messageToProcess.liveLocationMessage.accuracyInMeters,
      speedInMps: messageToProcess.liveLocationMessage.speedInMps,
      degreesClockwiseFromMagneticNorth:
        messageToProcess.liveLocationMessage.degreesClockwiseFromMagneticNorth,
    };
    return result;
  }

  // ========================================
  // TIPO DESCONHECIDO
  // ========================================

  result.messageType = "unknown";
  result.content = "[Tipo de mensagem não identificado]";
  result.additionalData.messageKeys = Object.keys(messageToProcess);

  return result;
}

// ========================================
// PROCESSAR TODOS OS ITENS
// ========================================

try {
  const items = $input.all();
  const processedItems = [];

  for (const item of items) {
    const processed = processMessage(item.json);

    // Mesclar resultado processado com item original
    processedItems.push({
      json: {
        ...item.json,
        processed: processed,
      },
    });
  }

  return processedItems;
} catch (error) {
  // Em caso de erro, retornar informação útil
  return [
    {
      json: {
        error: true,
        errorMessage: error.message,
        errorStack: error.stack,
        originalData: $input.all()[0]?.json,
      },
    },
  ];
}
