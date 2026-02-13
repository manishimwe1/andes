import HDKey from 'hdkey';
import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import logger from '@/config/logger';
import { DerivedWalletInfo, Network, SupportedNetwork } from '@/types';

/**
 * HD Wallet utility for deriving addresses from mnemonic
 */

export class HDWalletUtil {
  private masterSeed: Buffer;

  constructor(mnemonic: string, passphrase?: string) {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }
    this.masterSeed = Buffer.from(bip39.mnemonicToSeedSync(mnemonic, passphrase || ''));
  }

  /**
   * Get derivation path based on network
   */
  private getDerivationPath(network: SupportedNetwork, index: number): string {
    switch (network) {
      case Network.ETHEREUM:
      case Network.BSC:
      case Network.POLYGON:
        // Standard EVM derivation path
        return `m/44'/60'/0'/0/${index}`;
      case Network.TRON:
        // Tron uses same path as Ethereum but different curve
        return `m/44'/60'/0'/0/${index}`;
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  /**
   * Derive wallet for EVM networks (Ethereum, BSC, Polygon)
   */
  private deriveEVMWallet(index: number): DerivedWalletInfo {
    const path = this.getDerivationPath(Network.ETHEREUM, index);
    const hdkey = HDKey.fromMasterSeed(this.masterSeed);
    const wallet = hdkey.derive(path);

    if (!wallet.publicKey) {
      throw new Error('Failed to derive public key');
    }

    // Create ethers wallet from private key
    const privateKeyBuffer = wallet.privateKey;
    if (!privateKeyBuffer) {
      throw new Error('Failed to derive private key');
    }

    const privateKeyHex = '0x' + privateKeyBuffer.toString('hex');
    const ethersWallet = new ethers.Wallet(privateKeyHex);

    return {
      address: ethersWallet.address,
      publicKey: '0x' + wallet.publicKey.toString('hex'),
      privateKey: '0x' + privateKeyBuffer.toString('hex'), // Only in secure context
      path,
      index
    };
  }

  /**
   * Derive wallet for Tron network
   */
  private deriveTronWallet(index: number): DerivedWalletInfo {
    const path = this.getDerivationPath(Network.TRON, index);
    const hdkey = HDKey.fromMasterSeed(this.masterSeed);
    const wallet = hdkey.derive(path);

    if (!wallet.publicKey) {
      throw new Error('Failed to derive public key');
    }

    const privateKeyBuffer = wallet.privateKey;
    if (!privateKeyBuffer) {
      throw new Error('Failed to derive private key');
    }

    // For Tron, we still use the same private key but just convert the address format
    // This can be enhanced with tronweb's address conversion utilities
    const publicKey = '0x' + wallet.publicKey.toString('hex');

    return {
      address: publicKey, // This should be converted to Tron base58 format in production
      publicKey,
      privateKey: '0x' + privateKeyBuffer.toString('hex'),
      path,
      index
    };
  }

  /**
   * Derive wallet for specific network
   */
  deriveWallet(network: SupportedNetwork, index: number): DerivedWalletInfo {
    try {
      switch (network) {
        case Network.ETHEREUM:
        case Network.BSC:
        case Network.POLYGON:
          return this.deriveEVMWallet(index);
        case Network.TRON:
          return this.deriveTronWallet(index);
        default:
          throw new Error(`Unsupported network: ${network}`);
      }
    } catch (error) {
      logger.error('Failed to derive wallet', error, {
        network,
        index
      });
      throw error;
    }
  }

  /**
   * Batch derive multiple wallets
   */
  deriveMultipleWallets(
    network: SupportedNetwork,
    startIndex: number,
    count: number
  ): DerivedWalletInfo[] {
    const wallets: DerivedWalletInfo[] = [];
    for (let i = startIndex; i < startIndex + count; i++) {
      wallets.push(this.deriveWallet(network, i));
    }
    return wallets;
  }

  /**
   * Verify that an address was derived from this master seed
   */
  verifyAddress(network: SupportedNetwork, address: string, index: number): boolean {
    try {
      const derived = this.deriveWallet(network, index);
      return derived.address.toLowerCase() === address.toLowerCase();
    } catch {
      return false;
    }
  }
}

/**
 * Create HD wallet utility from environment
 */
export function createHDWalletUtil(): HDWalletUtil {
  const mnemonic = process.env.MASTER_MNEMONIC;
  if (!mnemonic) {
    throw new Error('MASTER_MNEMONIC not set in environment variables');
  }

  return new HDWalletUtil(mnemonic, process.env.MASTER_PASSPHRASE);
}
