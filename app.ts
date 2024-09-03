import botController from "./src/controllers/bot.controller";
import {
  createExpressServer,
  createRoutes,
} from "./src/libs/express/express-factory";
import { Request, Response, NextFunction } from "express";
import { BotRouter } from "./src/routes/bot.router";

setTimeout(async () => {
  let status;
  do {
    status = await botController.getStatus();
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  } while (!status.client && !status.base64Qr);

  const { app } = createExpressServer({
    port: 19000,
    ip: undefined,
    minutesToRestart: 90,
  });

  app.shutdownScript = async () => {
    await botController.shutdownProcess();
  };

  const ROOT = "/api/bot";

  createRoutes([
    {
      path: `${ROOT}/whatsapp`,
      router: new BotRouter().getRouter(),
    },
    // TODO: feature request
    // {
    //   path: `${ROOT}/agendamento`,
    //   router: new AgendamentosRouter().getRouter(),
    // },
    {
      path: `${ROOT}/keepActive`,
      //@ts-ignore
      router: (req: Request, res: Response, next: NextFunction) => {
        setTimeout(() => {
          res.json("OK");
        }, Number(req.query.time) || 1000);
      },
    },
  ]);
}, 1);
