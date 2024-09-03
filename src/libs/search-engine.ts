const googleIt = require("google-it");

export default class SearchEngine {
  static async buscar(text: string) {
    let results = await googleIt({ "no-display": true, query: text, limit: 5 });

    //  await  .search(text, {
    //     safe: false,
    //     num: 5,
    //     additional_params: {
    //         // https://moz.com/blog/the-ultimate-guide-to-the-google-search-parameters
    //         hl: 'pt_BR'
    //     }
    // });

    let r = Math.floor(Math.random() * Math.min(5, results.length));
    // {title, description, url};
    return results[r]?.snippet; //+ "\n\n" + result.results[r].url;
  }
}
