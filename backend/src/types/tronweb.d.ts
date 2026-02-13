declare module 'tronweb' {
  class TronWeb {
    constructor(options: any);
    static isAddress(address: string): boolean;
    isAddress(address: string): boolean;
    address: {
      toHex(address: string): string;
      fromHex(address: string): string;
    };
    trx: {
      getAccount(address: string): Promise<any>;
      getBalance(address: string): Promise<number>;
      getTransactionInfo(txHash: string): Promise<any>;
      sendRawTransaction(signedTransaction: any): Promise<any>;
    };
  }

  export default TronWeb;
}

