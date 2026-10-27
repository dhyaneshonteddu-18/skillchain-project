import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { Plus, CheckCircle, Clock, AlertCircle, Coins, Code, Zap, ExternalLink, Copy } from 'lucide-react';
import { Contract, parseUnits } from 'ethers';

const StudentBountyPage = () => {
  const { user, wallet } = useAuth();
  const { provider, signer } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);
  const [skillCoinBalance, setSkillCoinBalance] = useState(0);
  const [tab, setTab] = useState('browse');

  // Create Bounty State
  const [createForm, setCreateForm] = useState({
    skillCoins: '',
    description: '',
    codeUrl: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Bounties Data
  const [bounties, setBounties] = useState([]);
  const [createdBounties, setCreatedBounties] = useState([]);
  const [submittedProofs, setSubmittedProofs] = useState([]);

  // Submit Proof State
  const [selectedBounty, setSelectedBounty] = useState(null);
  const [submitForm, setSubmitForm] = useState({
    proofUrl: '',
    walletAddress: '',
  });

  // Load balance and bounties on mount
  useEffect(() => {
    if (user && user.email) {
      loadSkillCoinBalance();
      loadBounties();
      
      // Refresh balance every 5 seconds
      const interval = setInterval(() => {
        loadSkillCoinBalance();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [user?.email, wallet, provider]);

  // Fetch SkillCoin balance from blockchain
  const loadSkillCoinBalance = async () => {
    try {
      if (!wallet || !provider) {
        setSkillCoinBalance(0);
        return;
      }

      const skillCoinAddress = import.meta.env.VITE_SKILL_COIN_ADDRESS;
      if (!skillCoinAddress) {
        setSkillCoinBalance(0);
        return;
      }

      const skillCoinContract = new Contract(
        skillCoinAddress,
        ['function balanceOf(address account) view returns (uint256)'],
        provider
      );

      const balance = await skillCoinContract.balanceOf(wallet);
      // Convert from Wei (18 decimals)
      setSkillCoinBalance(Number(balance) / 1e18);
    } catch (err) {
      console.error('Error fetching SkillCoin balance:', err);
      setSkillCoinBalance(0);
    }
  };

  const loadBounties = async () => {
    try {
      setLoading(true);
      
      // Load from localStorage
      const stored = localStorage.getItem('skillchain_bounties');
      const allBounties = stored ? JSON.parse(stored) : [];
      
      // Filter by creator (created by this user)
      const created = allBounties.filter(b => b.createdBy === user.email);
      
      // Filter by not created by this user and not submitted by this user
      const available = allBounties.filter(b => 
        b.createdBy !== user.email && 
        !b.submissions?.some(s => s.submittedBy === user.email)
      );
      
      // Filter submissions by current user
      const submitted = allBounties.flatMap(b => 
        (b.submissions || [])
          .filter(s => s.submittedBy === user.email)
          .map(s => ({ ...s, bountyId: b.id, bountyTitle: b.description, bountyCreator: b.createdBy, bountySkillCoins: b.skillCoins }))
      );

      setBounties(available);
      setCreatedBounties(created);
      setSubmittedProofs(submitted);
      setError(null);
    } catch (err) {
      console.error('Error loading bounties:', err);
      setError(`Failed to load bounties: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBounty = async (e) => {
    e.preventDefault();
    
    if (!createForm.skillCoins || !createForm.description || !createForm.codeUrl) {
      setError('Please fill in all fields');
      return;
    }

    if (isNaN(createForm.skillCoins) || createForm.skillCoins <= 0) {
      setError('SkillCoins must be a positive number');
      return;
    }

    // Check balance
    if (skillCoinBalance < parseFloat(createForm.skillCoins)) {
      setError(`❌ Insufficient balance! You have ${skillCoinBalance.toFixed(2)} SKC, but need ${createForm.skillCoins} SKC`);
      return;
    }

    try {
      setLoading(true);
      
      const newBounty = {
        id: `bounty_${Date.now()}`,
        createdBy: user.email,
        creatorWallet: wallet,
        skillCoins: parseFloat(createForm.skillCoins),
        description: createForm.description,
        codeUrl: createForm.codeUrl,
        status: 'open',
        submissions: [],
        createdAt: new Date().toISOString(),
      };

      const stored = localStorage.getItem('skillchain_bounties');
      const allBounties = stored ? JSON.parse(stored) : [];
      allBounties.push(newBounty);
      localStorage.setItem('skillchain_bounties', JSON.stringify(allBounties));

      setSuccess(`✅ Bounty created successfully! Reward: ${createForm.skillCoins} SKC`);
      setCreateForm({ skillCoins: '', description: '', codeUrl: '' });
      setShowCreateForm(false);
      
      // Reload bounties
      setTimeout(() => loadBounties(), 500);
    } catch (err) {
      setError(`Failed to create bounty: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProof = async (bountyId, e) => {
    e?.preventDefault();
    
    if (!submitForm.proofUrl || !submitForm.walletAddress) {
      setError('Please fill in all fields');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(submitForm.walletAddress)) {
      setError('Invalid Ethereum wallet address format');
      return;
    }

    try {
      setLoading(true);

      const stored = localStorage.getItem('skillchain_bounties');
      const allBounties = stored ? JSON.parse(stored) : [];
      
      const bountyIndex = allBounties.findIndex(b => b.id === bountyId);
      if (bountyIndex === -1) {
        throw new Error('Bounty not found');
      }

      const newSubmission = {
        id: `submission_${Date.now()}`,
        submittedBy: user.email,
        proofUrl: submitForm.proofUrl,
        walletAddress: submitForm.walletAddress,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      allBounties[bountyIndex].submissions.push(newSubmission);
      localStorage.setItem('skillchain_bounties', JSON.stringify(allBounties));

      setSuccess(`✅ Proof submitted successfully! Waiting for creator approval.`);
      setSubmitForm({ proofUrl: '', walletAddress: '' });
      setSelectedBounty(null);
      
      setTimeout(() => loadBounties(), 500);
    } catch (err) {
      setError(`Failed to submit proof: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBounty = async (bountyId, submissionId, recipientWallet, bountyAmount) => {
    if (!window.confirm(`Approve this submission and transfer ${bountyAmount} SkillCoins to ${recipientWallet.substring(0, 10)}...?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Step 1: Verify wallet connection
      if (!signer) {
        throw new Error('❌ Wallet not connected. Please connect MetaMask first.');
      }

      if (!wallet) {
        throw new Error('❌ No wallet address found. Please connect MetaMask.');
      }

      const skillCoinAddress = import.meta.env.VITE_SKILL_COIN_ADDRESS;
      if (!skillCoinAddress) {
        throw new Error('❌ SkillCoin contract address not configured');
      }

      // Step 2: Verify recipient wallet is valid
      if (!recipientWallet || recipientWallet === '0x0000000000000000000000000000000000000000') {
        throw new Error('❌ Invalid recipient wallet address');
      }

      setSuccess(`⏳ Step 1: Checking balance...`);

      // Step 3: Create contract instance with FULL ABI
      const skillCoinContract = new Contract(
        skillCoinAddress,
        [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function transferFrom(address from, address to, uint256 amount) returns (bool)',
          'function approve(address spender, uint256 amount) returns (bool)',
          'function balanceOf(address account) view returns (uint256)',
          'function allowance(address owner, address spender) view returns (uint256)'
        ],
        signer
      );

      // Step 4: Check current balance
      const currentBalance = await skillCoinContract.balanceOf(wallet);
      const amountInWei = BigInt(Math.round(bountyAmount * 1e18));

      console.log('Current balance:', currentBalance.toString());
      console.log('Amount needed:', amountInWei.toString());
      console.log('From wallet:', wallet);
      console.log('To wallet:', recipientWallet);

      if (currentBalance < amountInWei) {
        const balanceInSKC = Number(currentBalance) / 1e18;
        throw new Error(
          `❌ Insufficient balance!\n` +
          `You have: ${balanceInSKC.toFixed(2)} SKC\n` +
          `Need: ${bountyAmount} SKC`
        );
      }

      // Step 5: Execute transfer with proper gas estimation
      setSuccess(`⏳ Step 2: Calculating gas fees...`);
      
      // Get current gas price from network
      const feeData = await provider.getFeeData();
      console.log('Fee data from network:', feeData);
      
      // Polygon Amoy requires minimum gas price
      // If network returns too low, use hardcoded minimum
      const MIN_GAS_PRICE = parseUnits('25', 'gwei'); // 25 gwei minimum for Polygon Amoy
      
      let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || MIN_GAS_PRICE;
      let maxFeePerGas = feeData.maxFeePerGas || MIN_GAS_PRICE;
      
      // Ensure fees meet minimum
      if (maxPriorityFeePerGas < MIN_GAS_PRICE) {
        maxPriorityFeePerGas = MIN_GAS_PRICE;
      }
      if (maxFeePerGas < MIN_GAS_PRICE) {
        maxFeePerGas = MIN_GAS_PRICE;
      }
      
      console.log('Using gas prices:', {
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
        maxFeePerGas: maxFeePerGas.toString()
      });
      
      // Estimate gas needed
      const gasEstimate = await skillCoinContract.transfer.estimateGas(recipientWallet, amountInWei);
      console.log('Gas estimate:', gasEstimate.toString());
      
      // Create transaction with proper gas settings
      const txResponse = await skillCoinContract.transfer(recipientWallet, amountInWei, {
        gasLimit: gasEstimate * BigInt(120) / BigInt(100), // 20% buffer
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
      });
      
      setSuccess(`⏳ Step 2: Sending ${bountyAmount} SKC to recipient...`);
      console.log('Transaction hash:', txResponse.hash);
      
      const tx = txResponse;

      // Step 6: Wait for confirmation
      setSuccess(`⏳ Step 3: Waiting for blockchain confirmation (this may take 10-30 seconds)...`);
      
      const receipt = await tx.wait();
      console.log('Receipt:', receipt);

      if (!receipt) {
        throw new Error('❌ No receipt returned - transaction may have failed');
      }

      if (receipt.status === 0) {
        throw new Error('❌ Transaction failed on blockchain');
      }

      setSuccess(`✅ Step 4: Recording transaction...`);

      // Step 7: Update bounty status in localStorage
      const stored = localStorage.getItem('skillchain_bounties');
      const allBounties = stored ? JSON.parse(stored) : [];

      const bountyIndex = allBounties.findIndex(b => b.id === bountyId);
      if (bountyIndex === -1) {
        throw new Error('❌ Bounty not found');
      }

      const submissionIndex = allBounties[bountyIndex].submissions.findIndex(s => s.id === submissionId);
      if (submissionIndex === -1) {
        throw new Error('❌ Submission not found');
      }

      allBounties[bountyIndex].submissions[submissionIndex].status = 'approved';
      allBounties[bountyIndex].submissions[submissionIndex].approvedAt = new Date().toISOString();
      allBounties[bountyIndex].submissions[submissionIndex].transactionHash = receipt.hash;
      allBounties[bountyIndex].status = 'closed';

      localStorage.setItem('skillchain_bounties', JSON.stringify(allBounties));

      // Step 8: Store transaction record
      const transactions = JSON.parse(localStorage.getItem('skillchain_transactions') || '[]');
      transactions.push({
        id: `tx_${Date.now()}`,
        from: user.email,
        fromWallet: wallet,
        to: allBounties[bountyIndex].submissions[submissionIndex].submittedBy,
        toWallet: recipientWallet,
        amount: bountyAmount,
        type: 'bounty_payment',
        bountyId: bountyId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: 'confirmed',
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('skillchain_transactions', JSON.stringify(transactions));

      // Step 9: Success message
      setSuccess(`✅ Transfer Successful!\n\n${bountyAmount} SKC sent to ${recipientWallet.substring(0, 10)}...\n\nTransaction: ${receipt.hash.substring(0, 10)}...`);

      // Refresh balances after a moment
      setTimeout(async () => {
        await loadSkillCoinBalance();
        await loadBounties();
      }, 2000);

    } catch (err) {
      console.error('Detailed error:', err);
      setError(`❌ Failed to approve bounty:\n\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBounty = async (bountyId, submissionId) => {
    if (!window.confirm('Reject this submission?')) {
      return;
    }

    try {
      setLoading(true);

      const stored = localStorage.getItem('skillchain_bounties');
      const allBounties = stored ? JSON.parse(stored) : [];
      
      const bountyIndex = allBounties.findIndex(b => b.id === bountyId);
      const submissionIndex = allBounties[bountyIndex].submissions.findIndex(s => s.id === submissionId);
      
      allBounties[bountyIndex].submissions[submissionIndex].status = 'rejected';
      
      localStorage.setItem('skillchain_bounties', JSON.stringify(allBounties));

      setSuccess(`❌ Submission rejected.`);
      
      setTimeout(() => loadBounties(), 500);
    } catch (err) {
      setError(`Failed to reject bounty: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || user.role !== 'student') {
    return <Navigate to="/dashboard" />;
  }

  if (loading && bounties.length === 0 && createdBounties.length === 0) {
    return <LoadingSpinner message="Loading bounties..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Student Bounties</h1>
            <p className="text-gray-600 mt-2">Create bounties or complete tasks to earn SkillCoins</p>
          </div>
          <div className="text-right">
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">Your Balance</p>
              <div className="flex items-center space-x-2 mt-1">
                <Coins size={24} className="text-yellow-600" />
                <p className="text-2xl font-bold text-yellow-700">{skillCoinBalance.toFixed(2)}</p>
                <p className="text-sm text-gray-600">SKC</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full justify-center"
            >
              <Plus size={20} />
              <span>Create Bounty</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} className="mb-6" />}
        {success && <Alert type="success" title="Success" message={success} onClose={() => setSuccess(null)} className="mb-6" />}

        {/* Create Bounty Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8 border-l-4 border-blue-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Bounty</h2>
            <form onSubmit={handleCreateBounty} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  SkillCoin Reward <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <Coins size={20} className="text-yellow-600" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    max={Math.floor(skillCoinBalance)}
                    value={createForm.skillCoins}
                    onChange={(e) => setCreateForm({ ...createForm, skillCoins: e.target.value })}
                    placeholder={`e.g., 50 (Max: ${Math.floor(skillCoinBalance)} SKC)`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Amount of SkillCoins to reward (available: {skillCoinBalance.toFixed(2)} SKC)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Task Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Describe what needs to be done... e.g., Fix the bug in the login function, optimize the database query, etc."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Code Repository URL <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <Code size={20} className="text-gray-600" />
                  <input
                    type="url"
                    value={createForm.codeUrl}
                    onChange={(e) => setCreateForm({ ...createForm, codeUrl: e.target.value })}
                    placeholder="https://github.com/username/repo or similar"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">Link to the repository where students can find the code</p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || skillCoinBalance === 0}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  {loading ? 'Creating...' : skillCoinBalance === 0 ? 'Insufficient Balance' : 'Create Bounty'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 flex space-x-8">
          <button
            onClick={() => setTab('browse')}
            className={`pb-4 font-medium transition ${
              tab === 'browse'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Browse Bounties ({bounties.length})
          </button>
          <button
            onClick={() => setTab('created')}
            className={`pb-4 font-medium transition ${
              tab === 'created'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Bounties ({createdBounties.length})
          </button>
          <button
            onClick={() => setTab('submitted')}
            className={`pb-4 font-medium transition ${
              tab === 'submitted'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Submitted ({submittedProofs.length})
          </button>
        </div>

        {/* Browse Bounties Tab */}
        {tab === 'browse' && (
          <div className="space-y-4">
            {bounties.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">No bounties available</p>
                <p className="text-sm text-gray-500 mt-2">Check back later or create your own!</p>
              </div>
            ) : (
              bounties.map((bounty) => (
                <div key={bounty.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{bounty.description.substring(0, 100)}...</h3>
                      <p className="text-sm text-gray-600 mt-2">Created by: {bounty.createdBy}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
                        <Coins size={18} />
                        <span className="font-bold">{bounty.skillCoins} SKC</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium mb-2">Task:</p>
                    <p className="text-sm text-gray-600">{bounty.description}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-700 font-medium mb-2">Code Repository:</p>
                    <a
                      href={bounty.codeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 break-all"
                    >
                      <ExternalLink size={14} />
                      <span>{bounty.codeUrl}</span>
                    </a>
                  </div>

                  <div className="border-t pt-4">
                    {selectedBounty?.id === bounty.id ? (
                      <form onSubmit={(e) => handleSubmitProof(bounty.id, e)} className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Proof URL <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="url"
                            value={submitForm.proofUrl}
                            onChange={(e) => setSubmitForm({ ...submitForm, proofUrl: e.target.value })}
                            placeholder="https://github.com/yourprofile/your-changes"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                          <p className="text-xs text-gray-600 mt-1">Link to your completed work/PR</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Your Wallet Address <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={submitForm.walletAddress}
                            onChange={(e) => setSubmitForm({ ...submitForm, walletAddress: e.target.value })}
                            placeholder="0x..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                          />
                          <p className="text-xs text-gray-600 mt-1">Where to receive SkillCoins if approved</p>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                          >
                            {loading ? 'Submitting...' : 'Submit Proof'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedBounty(null)}
                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setSelectedBounty(bounty)}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        Submit Solution
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* My Bounties Tab */}
        {tab === 'created' && (
          <div className="space-y-4">
            {createdBounties.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">You haven't created any bounties yet</p>
                <p className="text-sm text-gray-500 mt-2">Click "Create Bounty" to get started!</p>
              </div>
            ) : (
              createdBounties.map((bounty) => (
                <div key={bounty.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{bounty.description.substring(0, 100)}...</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                          bounty.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {bounty.status === 'open' ? <Clock size={12} /> : <CheckCircle size={12} />}
                          <span>{bounty.status === 'open' ? 'Open' : 'Closed'}</span>
                        </span>
                        <span className="text-sm text-gray-600">Submissions: {bounty.submissions?.length || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
                      <Coins size={18} />
                      <span className="font-bold">{bounty.skillCoins} SKC</span>
                    </div>
                  </div>

                  {/* Submissions */}
                  {bounty.submissions && bounty.submissions.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="font-semibold text-gray-900 mb-3">Submissions:</p>
                      <div className="space-y-3">
                        {bounty.submissions.map((submission) => (
                          <div key={submission.id} className={`p-4 rounded-lg border ${
                            submission.status === 'approved' ? 'bg-green-50 border-green-200' :
                            submission.status === 'rejected' ? 'bg-red-50 border-red-200' :
                            'bg-yellow-50 border-yellow-200'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{submission.submittedBy}</p>
                                <p className="text-sm text-gray-600 mt-1">Proof:</p>
                                <a
                                  href={submission.proofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 break-all"
                                >
                                  <ExternalLink size={12} />
                                  <span>{submission.proofUrl}</span>
                                </a>
                                <div className="flex items-center space-x-2 mt-2">
                                  <p className="text-sm text-gray-600">Wallet:</p>
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono break-all">
                                    {submission.walletAddress}
                                  </code>
                                  <button
                                    onClick={() => handleCopyToClipboard(submission.walletAddress)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                  >
                                    <Copy size={14} className="text-gray-600" />
                                  </button>
                                </div>
                              </div>
                              <div className="ml-4">
                                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                                  submission.status === 'approved' ? 'bg-green-200 text-green-800' :
                                  submission.status === 'rejected' ? 'bg-red-200 text-red-800' :
                                  'bg-yellow-200 text-yellow-800'
                                }`}>
                                  {submission.status === 'approved' ? <CheckCircle size={12} /> : submission.status === 'rejected' ? <AlertCircle size={12} /> : <Clock size={12} />}
                                  <span>{submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}</span>
                                </span>
                              </div>
                            </div>

                            {submission.status === 'pending' && (
                              <div className="flex space-x-2 mt-3 pt-3 border-t">
                                <button
                                  onClick={() => handleApproveBounty(bounty.id, submission.id, submission.walletAddress, bounty.skillCoins)}
                                  disabled={loading}
                                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 font-medium"
                                >
                                  ✓ Approve & Pay {bounty.skillCoins} SKC
                                </button>
                                <button
                                  onClick={() => handleRejectBounty(bounty.id, submission.id)}
                                  disabled={loading}
                                  className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Submitted Tab */}
        {tab === 'submitted' && (
          <div className="space-y-4">
            {submittedProofs.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">You haven't submitted any bounties yet</p>
                <p className="text-sm text-gray-500 mt-2">Browse available bounties and submit your solutions!</p>
              </div>
            ) : (
              submittedProofs.map((submission) => (
                <div key={submission.id} className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                  submission.status === 'approved' ? 'border-l-green-500 bg-green-50' :
                  submission.status === 'rejected' ? 'border-l-red-500 bg-red-50' :
                  'border-l-yellow-500 bg-yellow-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{submission.bountyTitle}</h3>
                      <p className="text-sm text-gray-600 mt-2">Creator: {submission.bountyCreator}</p>
                      <div className="flex items-center space-x-2 mt-3">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'approved' ? 'bg-green-200 text-green-800' :
                          submission.status === 'rejected' ? 'bg-red-200 text-red-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {submission.status === 'approved' ? <CheckCircle size={12} /> : submission.status === 'rejected' ? <AlertCircle size={12} /> : <Clock size={12} />}
                          <span>{submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}</span>
                        </span>
                        {submission.status === 'approved' && (
                          <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                            <Zap size={12} />
                            <span>+{submission.bountySkillCoins} SKC</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-white bg-opacity-50 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium mb-2">Your Proof URL:</p>
                    <a
                      href={submission.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 break-all"
                    >
                      <ExternalLink size={14} />
                      <span>{submission.proofUrl}</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBountyPage;
