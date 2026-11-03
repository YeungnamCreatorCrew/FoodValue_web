import rawPoc from "./data/green-onion-poc.json";
// Presentation/backtest metadata only; never passed to the prediction UI.
export const greenOnionBacktest = { itemId: rawPoc.id, actualAfter7Days: rawPoc.actualAfter7Days };
