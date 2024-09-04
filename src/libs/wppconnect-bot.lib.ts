import { Whatsapp, Message, Contact } from "@wppconnect-team/wppconnect";
import * as wppconnect from "@wppconnect-team/wppconnect";
import { ListMessageOptions } from "@wppconnect/wa-js";

class WppConnectBot {
  private _client: Whatsapp | null = null;
  private base64Qr: string = "";
  private attempts: number = 0;

  get client(): Whatsapp | null {
    return this._client;
  }

  public async createClient(): Promise<Whatsapp> {
    console.log("WppConnectBot.createClient(): Creating client...");

    try {
      this._client = await wppconnect.create({
        session: "bot-atendimento",
        puppeteerOptions: this.getPuppeteerOptions(),
        useChrome: true,
        autoClose: 300_000,
        whatsappVersion: process.env.BOT_WPP_CONNECT_WPP_V,
        catchQR: (qrCode, asciiQR, attempt) => {
          this.base64Qr = qrCode;
          this.attempts = attempt;
        },
      });

      console.log("WppConnectBot.createClient(): Client created!");

      return this._client;
    } catch (error) {
      console.error(`WppConnectBot.createClient(): Error:`, error);
      process.exit(1);
    }
  }

  private getPuppeteerOptions() {
    return {
      handleSIGINT: process.env?.ENV !== "dev",
      handleSIGTERM: process.env?.ENV !== "dev",
      headless: process.env.BOT_HEADLESS === "true",
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
    };
  }

  public async shutdownProcess(): Promise<void> {
    await this._client?.close();
  }

  public async getStatus(): Promise<{
    base64Qr: string;
    attempts: number;
    connectionState: "CONNECTED" | "DISCONNECTED";
  }> {
    const connectionState = await this._client?.getConnectionState();

    console.log({ connectionState });

    return {
      base64Qr: this.base64Qr,
      attempts: this.attempts,
      connectionState:
        connectionState === "CONNECTED" ? "CONNECTED" : "DISCONNECTED",
    };
  }

  public async isDisconnected(): Promise<boolean> {
    const { connectionState } = await this.getStatus();
    return connectionState === "DISCONNECTED";
  }

  public async sendMessage(
    chatOrGroupId: string,
    message: string,
    quotedMsg?: string,
    continueTyping: boolean = false
  ): Promise<void> {
    this.ensureConnected();
    await this._client.sendText(chatOrGroupId, message, { quotedMsg });
    if (continueTyping) {
      setTimeout(() => {
        this.startTyping(chatOrGroupId).catch(console.error);
      }, 500);
    }
  }

  public startTyping(chatOrGroupId: string): Promise<void> {
    return this._client.startTyping(chatOrGroupId).catch(console.error);
  }

  public stopTyping(chatOrGroupId: string): Promise<void> {
    return this._client.stopTyping(chatOrGroupId).catch(console.error);
  }

  public async sendInteractiveMessage(
    to: string,
    listMessageOptions: ListMessageOptions
  ): Promise<void> {
    this.ensureConnected();
    await this._client!.sendListMessage(to, listMessageOptions);
  }

  public async sendFileFromBase64(
    to: string,
    message: string,
    base64File: string,
    fileName: string
  ): Promise<void> {
    this.ensureConnected();
    await this._client!.sendFile(to, base64File, {
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
  ): Promise<void> {
    this.ensureConnected();
    await this._client!.sendImageFromBase64(
      to,
      base64File,
      fileName,
      message,
      quotedMsg
    );
  }

  public async checkChatExists(chatOrGroupId: string): Promise<string> {
    this.ensureConnected();
    const details = await this._client!.getContact(chatOrGroupId);
    if (!details) throw new Error(`Number ${chatOrGroupId} does not exist`);
    return details.id;
  }

  public async getGrupos(telefone?: string): Promise<any[]> {
    this.ensureConnected();
    const details = await this._client!.listChats({ onlyGroups: true });
    if (!telefone) return details;
    if (telefone === "") return [];

    const normalizedNumbers = this.normalizePhoneNumbers(telefone);
    return details.filter((grupo) =>
      grupo.groupMetadata.participants.some((contact: Contact) =>
        normalizedNumbers.some((tel) => contact.id.includes(tel))
      )
    );
  }

  private normalizePhoneNumbers(phoneNumbers: string): string[] {
    return phoneNumbers.split(",").flatMap((tel) => {
      if (tel.includes("@g.us")) return [tel];
      tel = tel.replace("@c.us", "").replace(/\D/g, "");
      if (!tel.startsWith("+")) tel = "+" + tel;
      const normalized =
        tel.length <= 12
          ? tel.slice(0, 5) + "9" + tel.slice(5)
          : tel.slice(0, 5) + tel.slice(6);
      return [tel, normalized];
    });
  }

  private async ensureConnected(): Promise<void> {
    if (await this.isDisconnected()) {
      throw new Error("WhatsApp is not connected.");
    }
  }
}

export default new WppConnectBot();
