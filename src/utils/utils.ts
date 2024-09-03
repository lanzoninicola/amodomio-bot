import { Moment } from "moment";

class Utils {
  static formatInteger(value: number) {
    return (
      value != null &&
      value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })
    );
  }

  static formatFloat(value: number) {
    return (
      value != null &&
      value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
    );
  }

  static formatCurrency(value: number) {
    return (
      value != null &&
      value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    );
  }

  static formatDate(value: Moment) {
    return value.format("DD/MM/YYYY");
  }

  static formatTime(value: Moment) {
    return value.format("HH:mm");
  }
}

export default Utils;
