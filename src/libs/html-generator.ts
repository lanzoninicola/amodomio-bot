import puppeteer, { Browser } from "puppeteer";

export type RenderPageOptions =
  | {
      htmlContent: string;
      width: number;
      height: number;
    }
  | {
      url: string;
      width: number;
      height: number;
    };

class HtmlGenerator {
  private browser: Browser;

  public async toUrlorHTML(opts: RenderPageOptions): Promise<string> {
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          channel: "chrome",
          handleSIGTERM: process.env?.ENV != "dev",
          handleSIGINT: process.env?.ENV != "dev",
          headless: process.env.BOT_HEADLESS == "true" ? true : "shell",
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
          timeout: 60_000,
        });
      }
      const page = await this.browser.newPage();
      try {
        await page.setViewport({
          width: opts.width,
          height: opts.height,
        });

        if ("htmlContent" in opts) {
          await page.setContent(opts.htmlContent, {
            waitUntil: "networkidle0",
            timeout: 60_000,
          });
          await page.waitForNetworkIdle({ idleTime: 1_000, timeout: 60_000 });
        } else if (opts.url) {
          await page.goto(opts.url, {
            waitUntil: "networkidle0",
            timeout: 60_000,
          });

          let str = await page.content();
          if (
            str.toLocaleLowerCase().indexOf("não foi possível conectar") >= 0
          ) {
            throw new Error(
              "O Looker Studio não conseguiu conectar em alguma fonte de dados.\nVerifique a conexão com o Banco de Dados."
            );
          }
          if (
            str.toLocaleLowerCase().indexOf("não foi possível carregar") >= 0
          ) {
            throw new Error(
              "O Looker Studio não conseguiu carregar alguma fonte de dados.\nVerifique as permissões da Fonte de Dados."
            );
          }
          if (str.toLocaleLowerCase().indexOf("não está disponível") >= 0) {
            throw new Error("O Looker Studio não está disponível no momento.");
          }
        }

        const screenshot = await page.screenshot({
          encoding: "base64",
          type: "png",
        });

        return screenshot;
      } finally {
        await page.close();
      }
    } catch (e) {
      throw new Error("Falha ao realizar o render: " + e.message + "\n");
    }
  }
}

export const htmlGenerator = new HtmlGenerator();
