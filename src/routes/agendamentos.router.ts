import express, { Router, Request } from "express";

import AgendamentosController from "../controllers/bot-agendamentos.controller";

const router = express.Router();

export class AgendamentosRouter {
  constructor() {
    router.get("/", async (req: Request, res, next) => {
      try {
        let r = await AgendamentosController.getAgendamentos("user");
        res.send(r);
      } catch (err) {
        next(err);
      }
    });

    router.get("/:sequencia", async (req: Request, res, next) => {
      try {
        let r = await AgendamentosController.getAgendamentoById("id");
        res.send(r);
      } catch (err) {
        next(err);
      }
    });

    router.post("/", async (req: Request, res, next) => {
      try {
        let r = await AgendamentosController.saveAgendamento(
          "db, req.body, req.user"
        );
        res.send(r);
      } catch (err) {
        next(err);
      }
    });

    router.delete("/:sequencia", async (req: Request, res, next) => {
      try {
        let r = await AgendamentosController.deleteAgendamento(
          "db, req.params['sequencia'], req.user"
        );
        res.send(r);
      } catch (err) {
        next(err);
      }
    });

    router.post("/testar", async (req: Request, res, next) => {
      try {
        let r = await AgendamentosController.testarAgendamento(req.body);
        res.send(r);
      } catch (err) {
        next(err);
      }
    });
  }

  getRouter(): Router {
    return router;
  }
}
