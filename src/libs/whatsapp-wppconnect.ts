import { Whatsapp, Message } from "@wppconnect-team/wppconnect";
import * as wppconnect from "@wppconnect-team/wppconnect";
import path from "path";

import * as fs from "fs";
// @ts-ignore
import { ListMessageOptions } from "@wppconnect/wa-js/dist/chat";
import botController from "../controllers/bot.controller";

class WhatsappWppConnect {
  private mensagensProcessando = 0;
  private wppConnectClient: Whatsapp;
  private base64Qr: string;
  private attempts: number;

  constructor() {
    // const lockFile = path.normalize("./tokens/bot-visitacao/SingletonLock");
    // try {
    //   fs.unlinkSync(lockFile);
    //   console.log("unlink lockFile", lockFile);
    // } catch (e) {}

    wppconnect
      .create({
        // tokenStore: myTokenStore,
        session: "bot-atendimento",
        puppeteerOptions: {
          handleSIGINT: process.env?.ENV !== "dev", // em dev tem que fechar o chrome
          handleSIGTERM: process.env?.ENV != "dev", // em dev tem que fechar o chrome
          headless: process.env.BOT_HEADLESS == "true",
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--no-zygote",
            "--disable-background-networking",
            "--disable-default-apps",
            "--disable-extensions",
            "--disable-sync",
            "--disable-translate",
            "--hide-scrollbars",
            "--metrics-recording-only",
            "--mute-audio",
            "--no-first-run",
            "--disable-features=LeakyPeeker",
          ],
        },
        useChrome: true,
        autoClose: 300_000,
        whatsappVersion: process.env.BOT_WPP_CONNECT_WPP_V || undefined,
        catchQR: (qrCode, asciiQR, attempt, urlCode) => {
          this.base64Qr = qrCode;
          this.attempts = attempt;
        },
      })
      .then((client: Whatsapp) => {
        this.wppConnectClient = client;

        this.wppConnectClient.onMessage(async (message: Message) => {
          console.log("++++++++++++++++++++++++++++++++++=");
          console.log({ message });

          if (process.env.BOT_DEBUG == "true") {
            if ((message.author || message.from) !== "554691052049@c.us") {
              return;
            }
          }

          this.mensagensProcessando += 1;

          // sem await mesmo
          this.wppConnectClient.startTyping(message.from).then().catch();

          try {
            if (message["listResponse"]?.singleSelectReply) {
              message.body =
                message["listResponse"].singleSelectReply.selectedRowId;
            }

            // TODO: to implement
            // speech to text era uma ferramenta no google cloud de limb
            /**
            if (["audio"].includes(message.type)) {
              let mediaBase64 = await this.wppConnectClient.downloadMedia(
                message
              );
              await this.sendMessage(
                message.from,
                await speechToText.translate(mediaBase64),
                message.quotedMsgId,
                false
              );
              return;
            }
               */

            // converter audio em texto e processar
            // speech to text era uma ferramenta no google cloud de limb

            // if (["ptt"].includes(message.type)) {
            //   let mediaBase64 = await this.wppConnectClient.downloadMedia(
            //     message
            //   );
            //   message.body = await speechToText.translate(mediaBase64);
            // }

            if (message.body.toLowerCase() === "debug") {
              await this.sendMessage(
                message.from,
                JSON.stringify(message, undefined, " "),
                message.quotedMsgId,
                false
              );
              return;
            }

            await botController.onMessageGlobal(message, false);
          } catch (e) {
            console.log(e);
          } finally {
            this.mensagensProcessando -= 1;
            this.wppConnectClient.stopTyping(message.from).then().catch();
          }
        });
      })
      .catch((erro) => {
        console.log(`wppconnect.create error:` + erro);
        process.exit(129);
      });
  }

  public async start() {
    await this.wppConnectClient.start();
  }

  public async shutdownProcess() {
    while (this.mensagensProcessando > 0) {
      console.info(`mensagens processando: ${this.mensagensProcessando}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    console.log("close A");
    if (this.wppConnectClient) {
      await module.exports.wppConnectClient.close();
    }
    console.log("close B");
    if (this.wppConnectClient) {
      await module.exports.wppConnectClient.close();
    }
  }

  async getStatus() {
    return {
      base64Qr: this.base64Qr,
      attemps: this.attempts,
      client:
        this.wppConnectClient &&
        (await this.wppConnectClient.getConnectionState()),
    };
  }

  public async sendMessage(
    chatOrGroupId: string,
    message: string,
    quotedMsg: string,
    continueTyping: boolean
  ) {
    let status = await this.getStatus();
    if (!status.client) {
      throw new Error("wpp não conectado.");
    }
    await this.wppConnectClient.sendText(chatOrGroupId, message, {
      quotedMsg: quotedMsg,
    });

    if (continueTyping) {
      setTimeout(() => {
        this.wppConnectClient.startTyping(chatOrGroupId).then().catch();
      }, 500);
    }
  }

  async sendInteractiveMessage(
    to: string,
    listMessageOptions: ListMessageOptions
  ) {
    let status = await this.getStatus();
    if (!status.client) {
      throw new Error("wpp não conectado.");
    }
    await this.wppConnectClient.sendListMessage(to, listMessageOptions);
  }

  public async sendFileFromBase64(
    to: string,
    message: string,
    base64File: string,
    fileName: string
  ) {
    let status = await this.getStatus();
    if (!status.client) {
      throw new Error("wpp não conectado.");
    }
    await this.wppConnectClient.sendFile(to, base64File, {
      type: "document",
      filename: fileName,
      caption: message,
    });
  }

  public async sendImageFromBase64(
    to: string,
    message: string,
    base64File: string,
    fileName: string,
    quotedMsg?: string
  ) {
    let status = await this.getStatus();
    if (!status.client) {
      throw new Error("wpp não conectado.");
    }
    await this.wppConnectClient.sendImageFromBase64(
      to,
      base64File,
      fileName,
      message,
      quotedMsg
    );
  }

  public async checkChatExists(chatOrGroupId: string) {
    let status = await this.getStatus();
    if (!status.client) {
      throw new Error("wpp não conectado.");
    }

    let details = await this.wppConnectClient.getContact(chatOrGroupId);

    if (!details) throw new Error(`Number ${chatOrGroupId} does not exist`);
    return details.id;
  }

  public async getGrupos(telefone?: string) {
    let status = await this.getStatus();
    if (!status.client) {
      throw new Error("wpp não conectado.");
    }

    let details = await this.wppConnectClient.listChats({ onlyGroups: true });

    if (telefone == null) return details;
    if (telefone == "") return [];

    let telefones = telefone.split(",");
    let telefones2 = [];

    for (let tel of telefones) {
      let telefone2 = tel;
      if (!tel.includes("@g.us")) {
        if (!tel.startsWith("+")) {
          tel = "+" + tel;
        }
        tel = tel.replace("@c.us", "");
        tel = tel.replace(/\D/g, "");
        if (tel.length <= 12) {
          telefone2 = tel.substring(0, 5) + "9" + tel.substring(5, 20);
        } else if (tel.length === 13) {
          telefone2 = tel.substring(0, 5) + tel.substring(6);
        }
      }
      telefones2.push(telefone2);
    }

    telefones.push(...telefones2);

    return details.filter((grupo) => {
      return grupo.groupMetadata.participants.some(
        (contact: wppconnect.Contact) =>
          telefones.some((tel) => contact.id.includes(tel))
      );
    });
  }
}

const whatsappWppConnect = new WhatsappWppConnect();

export default whatsappWppConnect;
