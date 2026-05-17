import { parseArgs, printWalletReadiness } from "./lib/devnet.js";

async function main() {
  const args = parseArgs();
  console.log(JSON.stringify(await printWalletReadiness(args), null, 2));
}

void main();
