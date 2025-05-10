import { signAsync } from "@noble/ed25519";
import { base64 } from "@scure/base";
import { Instruction } from "./instruction.ts";

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

  private async getAuthHeaders(
    instruction: Instruction,
    params: Record<string, string | number> = {},
    body: Record<string, string | number> = {},
  ): Promise<Record<string, string>> {
    const window = "5000";
    const timestamp = `${Date.now()}`;

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

    const message = `instruction=${instruction}&` + sp.toString();

    // Sign the message
    const signature = base64.encode(
      await signAsync(
        textEncoder.encode(message),
        base64.decode(this.privateKey),
      ),
    );

    return {
      "X-Timestamp": timestamp,
      "X-Window": window,
      "X-API-Key": this.publicKey,
      "X-Signature": signature,
    };
  }

  async call(
    path: string,
    options?: {
      instruction?: Instruction;
      method?: string;
      params?: Record<string, string>;
      body?: Record<string, string | number>;
    },
  ): Promise<Response> {
    const { instruction, method, params, body } = options ?? {};
    const sp = new URLSearchParams(params ?? {});

    return await fetch(
      `https://api.backpack.exchange/api/v1${path}?${sp.toString()}`,
      {
        method,
        headers:
          instruction != null
            ? await this.getAuthHeaders(instruction, params, body)
            : undefined,
        body: body != null ? JSON.stringify(body) : undefined,
      },
    );
  }

  // Assets
  Assets = {
    getAssets: async (): Promise<unknown> => {
      const response = await this.call("/assets");
      return await response.json();
    },
    getCollateral: async (): Promise<unknown> => {
      const response = await this.call("/collateral");
      return await response.json();
    },
  };

  // Markets
  Markets = {
    getMarkets: async (): Promise<unknown> => {
      const response = await this.call("/markets");
      return await response.json();
    },
    getMarket: async (symbol: string): Promise<unknown> => {
      const response = await this.call("/market", {
        params: {
          symbol,
        },
      });
      return await response.json();
    },
    getTicker: async (symbol: string): Promise<unknown> => {
      const response = await this.call(`/ticker/${symbol}`);
      return await response.json();
    },
    getTickers: async (): Promise<unknown> => {
      const response = await this.call("/tickers");
      return await response.json();
    },
    getDepth: async (symbol: string): Promise<unknown> => {
      const response = await this.call(`/depth/${symbol}`);
      return await response.json();
    },
    getKLines: async (props: {
      symbol: string;
      interval: string;
      startTime: string;
      endTime?: string;
      priceType?: "Last" | "Index" | "Mark";
    }): Promise<unknown> => {
      const { symbol, interval, startTime, endTime, priceType } = props;
      const params: Record<string, string> = {
        symbol,
        interval,
        startTime,
      };
      if (endTime != null) {
        params.endTime = endTime;
      }
      if (priceType != null) {
        params.priceType = priceType;
      }
      const response = await this.call("/klines", {
        params,
      });
      return await response.json();
    },
    getMarkPrices: async (): Promise<unknown> => {
      const response = await this.call("/markPrices");
      return await response.json();
    },
    getOpenInterest: async (symbol?: string): Promise<unknown> => {
      const response = await this.call("/openInterest", {
        params: symbol != null ? { symbol } : undefined,
      });
      return await response.json();
    },
    getFundingRates: async (): Promise<unknown> => {
      const response = await this.call("/fundingRates");
      return await response.json();
    },
  };

  // System
  System = {
    getStatus: async (): Promise<unknown> => {
      const response = await this.call("/status");
      return await response.json();
    },
    ping: async (): Promise<unknown> => {
      const response = await this.call("/ping");
      return await response.json();
    },
    getTime: async (): Promise<unknown> => {
      const response = await this.call("/time");
      return await response.json();
    },
  };

  // Trades
  Trades = {
    getRecentTrades: async (symbol: string): Promise<unknown> => {
      const response = await this.call(`/trades/${symbol}`);
      return await response.json();
    },
    getHistoricalTrades: async (symbol: string): Promise<unknown> => {
      const response = await this.call(`/historicalTrades/${symbol}`);
      return await response.json();
    },
  };

  // Account
  Account = {
    getAccount: async (): Promise<unknown> => {
      const response = await this.call("/account", {
        instruction: Instruction.AccountQuery,
      });
      return await response.json();
    },
    updateAccount: async (data: Record<string, any>): Promise<unknown> => {
      const response = await this.call("/account", {
        method: "PATCH",
        instruction: Instruction.AccountQuery,
        body: data,
      });
      return await response.json();
    },
    getMaxBorrowQuantity: async (symbol: string): Promise<unknown> => {
      const response = await this.call("/maxBorrowQuantity", {
        instruction: Instruction.AccountQuery,
        params: { symbol },
      });
      return await response.json();
    },
    getMaxOrderQuantity: async (symbol: string): Promise<unknown> => {
      const response = await this.call("/maxOrderQuantity", {
        instruction: Instruction.AccountQuery,
        params: { symbol },
      });
      return await response.json();
    },
    getMaxWithdrawalQuantity: async (symbol: string): Promise<unknown> => {
      const response = await this.call("/maxWithdrawalQuantity", {
        instruction: Instruction.AccountQuery,
        params: { symbol },
      });
      return await response.json();
    },
  };

  // Capital
  Capital = {
    getBalances: async (): Promise<unknown> => {
      const response = await this.call("/capital", {
        instruction: Instruction.BalanceQuery,
      });
      return await response.json();
    },
    getCollateral: async (): Promise<unknown> => {
      const response = await this.call("/collateral", {
        instruction: Instruction.CollateralQuery,
      });
      return await response.json();
    },
    getDeposits: async (): Promise<unknown> => {
      const response = await this.call("/deposits", {
        instruction: Instruction.DepositQueryAll,
      });
      return await response.json();
    },
    getDepositAddress: async (asset: string): Promise<unknown> => {
      const response = await this.call("/depositAddress", {
        instruction: Instruction.DepositAddressQuery,
        params: { asset },
      });
      return await response.json();
    },
    getWithdrawals: async (): Promise<unknown> => {
      const response = await this.call("/withdrawals", {
        instruction: Instruction.WithdrawalQueryAll,
      });
      return await response.json();
    },
    requestWithdrawal: async (data: Record<string, any>): Promise<unknown> => {
      const response = await this.call("/withdrawal", {
        method: "POST",
        instruction: Instruction.Withdraw,
        body: data,
      });
      return await response.json();
    },
  };

  // Order
  Order = {
    getOpenOrder: async (orderId: string): Promise<unknown> => {
      const response = await this.call("/order", {
        instruction: Instruction.OrderQuery,
        params: { orderId },
      });
      return await response.json();
    },
    executeOrder: async (data: Record<string, any>): Promise<unknown> => {
      const response = await this.call("/order", {
        method: "POST",
        instruction: Instruction.OrderExecute,
        body: data,
      });
      return await response.json();
    },
    cancelOrder: async (orderId: string): Promise<unknown> => {
      const response = await this.call("/order", {
        method: "DELETE",
        instruction: Instruction.OrderCancel,
        params: { orderId },
      });
      return await response.json();
    },
    getOpenOrders: async (symbol?: string): Promise<unknown> => {
      const response = await this.call("/orders", {
        instruction: Instruction.OrderQueryAll,
        params: symbol != null ? { symbol } : undefined,
      });
      return await response.json();
    },
    cancelAllOrders: async (symbol?: string): Promise<unknown> => {
      const response = await this.call("/orders", {
        method: "DELETE",
        instruction: Instruction.OrderCancelAll,
        params: symbol != null ? { symbol } : undefined,
      });
      return await response.json();
    },
  };
}
