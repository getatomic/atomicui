export const dynamic = 'force-dynamic';
import { cookiesHandles } from "@atomic/utils/AtomicCookiesManager";
import { AtomicCookiesManager } from "@atomic/utils/AtomicCookiesManager";
import { createHash } from 'crypto';
import { type EventCaptureOptions } from "@atomic/core/types";

interface atomicConstructorOptions {
  atomicApiUrl?: string;
  atomicServiceRoleKey?: string;
  cookies?: cookiesHandles;
}

export class AtomicClient {
  private atomicApiUrl: string | undefined;
  private atomicExperimentsEndpoint: string | undefined;
  private atomicEventsEndpoint: string | undefined;
  private atomicServiceRoleKey: string | undefined;
  private atomicCookiesManager: AtomicCookiesManager | undefined;
  isReady: boolean = false;

  init(options: atomicConstructorOptions) {
    if (!options.atomicApiUrl || !options.atomicServiceRoleKey) {
      throw new Error('Atomic API URL is required for atomic service to work');
    }
    this.atomicApiUrl = options.atomicApiUrl;
    this.atomicExperimentsEndpoint = `${this.atomicApiUrl}/experiments/get-variant`;
    this.atomicEventsEndpoint = `${this.atomicApiUrl}/experiments/event`;
    this.atomicServiceRoleKey = options.atomicServiceRoleKey;
    this.atomicCookiesManager = new AtomicCookiesManager(options.cookies);
    this.isReady = true;
  }

  async getVariant(featureFlag: string, testEpoch: number, variantsMapKeys: string[]): Promise<string | null> {
    if (!this.atomicCookiesManager || !this.atomicExperimentsEndpoint || !this.atomicServiceRoleKey) {
      return null
    }

    try {
      // first, test if the user has a pre-assigned variant:
      const preAssignedVariant = this.atomicCookiesManager.getVariantIdCookie(featureFlag, testEpoch)
      if (preAssignedVariant) {
        return preAssignedVariant
      }
  
      // if not, get the variant from the atomic service:
      const atomicUserId = this.atomicCookiesManager.getAtomicUserIdCookie()
      if (!atomicUserId) {
        console.warn('Atomic user id is required to get variant')
        return null
      }
      const hashBucket = this._calculateHashBucket(atomicUserId, featureFlag, testEpoch)
      // console.log(`Atomic user id: ${atomicUserId}, feature flag: ${featureFlag}, hash bucket: ${hashBucket}`)
      // fetching the variant:
      const response = await fetch(
        this.atomicExperimentsEndpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.atomicServiceRoleKey}`
          },
          body: JSON.stringify({
            "feature_flag": featureFlag,
            "hash_bucket": hashBucket,
            "variants_list": variantsMapKeys
          })
        }
      )
      const data = await response.json()
  
      if (!data || !data.variant_id) {
        return null
      }

      return data.variant_id
    } catch (error) {
      // console.warn('Error getting variant', error)
      return null
    }
  }

  async ensureAtomicUserId(): Promise<any> {
    if (!this.atomicCookiesManager) {
      return null
    }

    return {
      atomicUserId: this.atomicCookiesManager.getSetAtomicUserIdCookie(),
      atomicSessionId: this.atomicCookiesManager.getSetAtomicSessionIdCookie()
    }
  }

  /**
   * method to capture events
   * @param options 
   */
  async capture(options: Partial<EventCaptureOptions>): Promise<any> {
    if (!this.atomicCookiesManager || !this.atomicEventsEndpoint || !this.atomicServiceRoleKey) {
      return null
    }

    try {
      const atomicUserId = this.atomicCookiesManager.getAtomicUserIdCookie() || "unknown"
      const atomicSessionId = this.atomicCookiesManager.getAtomicSessionIdCookie() || "unknown"
      const finalType = options.type || "unknown"
      const finalOptions = {
        ...options,
        userId: atomicUserId,
        sessionId: atomicSessionId,
        type: finalType
      }
  
      const response = await fetch(
        this.atomicEventsEndpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.atomicServiceRoleKey}`
          },
          body: JSON.stringify(finalOptions)
        }
      )
    } catch (error) {
      console.error('Error capturing event', error)
    }

  }

  /**
   * Calculates the hash bucket for a given atomic user id and feature flag from 0 to 1000 using rolling hash
   * @param atomicUserId 
   * @param featureFlag 
   */
  private _calculateHashBucket(atomicUserId: string, featureFlag: string, testEpoch: number): number {
    const targetSting = `${atomicUserId}-${featureFlag}-${testEpoch}`
    const hash = createHash('sha256').update(targetSting).digest('hex')
    const hashInt = parseInt(hash, 16)
    return hashInt % 1000
  }
}

export function createClient(options: atomicConstructorOptions) {
  const client = new AtomicClient()
  client.init(options)
  return client
}