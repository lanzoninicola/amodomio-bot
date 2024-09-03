/**
 * E um banco de dados são salvas as informações do agendamentos
 * essa classe tem as regras de negócio
 */
/**
class BotAgendamento {
  async procAgendarMensagem(
    msgAgendada: boolean,
    cliente: Cliente,
    author: string,
    body: string,
    chatOrGroupId: string,
    contextEntities: Entity[],
    entities: Entity[],
    messageId: string
  ): Promise<string> {}

  async procAgendaLista(
    msgAgendada: boolean,
    cliente: Cliente,
    author: string,
    body: string,
    chatOrGroupId: string,
    contextEntities: Entity[],
    entities: Entity[],
    messageId: string
  ): Promise<string> {
    if (!MetodosEnvioArray.includes(metodoEnvio)) {
      throw new Error(`metodoEnvio "${metodoEnvio}" inválido` + "\n");
    }

    let db = await Firebird.attachPool(cliente.codigo, "procAgendaLista");
    try {
      const listaAgendamentos = await Db.getListaAgendamentos(
        db,
        cliente.codigo,
        chatOrGroupId
      );

      if (!listaAgendamentos.length)
        return `Você ainda não registrou nenhum agendamento`;

      let agendamentos = "";
      for (const ag of listaAgendamentos) {
        agendamentos += `${this.formatTime(moment(ag.horario))} - _${
          ag.estab_nome
        }_ \n -> ${ag.destinatario}\n -> *${ag.mensagem}*\n\n`;
      }
      return agendamentos;
    } finally {
      await db.detach();
    }
  }

  async procAgendaRemover(
    msgAgendada: boolean,
    metodoEnvio: MetodosEnvio,
    cliente: Cliente,
    author: string,
    body: string,
    chatOrGroupId: string,
    contextEntities: Entity[],
    entities: Entity[],
    messageId: string
  ): Promise<string> {
    if (!MetodosEnvioArray.includes(metodoEnvio)) {
      throw new Error(`metodoEnvio "${metodoEnvio}" inválido` + "\n");
    }

    const entitiesTime = entities.filter((e) => e.entity == "time");
    if (!entitiesTime.length)
      return "Você deve informar o comando completo \n Exemplo: *Remover agendamento 18:00*";

    let db = await Firebird.attachPool(cliente.codigo, "procAgendaRemover");
    try {
      const horario = entitiesTime[0].sourceText;
      const x = await Db.removerAgendamento(
        db,
        cliente.codigo,
        cliente.parqueAtual.estab,
        chatOrGroupId,
        horario
      );

      if (x["codigo"]) return `Agendamento removido com sucesso!`;

      return `Nenhum agendamento localizado para o Estabelecimento: ${cliente.parqueAtual.estab_nome} Horário: ${horario}!`;
    } finally {
      await db.detach();
    }
  }

  private async mensagensAgendadas() {
    let db = await Firebird.attachPool(1, "mensagensAgendadas");
    let agendamentos: getListaAgendamentosFields[];
    try {
      agendamentos = await Db.getListaAgendamentosExecutar(db);
    } finally {
      await db.detach();
    }

    for (const ag of agendamentos) {
      try {
        //@ts-ignore
        const msg: WppConnectMessage = {
          body: ag.mensagem,
          author: ag.agendador,
          from: ag.destinatario,
        };
        const cliente = await this.findCliente(ag.agendador);
        if (!cliente) {
          continue;
        }
        const parque = cliente.listaEstabs.find((e) => e.estab == ag.estab);
        if (!parque) {
          continue;
        }

        // atualizar contato para envio
        msg.from = await this.checkChatExists(ag.metodo_envio, msg.from);

        cliente.parqueAtual = parque;
        await this.onMessageGlobal(ag.metodo_envio, msg, true);

        // atualizar agendamento como enviado
        let db = await Firebird.attachPool(
          cliente.codigo,
          "mensagensAgendadas"
        );
        try {
          await Db.atualizaDataHoraExecucaoAgendamento(
            db,
            ag.codigo,
            ag.estab,
            ag.agendador,
            ag.destinatario,
            ag.horario
          );
        } finally {
          await db.detach();
        }
      } catch (err) {
        console.error(err);
      }
    }
  }
}
 */
