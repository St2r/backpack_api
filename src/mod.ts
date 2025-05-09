import { signAsync } from "@noble/ed25519";
import { base64 } from '@scure/base';

const WINDOW = 5000;

const textEncoder = new TextEncoder();

export class BackpackAPI {
  constructor(
    /**
     * base64 encoded public key
     */
    private readonly publicKey: string = process.env.PUBLIC_KEY ?? "",
    /**
     * base64 encoded private key
     */
    private readonly privateKey: string = process.env.PRIVATE_KEY ?? "",
  ) {}

  private async generateSignature(
    timestamp: number,
    params: Record<string, string | number> = {},
    body: Record<string, string | number> = {},
  ): Promise<string> {
    const window = WINDOW;

    const sp = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      sp.append(key, value.toString());
    });
    Object.entries(body).forEach(([key, value]) => {
      sp.append(key, value.toString());
    });

    sp.sort();

    sp.append("timestamp", timestamp.toString());
    sp.append("window", window.toString());

    // FIXME: TODO instruction should not be a constant
    const message = 'instruction=accountQuery&' + sp.toString();

    // Sign the message
    const signature = await signAsync(textEncoder.encode(message), base64.decode(this.privateKey));

    // to base64
    return base64.encode(signature);
  }

  private async getCommonHeaders(): Promise<Record<string, string>> {
    const timestamp = Date.now();
    return {
      "X-Timestamp": `${timestamp}`,
      "X-Window": `${WINDOW}`,
      "X-API-Key": this.publicKey,
      "X-Signature": await this.generateSignature(timestamp),
    };
  }

  async getAsset(): Promise<unknown> {
    const response = await fetch(
      "https://api.backpack.exchange/api/v1/assets",
      {
        headers: await this.getCommonHeaders(),
      },
    );

    return await response.json();
  }

  async getAccount(): Promise<unknown> {
    const response = await fetch(
      "https://api.backpack.exchange/api/v1/account",
      {
        headers: await this.getCommonHeaders(),
      },
    );

    return await response.json();
  }
}