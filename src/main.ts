import { BackpackAPI } from "./mod.ts";
import dotenv from "dotenv";

dotenv.config();

const bp = new BackpackAPI();

const res = await bp.Markets.getKLines({
  symbol: "SUI_USDC",
  interval: "1m",
  startTime: "1746801907",
});

console.log(JSON.stringify(res, null, 2));
