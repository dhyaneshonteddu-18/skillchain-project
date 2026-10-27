/**
 * Gas Price Utility for Polygon Amoy
 * Fetches current EIP-1559 fee recommendations and applies appropriate overrides
 */

import { parseUnits, formatUnits } from 'ethers';

// Fallback fees if API is unavailable (in Gwei)
const FALLBACK_FEES = {
  maxPriorityFeePerGas: 30, // 30 Gwei
  maxFeePerGas: 100,        // 100 Gwei
};

// RPC provider URLs for fallback fee estimation
const RPC_URLS = {
  80002: 'https://rpc-amoy.polygon.technology/', // Polygon Amoy
};

/**
 * Fetch gas prices from Polygon Gas Station API
 * @returns {Promise<Object>} Object with maxPriorityFeePerGas and maxFeePerGas in wei
 */
export const fetchPolygonGasPrices = async () => {
  try {
    const response = await fetch('https://gasstation.polygon.technology/amoy', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Gas Station API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Gas Station returns fees in Gwei
    // Use 'standard' tier with a buffer for reliability
    const maxPriorityFeeGwei = Math.ceil((data.standard?.maxPriorityFee || FALLBACK_FEES.maxPriorityFeePerGas) * 1.2);
    const maxFeeGwei = Math.ceil((data.standard?.maxFee || FALLBACK_FEES.maxFeePerGas) * 1.2);

    console.log(`[Gas Price] Polygon Amoy - maxPriority: ${maxPriorityFeeGwei} Gwei, maxFee: ${maxFeeGwei} Gwei`);

    return {
      maxPriorityFeePerGas: parseUnits(maxPriorityFeeGwei.toString(), 'gwei'),
      maxFeePerGas: parseUnits(maxFeeGwei.toString(), 'gwei'),
      source: 'gasStation',
    };
  } catch (error) {
    console.warn('[Gas Price] Gas Station API failed, using RPC estimation:', error.message);
    return estimateGasPricesFromRPC();
  }
};

/**
 * Estimate gas prices using RPC eth_feeHistory
 * @returns {Promise<Object>} Object with maxPriorityFeePerGas and maxFeePerGas in wei
 */
export const estimateGasPricesFromRPC = async () => {
  try {
    const rpcUrl = RPC_URLS[80002];
    if (!rpcUrl) {
      throw new Error('No RPC URL configured for this chain');
    }

    // Get fee history for recent blocks
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_feeHistory',
        params: [10, 'latest', [25, 50, 75]], // Last 10 blocks, percentiles
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC error: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`RPC error: ${result.error.message}`);
    }

    const feeData = result.result;
    const baseFeePerGas = BigInt(feeData.baseFeePerGas[feeData.baseFeePerGas.length - 1]);
    
    // Get the 75th percentile priority fee (more reliable)
    const priorityFees = feeData.reward[feeData.reward.length - 1];
    const maxPriorityFee = BigInt(priorityFees[2]); // 75th percentile

    // maxFeePerGas = baseFee + maxPriorityFee + buffer
    const buffer = baseFeePerGas / 10n; // 10% buffer
    const maxFeePerGas = baseFeePerGas + maxPriorityFee + buffer;

    // Ensure minimum values meet Polygon Amoy requirements
    const minMaxPriority = parseUnits('25', 'gwei'); // 25 Gwei minimum for Amoy
    const finalMaxPriority = maxPriorityFee < minMaxPriority ? minMaxPriority : maxPriorityFee;
    const finalMaxFee = maxFeePerGas < parseUnits('30', 'gwei') 
      ? parseUnits('50', 'gwei') 
      : maxFeePerGas;

    console.log(`[Gas Price] RPC estimation - maxPriority: ${formatUnits(finalMaxPriority, 'gwei')} Gwei, maxFee: ${formatUnits(finalMaxFee, 'gwei')} Gwei`);

    return {
      maxPriorityFeePerGas: finalMaxPriority,
      maxFeePerGas: finalMaxFee,
      source: 'rpc',
    };
  } catch (error) {
    console.warn('[Gas Price] RPC estimation failed, using fallback:', error.message);
    return getFallbackGasPrices();
  }
};

/**
 * Get fallback gas prices (conservative defaults for Polygon Amoy)
 * @returns {Object} Object with maxPriorityFeePerGas and maxFeePerGas in wei
 */
export const getFallbackGasPrices = () => {
  console.warn('[Gas Price] Using fallback fees for Polygon Amoy');

  return {
    maxPriorityFeePerGas: parseUnits(FALLBACK_FEES.maxPriorityFeePerGas.toString(), 'gwei'),
    maxFeePerGas: parseUnits(FALLBACK_FEES.maxFeePerGas.toString(), 'gwei'),
    source: 'fallback',
  };
};

/**
 * Get gas price overrides for transaction
 * Tries Gas Station API first, falls back to RPC, then to fallback values
 * @returns {Promise<Object>} ethers.js transaction overrides
 */
export const getGasPriceOverrides = async () => {
  try {
    const fees = await fetchPolygonGasPrices();
    return {
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      maxFeePerGas: fees.maxFeePerGas,
    };
  } catch (error) {
    console.error('[Gas Price] Failed to get gas prices:', error);
    const fallback = getFallbackGasPrices();
    return {
      maxPriorityFeePerGas: fallback.maxPriorityFeePerGas,
      maxFeePerGas: fallback.maxFeePerGas,
    };
  }
};

/**
 * Format gas price for display
 * @param {BigInt} weiAmount - Amount in wei
 * @returns {string} Formatted amount in Gwei
 */
export const formatGasPrice = (weiAmount) => {
  return `${formatUnits(weiAmount, 'gwei')} Gwei`;
};
