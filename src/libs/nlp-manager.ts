const NlpManagerOriginal = require("node-nlp").NlpManager;
// só pela tipagem
import { NlpManager } from "node-nlp-typescript";

class MyNlpManager {
  manager: NlpManager;

  constructor() {
    this.manager = new NlpManagerOriginal({
      languages: ["pt"],
      forceNER: true,
    });

    this.manager.addNamedEntityText(
      "data",
      "hoje",
      ["pt"],
      ["para hoje", "de hoje", "hoje"]
    );
    this.manager.addNamedEntityText(
      "data",
      "ontem",
      ["pt"],
      ["de ontem", "ontem"]
    );
    this.manager.addNamedEntityText(
      "data",
      "amanha",
      ["pt"],
      ["para amanha", "amanha"]
    );
    this.manager.addNamedEntityText(
      "data",
      "ultimo_mes",
      ["pt"],
      ["ultimo mês", "mês passado"]
    );
    this.manager.addNamedEntityText(
      "data",
      "proximo_mes",
      ["pt"],
      ["proximo mês", "mês que vem"]
    );
    this.manager.addNamedEntityText(
      "data",
      "esse_mes",
      ["pt"],
      ["esse mês", "este mês", "mês atual"]
    );

    this.manager.addNamedEntityText(
      "passado_futuro",
      "passado",
      ["pt"],
      ["ultimos", "ultimo", "ultima", "ultimas", "atras"]
    );
    this.manager.addNamedEntityText(
      "passado_futuro",
      "futuro",
      ["pt"],
      ["proxima", "proximas", "proximos", "proximo"]
    );

    for (let d of dimensions) {
      this.manager.addNamedEntityText("dimensao", d.id, ["pt"], d.dimensoes);
    }

    this.manager.addNamedEntityText(
      "comparativo",
      "comparativo",
      ["pt"],
      ["comparativo"]
    );

    /// actions
    /// actions
    /// actions
    this.manager.addDocument("pt", "ver %nome_parque%", "procEscolherParque");
    this.manager.addDocument(
      "pt",
      "escolher %nome_parque%",
      "procEscolherParque"
    );
    this.manager.addAction(
      "procEscolherParque",
      "procEscolherParque",
      undefined
    );

    this.manager.addDocument("pt", "me ajuda", "procAjuda");
    this.manager.addDocument("pt", "ajuda", "procAjuda");
    this.manager.addDocument("pt", "menu", "procAjuda");
    this.manager.addDocument("pt", "preciso de ajuda", "procAjuda");
    this.manager.addDocument("pt", "o que voce faz?", "procAjuda");
    this.manager.addDocument("pt", "qual é o seu nome?", "procAjuda");
    this.manager.addAction("procAjuda", "procAjuda", undefined);

    this.manager.addDocument("pt", "parques", "procListaParques");
    this.manager.addDocument("pt", "meus parques", "procListaParques");
    this.manager.addDocument("pt", "ver meus parques", "procListaParques");
    this.manager.addDocument("pt", "parque atual", "procListaParques");
    this.manager.addDocument("pt", "meu parque", "procListaParques");
    this.manager.addAction("procListaParques", "procListaParques", undefined);

    this.manager.addNamedEntityText(
      "acao",
      "procAgendarMensagem",
      ["pt"],
      ["agendar"]
    );
    // this.manager.addDocument('pt', "agendar", 'procAgendarMensagem');
    // this.manager.addAction('procAgendarMensagem', 'procAgendarMensagem');

    this.manager.addDocument("pt", "remover agenda", "procAgendaRemover");
    this.manager.addAction("procAgendaRemover", "procAgendaRemover", undefined);

    this.manager.addDocument("pt", "meus agendamentos", "procAgendaLista");
    this.manager.addAction("procAgendaLista", "procAgendaLista", undefined);

    this.manager.addDocument("pt", "previsao visitantes", "procVisitacao");
    this.manager.addDocument("pt", "visitantes", "procVisitacao");
    this.manager.addDocument(
      "pt",
      "visitantes por %dimensao%",
      "procVisitacao"
    );
    this.manager.addDocument("pt", "visitantes %date%", "procVisitacao");
    this.manager.addDocument("pt", "visitas", "procVisitacao");
    this.manager.addDocument("pt", "visitas por %dimensao%", "procVisitacao");
    this.manager.addDocument("pt", "visitas %date%", "procVisitacao");
    this.manager.addDocument("pt", "previsao visitacao", "procVisitacao");
    this.manager.addDocument("pt", "visitacao", "procVisitacao");
    this.manager.addDocument("pt", "visitacao por %dimensao%", "procVisitacao");
    this.manager.addDocument("pt", "visitacao %date%", "procVisitacao");
    this.manager.addAction("procVisitacao", "procVisitacao", undefined);

    this.manager.addDocument("pt", "vendas", "procVendas");
    this.manager.addDocument("pt", "vendas por %dimensao%", "procVendas");
    this.manager.addDocument(
      "pt",
      "vendas por %dimensao% %dimensao%",
      "procVendas"
    );
    this.manager.addDocument("pt", "vendas %date%", "procVendas");
    this.manager.addDocument("pt", "vendas %date% - %date%", "procVendas");
    this.manager.addAction("procVendas", "procVendas", undefined);

    this.manager.addDocument("pt", "grafico %", "procPDF");
    this.manager.addDocument("pt", "grafico %nome_relatorio%", "procPDF");
    this.manager.addDocument("pt", "me envie o grafico", "procPDF");
    this.manager.addDocument("pt", "me envie o grafico %", "procPDF");
    this.manager.addDocument("pt", "relatorio", "procPDF");
    this.manager.addDocument("pt", "relatorio %", "procPDF");
    this.manager.addDocument("pt", "me envie o relatorio", "procPDF");
    this.manager.addDocument("pt", "me envie o relatorio %", "procPDF");
    this.manager.addDocument("pt", "painel", "procPDF");
    this.manager.addDocument("pt", "painel %", "procPDF");
    this.manager.addAction("procPDF", "procPDF", undefined);

    this.manager.addDocument("pt", "teste previsao", "procMensagemBomDia");
    this.manager.addAction(
      "procMensagemBomDia",
      "procMensagemBomDia",
      undefined
    );

    this.manager.addDocument("pt", "resumo geral", "procResumo");
    this.manager.addAction("procResumo", "procResumo", undefined);

    /// textos padrões
    /// textos padrões
    this.manager.addDocument("pt", "tchau", "greetings.bye");
    this.manager.addDocument("pt", "até mais", "greetings.bye");
    this.manager.addDocument("pt", "vejo você depois", "greetings.bye");
    this.manager.addDocument("pt", "preciso ir", "greetings.bye");

    this.manager.addDocument("pt", "oi", "greetings.hello");
    this.manager.addDocument("pt", "olá", "greetings.hello");
    this.manager.addDocument("pt", "opa", "greetings.hello");
    this.manager.addDocument("pt", "bom dia", "greetings.hello");
    this.manager.addDocument("pt", "boa tarde", "greetings.hello");
    this.manager.addDocument("pt", "boa noite", "greetings.hello");

    ///
    this.manager.addAnswer("pt", "greetings.bye", "Até a próxima");
    this.manager.addAnswer("pt", "greetings.bye", "Até breve!");
    this.manager.addAnswer(
      "pt",
      "greetings.hello",
      "Olá. Estou aqui para te ajudar com as informações do seu atrativo!"
    );
    this.manager.addAnswer(
      "pt",
      "greetings.hello",
      "Saudações. Me conta como posso te ajudar hoje!"
    );
  }
}

export class Dimensao {
  id: string;
  dimensoes: string[];
}

export const DimensionEnum = {
  data: "Data",
  localvenda: "Local de Venda",
  formapag: "Forma de Pagamento",
  bilhete: "Bilhete",
  categoria: "Categoria",
  pais: "Pais",
  estado: "Estado",
};

export const dimensions: Dimensao[] = [
  {
    id: DimensionEnum.data,
    dimensoes: ["data"],
  },
  {
    id: DimensionEnum.localvenda,
    dimensoes: ["local de venda", "canal de venda"],
  },
  {
    id: DimensionEnum.formapag,
    dimensoes: ["forma de pagamento", "pix", "dinheiro", "cartão"],
  },
  {
    id: DimensionEnum.bilhete,
    dimensoes: ["bilhete"],
  },
  {
    id: DimensionEnum.categoria,
    dimensoes: ["categoria"],
  },
  {
    id: DimensionEnum.pais,
    dimensoes: ["pais"],
  },
  {
    id: DimensionEnum.estado,
    dimensoes: ["estado"],
  },
];

export const myNlpManager = new MyNlpManager().manager;
export type TNlpManager = NlpManager;

module.exports = {
  myNlpManager,
  dimensions,
  DimensionEnum,
};

export interface Entity {
  start: number;
  end: number;
  len: number;
  levenshtein: number;
  accuracy: number;
  entity: string;
  type: string;
  option: string;
  sourceText: string;
  utteranceText: string;
  resolution: Resolution;
}

interface Resolution {
  strValue: string;
  value: number;
  unit: string;
  localeUnit: string;
  date: Date;
}
