import { Dimensao, Entity, myNlpManager } from "./nlp-manager";

import { NlpManager } from "node-nlp";

import moment, { Moment } from "moment";

import * as fs from "fs/promises";
import SearchEngine from "./search-engine";
import Utils from "../utils/utils";
import { htmlGenerator } from "./html-generator";
import wppConnectBot from "./wppconnect-bot.lib";

const MergeBase64 = require("merge-base64");

class Messenger {
  private nlp: NlpManager = myNlpManager;

  private htmlGenerator;
  private client;

  constructor({ htmlGenerator, botClient }) {
    this.htmlGenerator = htmlGenerator;
    this.client = botClient;
  }

  async process(
    msgAgendada: boolean,
    body: string,
    author: string,
    chatOrGroupId: string,
    notifyName: string,
    messageId: string
  ): Promise<{
    text: string;
  }> {
    // TODO: dare un occhio a questa cosa
    // if (!this.trained) {
    //   await this.trainNlp();
    // }

    let response = {
      answer: "",
      actions: [],
      entities: [],
    };
    try {
      body = (body || "").toLocaleLowerCase();

      if (!body) {
        return {
          text: "Não consegui entender o que foi enviado 😢",
        };
      }

      response = await this.nlp.process("pt", body);

      let entities: Entity[] = (await this.nlp.extractEntities("pt", body))
        .entities;
      let acao = entities.find((e) => e.entity == "acao");

      // if (acao) {
      //   response.answer = await this[acao.option](
      //     msgAgendada,
      //     author || chatOrGroupId,
      //     body,
      //     chatOrGroupId,
      //     entities,
      //     messageId
      //   );
      // } else {
      //   if (response.actions.length) {
      //     response.answer = await this[response.actions[0].action](
      //       msgAgendada,
      //       author || chatOrGroupId,
      //       body,
      //       chatOrGroupId,
      //       response.entities,
      //       entities,
      //       messageId
      //     );
      //   }
      // }

      if (!response.answer) {
        response.answer =
          "Essa não é a minha especialidade 😢, mas essa informação pode ser útil. \n\n" +
          SearchEngine.buscar(body);
      }
    } catch (e) {
      console.error(e);
      // if (cliente) {
      //   response.answer = e.message;
      // }
      // if (msgAgendada == true) {
      //   throw e;
      // }
    }

    if (response.answer == "-1") return { text: "" };

    return {
      text: response.answer,
    };
  }

  async procAjuda(chatOrGroupId: string): Promise<string> {
    await this.client.sendInteractiveMessage(chatOrGroupId, {
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
    msgAgendada: boolean,
    cliente: {
      nome: string;
      parqueAtual: {
        estab: number;
        estab_nome: string;
      };
    },
    author: string,
    body: string,
    chatOrGroupId: string,
    contextEntities: Entity[],
    entities: Entity[],
    messageId: string
  ): Promise<string> {
    let dates = this.extractDates(entities);

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
      //todo passado futuro
      mensagem += `${Utils.formatDate(dates.dataIni)} `;
    }
    ("");
    mensagem += "\n";

    mensagem += `Espero que gostem! 🤓`;

    return mensagem;
  }

  async procPDF(
    msgAgendada: boolean,
    cliente: {
      nome: string;
      parque_atual: {
        estab: number;
        estab_nome: string;
      };
      parqueAtual: {
        estab: number;
        estab_nome: string;
      };
    },
    author: string,
    body: string,
    chatOrGroupId: string,
    contextEntities: Entity[],
    entities: Entity[],
    messageId: string
  ): Promise<string> {
    try {
      let dates = this.extractDates(entities);

      // TODO: fazer pelo accuracy
      if (msgAgendada !== true) {
        await this.client.sendMessage(
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
      let properties = {
        title: rel.nome,
        start_date: dates.dataIni.format("DD/MM/YYYY"),
        end_date: dates.dataFim.format("DD/MM/YYYY"),
        usuario: cliente.nome,
        estab_id: cliente.parqueAtual.estab.toString(),
        estab_name: cliente.parqueAtual.estab_nome,
        width: rel.largura + "px",
        data: `${moment().format("HH:mm - DD/MM/YYYY")}`,
      };
      for (let [key, val] of Object.entries(properties)) {
        html = html.replaceAll(`{{${key}}}`, val);
      }

      const params = {
        start_date: dates.dataIni.format("DD/MM/YYYY"),
        end_date: dates.dataFim.format("DD/MM/YYYY"),
        estab_id: cliente.parque_atual.estab.toString(),
        estab_name: cliente.parque_atual.estab_nome,
      };

      const relBase64 = await this.htmlGenerator.toUrlorHTML({
        width: rel.largura,
        height: rel.altura,
        url: rel.link + "?params=" + encodeURIComponent(JSON.stringify(params)),
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
      throw new Error("Falha ao processar o relatório: " + e.message + "\n");
    }
  }

  private extractDates(entities: Entity[]): {
    dataIni: Moment;
    dataFim: Moment;
    dica: string;
  } {
    let dataIni: Moment = moment().utc(false);
    let dataFim: Moment = moment().utc(false);
    let indexData = entities.findIndex((e) => e.entity == "data");
    let indexAge = entities.findIndex((e) => e.entity == "age");
    let indexPF = entities.findIndex((e) => e.entity == "passado_futuro");
    let entitiesDate = entities.filter((e) => e.entity == "date");

    let dica: string;

    if (indexAge >= 0) {
      let PF = "futuro";
      let value = entities[indexAge].resolution.value;
      if (indexPF >= 0) {
        PF = entities[indexPF].option;
      }
      let vData: Moment;
      if (PF == "passado") {
        vData = dataIni;
        value = -(value - 1);
      } else {
        dataIni.add(1, "day");
        vData = dataFim;
      }

      // @ts-ignore
      vData.add(value, entities[indexAge].resolution.unit);
    } else if (indexData >= 0) {
      if (entities[indexData].option == "ontem") {
        dataFim.add(-1, "day");
        dataIni.add(-1, "day");
      }
      if (entities[indexData].option == "amanha") {
        dataFim.add(1, "day");
        dataIni.add(1, "day");
      }

      if (entities[indexData].option == "ultimo_mes") {
        dataFim.add(-1, "month").endOf("month");
        dataIni.add(-1, "month").startOf("month");
      }
      if (entities[indexData].option == "proximo_mes") {
        dataFim.add(1, "month").endOf("month");
        dataIni.add(1, "month").startOf("month");
      }
      if (entities[indexData].option == "esse_mes") {
        dataFim.endOf("month");
        dataIni.startOf("month");
      }
    } else if (entitiesDate.length) {
      if (entitiesDate[0].resolution["strPastValue"]) {
        dataIni = moment(entitiesDate[0].resolution["strPastValue"]).utc(false);
      } else {
        dataIni = moment(entitiesDate[0].sourceText, "DD/MM/YYYY").utc(false);
      }
      if (entitiesDate.length >= 2) {
        if (entitiesDate[1].resolution["strPastValue"]) {
          dataFim = moment(entitiesDate[1].resolution["strPastValue"]).utc(
            false
          );
        } else {
          dataFim = moment(entitiesDate[1].sourceText, "DD/MM/YYYY").utc(false);
        }
      } else {
        dataFim = dataIni;
      }
      if (entitiesDate.length == 1) {
        if (
          dataIni.isSame(moment().utc(false).add(-1, "day"), "day") ||
          dataIni.isSame(moment().utc(false).add(1, "day"), "day")
        ) {
          dica =
            'Você pode digitar datas resumidas como "ontem" "hoje" "amanhã" "esse mes" "mês atual" "próximo mês" "mês passado" "último mês"';
        }
      }
    }

    return {
      dataIni: dataIni,
      dataFim: dataFim,
      dica: dica,
    };
  }

  //   private extractDimensions(entities: Entity[]): Dimensao[] {
  //     let entitiesDimensions = entities.filter((e) => e.entity == "dimensao");

  //     let result: Dimensao[] = [];
  //     entitiesDimensions.forEach((e) =>
  //       result.push(dimensions.find((el) => el.id == e.option))
  //     );
  //     return result;
  //   }
}

const messenger = new Messenger({
  htmlGenerator: htmlGenerator,
  botClient: wppConnectBot,
});

export default messenger;
