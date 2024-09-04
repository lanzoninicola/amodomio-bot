import { Message, Whatsapp } from "@wppconnect-team/wppconnect";
import { NlpManager } from "node-nlp";
import moment, { Moment } from "moment";
import * as fs from "fs/promises";

const MergeBase64 = require("merge-base64");

import { Entity, myNlpManager } from "../libs/nlp-manager";
import SearchEngine from "../libs/search-engine";
import Utils from "../utils/utils";
import { htmlGenerator } from "../libs/html-generator";
import wppConnectBot from "../libs/wppconnect-bot.lib";

interface Cliente {
  nome: string;
  parqueAtual: {
    estab: number;
    estab_nome: string;
  };
}

class Messenger {
  private nlp: NlpManager = myNlpManager;
  private messagesProcessing = 0;
  private htmlGenerator;
  private bot;
  private client: Whatsapp | null = null;

  private debug = false;

  private onMessageEvent;

  constructor({ htmlGenerator, bot }) {
    this.htmlGenerator = htmlGenerator;
    this.bot = bot;

    bot
      .createClient()
      .then((client: Whatsapp) => {
        this.client = client;

        client.onMessage(async (message: Message) => {
          if (message.type !== "chat") {
            return;
          }

          if (process.env.BOT_DEBUG == "true") {
            this.debug = true;
            console.log(message);
          }

          this.messagesProcessing += 1;

          // sem await mesmo
          this.client.startTyping(message.from).then().catch();

          try {
            if (message["listResponse"]?.singleSelectReply) {
              message.body =
                message["listResponse"].singleSelectReply.selectedRowId;
            }

            await this.processAndReplyMessage(message, false);
          } catch (e) {
            console.log(e);
          } finally {
            this.messagesProcessing -= 1;
            this.client.stopTyping(message.from).then().catch();
          }
        });
      })
      .catch((erro) => {
        console.log(`wppconnect.create error:` + erro);
        process.exit(129);
      });
  }

  async getStatus() {
    if (!this.client) {
      return {
        base64Qr: "",
        attempts: 0,
        connectionState: "DISCONNECTED",
      };
    }
    return await this.bot.getStatus();
  }

  public stopListeningMessages() {
    if (typeof this.onMessageEvent?.dispose !== "function") {
      console.error(
        "At the moment the bot is not listening to messages. So, nothing to stop."
      );
      return;
    }

    this.onMessageEvent.dispose();
  }

  public async processAndReplyMessage(
    message: Message,
    isScheduledMsg: boolean
  ) {
    if (this.debug === true) {
      console.log(
        `<--- FROM "${message.from}:${message.notifyName} -> ${message.body}`
      );
    }
    try {
      for (const msg of message.body.split("\n")) {
        const response = await this.processMessage(
          isScheduledMsg,
          msg,
          message.author,
          message.from,
          message.notifyName,
          message.id
        );

        const to = this.debug === true ? message.from : "554691052049";

        if (response?.text) {
          if (this.debug === true) {
            console.log(
              `---> RESPONSE: ${response.text} -> ${message.from} : ${message.author}(${message.notifyName})`
            );
          }

          if (!this.client) {
            console.error("No client defined. Please, check your code.");
            return;
          }

          await this.bot.sendMessage(to, response.text, message.id, false);
        }
      }
    } catch (e) {
      console.error(e);
      if (isScheduledMsg) {
        throw e;
      }
    }
  }

  public async shutdownProcess() {
    while (this.messagesProcessing > 0) {
      console.info(`Messages processing: ${this.messagesProcessing}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    await this.bot.shutdownProcess();
  }

  private async processMessage(
    isScheduledMsg: boolean,
    body: string,
    author: string,
    chatOrGroupId: string,
    notifyName: string,
    messageId: string
  ): Promise<{ text: string }> {
    body = (body || "").toLowerCase();

    if (!body) {
      return { text: "Não consegui entender o que foi enviado 😢" };
    }

    try {
      const response = await this.nlp.process("pt", body);
      const entities: Entity[] = (await this.nlp.extractEntities("pt", body))
        .entities;
      const action = entities.find((e) => e.entity === "acao");

      let answer = "";

      if (action) {
        answer = await this[action.option](
          isScheduledMsg,
          author || chatOrGroupId,
          body,
          chatOrGroupId,
          entities,
          messageId
        );
      } else if (response.actions.length) {
        answer = await this[response.actions[0].action](
          isScheduledMsg,
          author || chatOrGroupId,
          body,
          chatOrGroupId,
          response.entities,
          entities,
          messageId
        );
      }

      if (!answer) {
        const searchResults = await SearchEngine.buscar(body);

        answer = `Essa não é a minha especialidade 😢, mas essa informação pode ser útil. \n\n${searchResults}`;
      }

      return { text: answer === "-1" ? "" : answer };
    } catch (e) {
      console.error(e);
      return { text: isScheduledMsg ? "" : e.message };
    }
  }

  async procAjuda(chatOrGroupId: string): Promise<string> {
    await this.bot.sendInteractiveMessage(chatOrGroupId, {
      title: "Utilize o menu abaixo para encontrar ajuda",
      description:
        "Converse comigo para acompanhar seu público e suas vendas em tempo real!",
      buttonText: "Lista de Comandos",
      sections: [
        {
          title: "Escolha do Parque",
          rows: [
            {
              rowId: "meus parques",
              title: "🏞️ Lista de Parques",
              description: "Meus parques",
            },
            {
              rowId: "ver _nomedoparque_",
              title: "🎡 Escolher um Parque",
              description: "Ver _nomedoparque_",
            },
          ],
        },
        {
          title: "🎫 Visitação",
          rows: [
            {
              rowId: "visitas",
              title: "Para a data atual",
              description: "Como está a visitação?",
            },
          ],
        },
      ],
    });
    return "-1";
  }

  async procMensagemBomDia(
    isScheduledMsg: boolean,
    cliente: Cliente,
    author: string,
    body: string,
    chatOrGroupId: string,
    contextEntities: Entity[],
    entities: Entity[],
    messageId: string
  ): Promise<string> {
    const dates = this.extractDates(entities);
    let mensagem = `Olá, *${cliente.nome}*, aqui estão as informações de *${cliente.parqueAtual.estab_nome}* `;

    if (dates.dataIni.isSame(moment().utc(false).add(1, "days"), "day")) {
      mensagem += "amanhã é ";
    } else if (
      dates.dataIni.isSame(moment().utc(false).add(-1, "days"), "day")
    ) {
      mensagem += "ontem foi ";
    } else if (dates.dataIni.isSame(moment().utc(false), "day")) {
      mensagem += "hoje é ";
    } else {
      mensagem += `${Utils.formatDate(dates.dataIni)} `;
    }

    mensagem += "\nEspero que gostem! 🤓";

    return mensagem;
  }

  async procPDF(
    isScheduledMsg: boolean,
    cliente: Cliente,
    author: string,
    body: string,
    chatOrGroupId: string,
    contextEntities: Entity[],
    entities: Entity[],
    messageId: string
  ): Promise<string> {
    try {
      // const dates = this.extractDates(entities);

      if (!isScheduledMsg) {
        await this.bot.sendMessage(
          chatOrGroupId,
          "Claro! Estou buscando o painel com as informações solicitadas.",
          undefined,
          true
        );
      }

      const rel = {
        nome: "nome_relatorio",
        link: "link",
        largura: 800,
        altura: 500,
      };

      let html = await fs.readFile("templates/relatorio-header.html", {
        encoding: "utf-8",
      });
      const properties = {
        title: rel.nome,
        // start_date: dates.dataIni.format("DD/MM/YYYY"),
        // end_date: dates.dataFim.format("DD/MM/YYYY"),
        start_date: "01/01/2000",
        end_date: "01/01/2000",
        usuario: cliente.nome,
        estab_id: cliente.parqueAtual.estab.toString(),
        estab_name: cliente.parqueAtual.estab_nome,
        width: `${rel.largura}px`,
        data: moment().format("HH:mm - DD/MM/YYYY"),
      };

      for (const [key, val] of Object.entries(properties)) {
        html = html.replaceAll(`{{${key}}}`, val);
      }

      const params = {
        // start_date: dates.dataIni.format("DD/MM/YYYY"),
        // end_date: dates.dataFim.format("DD/MM/YYYY"),
        start_date: "01/01/2000",
        end_date: "01/01/2000",
        estab_id: cliente.parqueAtual.estab.toString(),
        estab_name: cliente.parqueAtual.estab_nome,
      };

      const relBase64 = await this.htmlGenerator.toUrlorHTML({
        width: rel.largura,
        height: rel.altura,
        url: `${rel.link}?params=${encodeURIComponent(JSON.stringify(params))}`,
      });

      const headerBase64 = await this.htmlGenerator.toUrlorHTML({
        width: rel.largura,
        height: 75,
        htmlContent: html,
      });

      const base64file = await MergeBase64([headerBase64, relBase64], {
        direction: true,
      });

      const message = `Aqui está o painel com as informações solicitadas.\nEspero que gostem! 🤓`;

      await this.client.sendImage(
        chatOrGroupId,
        message,
        base64file,
        "",
        messageId
      );
      return "-1";
    } catch (e) {
      throw new Error(`Falha ao processar o relatório: ${e.message}\n`);
    }
  }

  private extractDates(entities: Entity[]): {
    dataIni: Moment;
    dataFim: Moment;
    dica?: string;
  } {
    let dataIni: Moment = moment().utc(false);
    let dataFim: Moment = moment().utc(false);
    const indexData = entities.findIndex((e) => e.entity === "data");
    const indexAge = entities.findIndex((e) => e.entity === "age");
    const indexPF = entities.findIndex((e) => e.entity === "passado_futuro");
    const entitiesDate = entities.filter((e) => e.entity === "date");

    let dica: string | undefined;

    if (indexAge >= 0) {
      const PF = indexPF >= 0 ? entities[indexPF].option : "futuro";
      let value = entities[indexAge].resolution.value;

      if (PF === "passado") {
        value = -(value - 1);
      } else {
        dataIni.add(1, "day");
      }

      const vData = PF === "passado" ? dataIni : dataFim;
      vData.add(
        // value,
        "weeks",
        entities[indexAge].resolution.unit
      );
    } else if (indexData >= 0) {
      const option = entities[indexData].option;
      if (option === "ontem") {
        dataFim.add(-1, "day");
        dataIni.add(-1, "day");
      } else if (option === "amanha") {
        dataFim.add(1, "day");
        dataIni.add(1, "day");
      } else if (option === "ultimo_mes") {
        dataFim.add(-1, "month").endOf("month");
        dataIni.add(-1, "month").startOf("month");
      } else if (option === "proximo_mes") {
        dataFim.add(1, "month").endOf("month");
        dataIni.add(1, "month").startOf("month");
      } else if (option === "esse_mes") {
        dataFim.endOf("month");
        dataIni.startOf("month");
      }
    } else if (entitiesDate.length) {
      dataIni = moment(
        entitiesDate[0].resolution.strValue || entitiesDate[0].sourceText,
        "DD/MM/YYYY"
      ).utc(false);
      dataFim = entitiesDate[1]
        ? moment(
            entitiesDate[1].resolution.strValue || entitiesDate[1].sourceText,
            "DD/MM/YYYY"
          ).utc(false)
        : dataIni;

      if (
        entitiesDate.length === 1 &&
        (dataIni.isSame(moment().utc(false).add(-1, "day"), "day") ||
          dataIni.isSame(moment().utc(false).add(1, "day"), "day"))
      ) {
        dica =
          'Você pode digitar datas resumidas como "ontem" "hoje" "amanhã" "esse mes" "mês atual" "próximo mês" "mês passado" "último mês"';
      }
    }

    return { dataIni, dataFim, dica };
  }
}

export default new Messenger({
  htmlGenerator: htmlGenerator,
  bot: wppConnectBot,
});
