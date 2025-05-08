import { BackpackAPI } from "./mod.ts";
import dotenv from "dotenv";

dotenv.config();

const bp = new BackpackAPI();

const res = await bp.getAccount();

console.log(JSON.stringify(res, null, 2));
