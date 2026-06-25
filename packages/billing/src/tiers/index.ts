/**
 * @aether/billing - Tiered Pricing
 * 
 * Calculate pricing based on tiered structures and volume discounts
 * 
 * @version 1.0.0
 */

import type { PricingPlan, PricingTier, TieredPricingCalculation } from '../types/index.js';
import { PricingPlanSchema, PricingTierSchema } from '../schemas/index.js';

// =============================================================================
// TIERED PRICING INTERFACE
// =============================================================================

export interface TieredPricingConfig {
  defaultCurrency: string;
}

export interface CreatePricingPlanParams {
  name: string;
  description?: string;
  currency: string;
  billingInterval: 'monthly' | 'yearly' | 'weekly' | 'daily';
  tiers: Omit<PricingTier, 'id' | 'createdAt' | 'updatedAt'>[];
  basePrice?: number;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface CreatePricingTierParams {
  name: string;
  description?: string;
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  currency: string;
  features?: string[];
  metadata?: Record<string, string>;
}

// =============================================================================
// TIERED PRICING SERVICE CLASS
// =============================================================================

export class TieredPricingService {
  private config: TieredPricingConfig;
  private plans: Map<string, PricingPlan> = new Map();

  constructor(config: TieredPricingConfig) {
    this.config = config;
  }

  /**
   * Create a pricing plan
   */
  createPricingPlan(params: CreatePricingPlanParams): PricingPlan {
    const tiers: PricingTier[] = params.tiers.map((tier, index) => ({
      ...tier,
      id: `tier-${Date.now()}-${index}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Sort tiers by minQuantity
    tiers.sort((a, b) => a.minQuantity - b.minQuantity);

    const plan: PricingPlan = {
      id: `plan-${Date.now()}`,
      name: params.name,
      description: params.description,
      currency: params.currency,
      billingInterval: params.billingInterval,
      tiers,
      basePrice: params.basePrice,
      trialDays: params.trialDays,
      metadata: params.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.plans.set(plan.id, plan);
    return plan;
  }

  /**
   * Get a pricing plan
   */
  getPricingPlan(planId: string): PricingPlan | undefined {
    return this.plans.get(planId);
  }

  /**
   * Get all pricing plans
   */
  getAllPricingPlans(): PricingPlan[] {
    return Array.from(this.plans.values());
  }

  /**
   * Update a pricing plan
   */
  updatePricingPlan(planId: string, updates: Partial<Omit<PricingPlan, 'id' | 'createdAt'>>): PricingPlan {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const updatedPlan: PricingPlan = {
      ...plan,
      ...updates,
      updatedAt: new Date(),
    };

    this.plans.set(planId, updatedPlan);
    return updatedPlan;
  }

  /**
   * Delete a pricing plan
   */
  deletePricingPlan(planId: string): void {
    this.plans.delete(planId);
  }

  /**
   * Add a tier to a plan
   */
  addTier(planId: string, params: CreatePricingTierParams): PricingTier {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const tier: PricingTier = {
      ...params,
      id: `tier-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    plan.tiers.push(tier);
    plan.tiers.sort((a, b) => a.minQuantity - b.minQuantity);
    plan.updatedAt = new Date();

    return tier;
  }

  /**
   * Update a tier
   */
  updateTier(planId: string, tierId: string, updates: Partial<Omit<PricingTier, 'id' | 'createdAt'>>): PricingTier {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const tierIndex = plan.tiers.findIndex(t => t.id === tierId);
    if (tierIndex === -1) {
      throw new Error(`Tier ${tierId} not found in plan ${planId}`);
    }

    const updatedTier: PricingTier = {
      ...plan.tiers[tierIndex],
      ...updates,
      updatedAt: new Date(),
    };

    plan.tiers[tierIndex] = updatedTier;
    plan.tiers.sort((a, b) => a.minQuantity - b.minQuantity);
    plan.updatedAt = new Date();

    return updatedTier;
  }

  /**
   * Remove a tier from a plan
   */
  removeTier(planId: string, tierId: string): void {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    plan.tiers = plan.tiers.filter(t => t.id !== tierId);
    plan.updatedAt = new Date();
  }

  /**
   * Calculate price for a given quantity
   */
  calculatePrice(planId: string, quantity: number): TieredPricingCalculation {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    const breakdown: TieredPricingCalculation['breakdown'] = [];
    let totalAmount = plan.basePrice || 0;
    let remainingQuantity = quantity;

    for (const tier of plan.tiers) {
      if (remainingQuantity <= 0) break;

      const tierMin = tier.minQuantity;
      const tierMax = tier.maxQuantity || Infinity;
      const tierRange = tierMax - tierMin;

      if (quantity >= tierMin) {
        const quantityInTier = Math.min(remainingQuantity, tierRange);
        const tierAmount = quantityInTier * tier.unitPrice;

        breakdown.push({
          tierId: tier.id,
          tierName: tier.name,
          quantity: quantityInTier,
          unitPrice: tier.unitPrice,
          amount: tierAmount,
        });

        totalAmount += tierAmount;
        remainingQuantity -= quantityInTier;
      }
    }

    return {
      planId,
      quantity,
      currency: plan.currency,
      totalAmount,
      breakdown,
      calculatedAt: new Date(),
    };
  }

  /**
   * Get applicable tier for a quantity
   */
  getApplicableTier(planId: string, quantity: number): PricingTier | null {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    for (const tier of plan.tiers) {
      if (quantity >= tier.minQuantity) {
        if (!tier.maxQuantity || quantity <= tier.maxQuantity) {
          return tier;
        }
      }
    }

    return null;
  }

  /**
   * Calculate volume discount
   */
  calculateVolumeDiscount(planId: string, quantity: number): {
    originalAmount: number;
    discountedAmount: number;
    discountAmount: number;
    discountPercentage: number;
  } {
    const calculation = this.calculatePrice(planId, quantity);
    
    // Calculate what it would cost at the lowest tier rate
    const lowestTier = planId ? this.plans.get(planId)?.tiers[0] : null;
    const originalAmount = lowestTier ? quantity * lowestTier.unitPrice : calculation.totalAmount;
    
    const discountAmount = originalAmount - calculation.totalAmount;
    const discountPercentage = originalAmount > 0 ? (discountAmount / originalAmount) * 100 : 0;

    return {
      originalAmount,
      discountedAmount: calculation.totalAmount,
      discountAmount,
      discountPercentage,
    };
  }

  /**
   * Validate pricing plan
   */
  validatePricingPlan(plan: PricingPlan): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (plan.tiers.length === 0) {
      errors.push('Plan must have at least one tier');
    }

    // Check for overlapping tiers
    for (let i = 0; i < plan.tiers.length - 1; i++) {
      const current = plan.tiers[i];
      const next = plan.tiers[i + 1];

      if (current.maxQuantity && current.maxQuantity >= next.minQuantity) {
        errors.push(`Tier ${current.id} overlaps with tier ${next.id}`);
      }
    }

    // Check for gaps in tiers
    for (let i = 0; i < plan.tiers.length - 1; i++) {
      const current = plan.tiers[i];
      const next = plan.tiers[i + 1];

      if (current.maxQuantity && current.maxQuantity < next.minQuantity - 1) {
        errors.push(`Gap between tier ${current.id} and ${next.id}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================
