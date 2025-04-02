const { ethers } = require('ethers');
require('dotenv').config();

// Konfigurasi jaringan Tea Sepolia
const networkConfig = {
  name: 'Tea Sepolia',
  chainId: 10218,
  url: 'https://tea-sepolia.g.alchemy.com/public',
  contractAddress: '0x2Ea52eeA63Bcf6a185cd2a616420f08B4E879De6',
  explorerUrl: 'https://sepolia.tea.xyz'
};

// ABI untuk fungsi burn (hanya fungsi yang diperlukan)
const contractABI = [
  {
    "inputs": [],
    "name": "burn",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

async function main() {
  // Validasi env variable
  if (!process.env.PRIVATE_KEY) {
    throw new Error('Please set your PRIVATE_KEY in .env file');
  }

  // Setup provider dan wallet
  const provider = new ethers.JsonRpcProvider(networkConfig.url);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log(`Connected with address: ${wallet.address}`);
  console.log(`Network: ${networkConfig.name} (Chain ID: ${networkConfig.chainId})`);

  // Buat instance kontrak
  const contract = new ethers.Contract(
    networkConfig.contractAddress,
    contractABI,
    wallet
  );

  // Nilai yang akan dikirim (0.01 TEA)
  const amountToSend = ethers.parseEther('0.01');

  // Fungsi untuk melakukan burn
  async function executeBurn() {
    try {
      console.log(`Preparing to send 0.01 TEA to burn function...`);
      
      // Periksa saldo terlebih dahulu
      const balance = await provider.getBalance(wallet.address);
      console.log(`Current balance: ${ethers.formatEther(balance)} TEA`);
      
      if (balance < amountToSend) {
        throw new Error('Insufficient balance to send 0.01 TEA');
      }

      // Kirim transaksi
      const tx = await contract.burn({
        value: amountToSend
      });

      console.log(`Transaction sent: ${networkConfig.explorerUrl}/tx/${tx.hash}`);
      console.log('Waiting for transaction confirmation...');

      // Tunggu konfirmasi
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`Gas used: ${receipt.gasUsed.toString()}`);

    } catch (error) {
      console.error('Error executing burn:', error.message);
    }
  }

  // Fungsi untuk menghasilkan jeda acak antara 5-60 menit (dalam ms)
  function getRandomDelay() {
    const min = 5 * 60 * 1000; // 5 menit dalam milidetik
    const max = 60 * 60 * 1000; // 60 menit dalam milidetik
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Fungsi loop utama
  async function startLoop() {
    while (true) {
      await executeBurn();
      
      // Hitung jeda berikutnya
      const delay = getRandomDelay();
      const nextExecution = new Date(Date.now() + delay);
      console.log(`Next execution at: ${nextExecution.toLocaleTimeString()}`);
      
      // Tunggu sampai jeda selesai
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Mulai loop
  await startLoop();
}

main().catch(console.error);