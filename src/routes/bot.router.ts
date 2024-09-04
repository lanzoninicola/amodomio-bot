import { Router } from "express";
import express from "express";

import { Request } from "express";
import botController from "../controllers/bot.controller";

const router = express.Router();

export class BotRouter {
  constructor() {
    router.get("/status", async (req: Request, res, next) => {
      // this renders a page with the current status

      try {
        let text = "";

        res.set("Content-Type", "text/html");

        let responseWppConnect = await botController.getStatus();
        let imgQrCodeWppConnect = `<img src="${responseWppConnect.base64Qr}" alt="">`;
        responseWppConnect.base64Qr = undefined;
        text +=
          "<h1> WppConnect </h1>" +
          imgQrCodeWppConnect +
          "<br><br><br>" +
          JSON.stringify(responseWppConnect);

        res.status(200).send(text);
      } catch (err) {
        next(err);
      }
    });

    router.get("/webhook", async (req: Request, res, next) => {
      try {
        let query = req.query;
        if (query["hub.verify_token"] !== "abc123") {
          throw new Error("invalid request");
        }
        res.status(200).send(query["hub.challenge"]);
      } catch (err) {
        next(err);
      }
    });

    router.get("/test", async (req: Request, res, next) => {
      try {
        let r = await botController.test();
        res.send(r);
      } catch (err) {
        next(err);
      }
    });

    router.post("/sendFile", async (req: Request, res, next) => {
      try {
        let response = await botController.sendFile(
          req.body.to,
          req.body.message,
          req.body.base64file,
          req.body.filename
        );
        res.status(200).json(response);
      } catch (err) {
        next(err);
      }
    });

    router.post("/sendMessage", async (req: Request, res, next) => {
      try {
        let response = await botController.sendMessage(
          req.body.to,
          req.body.message,
          undefined,
          false
        );
        res.status(200).json(response);
      } catch (err) {
        next(err);
      }
    });

    // TODO: Mover para um roteador e controller de grupo dedicado
    // TODO: code it
    // router.get("/grupos", async (req: Request, res, next) => {
    //   try {
    //     let r = await botController.getGrupos(user);
    //     res.send(r);
    //   } catch (err) {
    //     next(err);
    //   }
    // });
  }

  getRouter(): Router {
    return router;
  }
}
