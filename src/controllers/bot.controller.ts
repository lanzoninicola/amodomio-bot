import messenger from "../domain/messenger";

class BotController {
  private mensagensProcessando = 0;

  private trained: boolean = false;

  private dataHoraUltimaAtualizacaoClientes: Date;

  private messenger;

  constructor({ messenger }) {
    this.messenger = messenger;
    // // 5 minutos
    // setInterval(async () => {
    //   try {
    //     this.mensagensProcessando += 1;
    //     console.log("Inicio da tarefa agendada ", new Date());
    //     await this.mensagensAgendadas();
    //     console.log("Fim da tarefa agendada ", new Date());
    //   } finally {
    //     this.mensagensProcessando -= 1;
    //   }
    // }, 5 * 60 * 1000);
  }

  async getStatus() {
    try {
      return await this.messenger.getStatus();
    } catch (error) {
      return {
        base64Qr: "",
        attempts: 0,
        connectionState: "DISCONNECTED",
      };
    }
  }

  async listen() {
    this.messenger.startListeningMessages();
  }

  async stop() {
    this.messenger.stopListeningMessages();
  }

  async test() {
    let messages = [
      "relatório resumo geral ontem",
      "visitas ontem",
      "teste previsao hoje",
      "visitas hoje",
      "teste previsao amanhã",
      "visitas amanhã",
      "teste previsao 29/03/2024",
    ];

    let responses = [];
    for (let message of messages) {
      // @ts-ignore
      let msg: Message = {};
      msg.body = message;
      msg.from = "5546991272525@c.us";

      let resposta = await this.messenger.processMessage(
        false,
        msg.body,
        msg.from,
        msg.from,
        null,
        null
      );

      responses.push({
        pergunta: message,
        resposta: resposta,
      });
    }

    return responses;
  }

  async sendMessage(
    chatOrGroupId: string,
    message: string,
    quotedMsg: string,
    continueTyping: boolean
  ) {
    try {
      await this.messenger.sendMessage(
        chatOrGroupId,
        message,
        quotedMsg,
        continueTyping
      );
    } catch (e) {
      throw new Error("falha ao enviar mensagem: " + e.message + "\n");
    }
  }

  async sendFile(
    to: string,
    message: string,
    base64File: string,
    fileName: string
  ) {
    try {
      await this.messenger.sendFileFromBase64(
        to,
        message,
        base64File,
        fileName
      );
    } catch (e) {
      throw new Error("falha ao enviar mensagem: " + JSON.stringify(e));
    }
  }

  async sendImage(
    to: string,
    message: string,
    base64File: string,
    fileName: string,
    quotedMsg?: string
  ) {
    try {
      await this.messenger.sendImageFromBase64(
        to,
        message,
        base64File,
        fileName,
        quotedMsg
      );
    } catch (e) {
      throw new Error("falha ao enviar mensagem: " + JSON.stringify(e) + "\n");
    }
  }

  async checkChatExists(chatOrGroupId: string) {
    try {
      return await this.messenger.checkChatExists(chatOrGroupId);
    } catch (e) {
      throw new Error("falha ao verificar se o chat existe: " + e + "\n");
    }
  }

  public async shutdownProcess() {
    this.messenger.shutdownProcess();
  }

  // async getGrupos(user: string) {
  //   let telefone: string | undefined = undefined;
  //   if (user.nivel > NivelUsuarioEnum.MASTER) {
  //     telefone =
  //       this.clientes.find((c) => c.codigo === user.codigo)?.telefone ?? "";
  //   }
  //   return (await this.messenger.getGrupos(telefone)).map((grupo) => ({
  //     wid: grupo.id._serialized,
  //     id: grupo.id.user,
  //     name: grupo.name,
  //     desc: grupo.groupMetadata.desc,
  //   }));
  // }

  // private async trainNlp() {
  //   let db = await Firebird.attachPool(1, "wpp-bot");
  //   try {
  //     this.todosEstabs = await Db.getListaTodosEstabs(db);
  //     for (let estab of this.todosEstabs) {
  //       let nomes = [];
  //       for (let str of estab.nome.split(" ")) {
  //         if (str.length <= 2) {
  //           continue;
  //         }
  //         nomes.push(str);
  //       }

  //       let nomes2 = [];
  //       for (let [i, nome] of nomes.entries()) {
  //         let nomec = nome;
  //         for (let x = i + 1; x < nomes.length; x++) {
  //           nomec += " " + nomes[x];
  //           nomes2.push(nomec.trimStart());
  //         }
  //       }
  //       nomes.push(...nomes2);
  //       this.nlp.addNamedEntityText("nome_parque", estab.codigo, ["pt"], nomes);
  //     }

  //     // adicionar relatórios que podem ser chamados
  //     this.todosRelatorios = await Db.getListaTodosRelatorios(db);
  //     for (let rel of this.todosRelatorios) {
  //       let nomes = [];
  //       for (let str of rel.nome.split(" ")) {
  //         if (str.length <= 2) {
  //           continue;
  //         }
  //         nomes.push(str);
  //       }

  //       let nomes2 = [];
  //       for (let [i, nome] of nomes.entries()) {
  //         let nomec = nome;
  //         for (let x = i + 1; x < nomes.length; x++) {
  //           nomec += " " + nomes[x];
  //           nomes2.push(nomec.trimStart());
  //         }
  //       }
  //       nomes.push(...nomes2);
  //       this.nlp.addNamedEntityText(
  //         "nome_relatorio",
  //         rel.codigo,
  //         ["pt"],
  //         nomes
  //       );
  //     }

  //     await this.nlp.train();
  //     this.trained = true;
  //   } finally {
  //     await db.detach();
  //   }
  // }
}

const botController = new BotController({
  messenger: messenger,
});

export default botController;
