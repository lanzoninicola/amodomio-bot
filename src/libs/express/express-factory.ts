import express, {
  Application,
  Express,
  NextFunction,
  Request,
  Response,
} from "express";
import compression from "compression";
import http, { Server } from "http";
import { AxiosError } from "axios";
import bodyParser from "body-parser";

const apicache = require("apicache-plus");
const Layer = require("express/lib/router/layer");

export interface Route {
  path: string;
  cacheTime?: string;
  router?: express.Router;
  middlewares?: any[];
}

interface MyExpress extends Express {
  shutdownScript?: Function;
}

let APP: MyExpress;
let SERVER: Server;

const cache = apicache.options({
  appendKey: (req: Request, res: Response) => {
    // method query e body já fazem por padrão
    return `${req.headers["authorization-f"]} ${req.headers["authorization"]} ${req.headers["authorization-safe-link"]}`;
  },
  statusCodes: {
    // faz cache de tudo
    exclude: [999],
  },
});

export function createExpressServer(opts: {
  port: number;
  ip: number;
  minutesToRestart?: number;
}): {
  app: MyExpress;
  server: Server;
} {
  APP = express();

  APP.use(
    bodyParser.json({
      limit: "30mb",
    })
  );
  APP.use(
    bodyParser.text({
      limit: "30mb",
    })
  );
  APP.use(
    bodyParser.urlencoded({
      extended: false,
    })
  );

  APP.use(compression({ level: 6 }));

  APP.set("case sensitive routing", false);

  SERVER = http.createServer(APP);

  SERVER.listen(opts.port, opts.ip, () => {
    console.log(
      "Express server listening on %d, in %s mode",
      opts.port,
      APP.get("env")
    );
  });

  process.on("SIGTERM", _gracefulShutdown);
  process.on("SIGINT", _gracefulShutdown);

  function _gracefulShutdown() {
    console.info("Graceful shutdown start", new Date().toISOString());
    SERVER.close(async () => {
      if (APP.shutdownScript) {
        console.info("Graceful shutdown script init");
        await APP.shutdownScript();
        console.info("Graceful shutdown script end");
      }
      console.info("Graceful shutdown end", new Date().toISOString());
      process.exit(128 + 1);
    });
  }

  if (opts.minutesToRestart) {
    let calcIntervalo = (intervaloAleatorio() + opts.minutesToRestart) * 60_000;
    let segundosIntervalo = (calcIntervalo % 60_000) / 1000;

    setTimeout(() => {
      //Se Der errado reinicia em 1 minuto
      setTimeout(() => {
        process.exit(128 + 2);
      }, 60_000);

      _gracefulShutdown();
    }, calcIntervalo);
    console.log(
      "Restart in",
      (calcIntervalo / 60_000).toFixed(0),
      "Minutes",
      segundosIntervalo.toFixed(0),
      "Seconds"
    );
  }

  function intervaloAleatorio(): number {
    return Math.random() * (2 - 0.5 + 1) + 0.5;
  }

  APP.get("/ready", (req, res) => {
    let time = process.uptime();
    let s = 400;
    if (time >= 1) {
      s = 200;
    }
    res.status(s).json({ status: s, time: time });
  });
  APP.get("/healthy", (req, res) => {
    let time = process.uptime();
    let s = 200;
    if (time >= (opts.minutesToRestart || 30) * 60_000) {
      s = 400;
    }
    res.status(s).json({ status: s, time: time });
  });

  if (process.env?.MAINTENANCE_MODE === "true") {
    APP.use(async (req, res, next) => {
      await new Promise((resolve, reject) => {
        setTimeout(resolve, 300);
      });
      res.status(507).json({
        message:
          "No momento estamos em manutenção. Por favor, tente novamente mais tarde.",
      });
    });
  }

  return { app: APP, server: SERVER };
}

export function createRoutes(routes: Route[]): Application {
  if (!APP) {
    throw new Error(
      'Não é possível configurar rotas sem criar o server, chame o comando "createExpressServer" antes'
    );
  }
  for (let route of routes) {
    if (route) {
      let middlewares = [...(route?.middlewares ?? [])];
      // cache vai antes de tudo
      if (route.cacheTime) {
        for (let r of route.router.stack) {
          // colocar o cache em cada rota para que o newrelic funcione corretamente
          r.route.stack.unshift(Layer("/", {}, cache(route.cacheTime)));
        }
      }
      APP.use(route.path, middlewares, route.router);
    }
  }

  APP.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AxiosError) {
      let msgError = `AXIOS ERROR - ${err.request.method} - ${err.config.url} \t`;
      msgError += `DATA: ${err.config.data} \t`;
      msgError += `HEADERS: ${JSON.stringify(err.config.headers)} \t`;
      msgError += `RESPONSE: Status: ${err.response?.status} \t`;
      msgError += `RESPONSE DATA: ${JSON.stringify(err.response?.data)} \t`;
      console.error(msgError);

      if (err.response?.data?.message) {
        err.message = err.response?.data?.message;
      }
      err.status = err.response?.status;
    } else {
      console.error(req.originalUrl, err);
    }

    if (!err.status) {
      err.status = 500;
    }
    if (res.getHeader("Transfer-Encoding") === "chunked") {
      res.status(err.status).end("#### Chunked Error: " + err.message);
    } else {
      res.status(err.status).json({ message: err.message });
    }
  });

  return APP;
}
