// Fungsi untuk melakukan transfer
async function sendTransfer(recipient, amount) {
  try {
    const gasPrice = await getAdjustedGasPrice();
    const amountWei = ethers.parseEther(amount.toString());
    
    console.log(`\n** Mengirim ${amount} ETH ke ${recipient}`);
    console.log(`* Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
    
    const tx = await senderWallet.sendTransaction({
      to: recipient,
      value: amountWei,
      gasPrice: gasPrice
    });
    
    const txUrl = `${networkConfig.explorerUrl}/tx/${tx.hash}`;
    console.log(`** TX Hash: ${txUrl}`);
    
    // Notifikasi Telegram - TX dikirim
    await sendTelegramNotification(
      `** <b>Transfer Initiated</b>\n` +
      `• From: <code>${senderWallet.address}</code>\n` +
      `• To: <code>${recipient}</code>\n` +
      `• Amount: ${amount} ETH\n` +
      `• Gas: ${ethers.formatUnits(gasPrice, 'gwei')} gwei\n` +
      `• TX: <a href="${txUrl}">View on Explorer</a>`
    );
    
    const receipt = await tx.wait();
    console.log(`* Berhasil! Blok: ${receipt.blockNumber}`);
    console.log(`** Biaya gas: ${ethers.formatEther(receipt.fee)} ETH`);
    
    // Notifikasi Telegram - TX berhasil
    await sendTelegramNotification(
      `* <b>Transfer Success</b>\n` +
      `• To: <code>${recipient}</code>\n` +
      `• Block: ${receipt.blockNumber}\n` +
      `• Fee: ${ethers.formatEther(receipt.fee)} ETH\n` +
      `• TX: <a href="${txUrl}">View on Explorer</a>`
    );
    
    return true;
  } catch (error) {
    console.error(`** Gagal mengirim ke ${recipient}:`, error.message);
    
    // Notifikasi Telegram - TX gagal
    await sendTelegramNotification(
      `** <b>Transfer Failed</b>\n` +
      `• To: <code>${recipient}</code>\n` +
      `• Error: ${error.message}\n` +
      `• Action: Please check manually`
    );
    
    return false;
  }
}

// Fungsi utama
async function autoTransfer() {
  try {
    console.log(`\n** Memulai bot auto transfer`);
    console.log(`** ${new Date().toLocaleString()}`);
    
    const startMessage = `** <b>Auto Transfer Bot Started</b>\n` +
      `• Network: ${networkConfig.name}\n` +
      `• Sender: <code>${senderWallet.address}</code>\n` +
      `• Time: ${new Date().toLocaleString()}`;
    
    await sendTelegramNotification(startMessage);
    
    // Cek saldo pengirim
    const balance = await provider.getBalance(senderWallet.address);
    const balanceEth = ethers.formatEther(balance);
    console.log(`** Saldo: ${balanceEth} ETH`);
    
    if (balance === 0n) {
      const msg = "** Saldo tidak mencukupi (0 ETH)";
      console.log(msg);
      await sendTelegramNotification(msg);
      return;
    }
    
    // Baca daftar penerima
    const recipients = readRecipientWallets();
    console.log(`** Ditemukan ${recipients.length} wallet penerima`);
    
    if (recipients.length === 0) {
      const msg = "** Tidak ada alamat penerima yang valid";
      console.log(msg);
      await sendTelegramNotification(msg);
      return;
    }
    
    // Hitung total yang akan dikirim
    const totalAmount = parseFloat(config.amountToSend) * recipients.length;
    const totalAmountWei = ethers.parseEther(totalAmount.toString());
    
    if (balance < totalAmountWei) {
      const msg = `** Saldo tidak cukup untuk mengirim ke ${recipients.length} wallet (Dibutuhkan: ${totalAmount} ETH, Saldo: ${balanceEth} ETH)`;
      console.log(msg);
      await sendTelegramNotification(msg);
      return;
    }
    
    // Proses transfer ke setiap penerima
    for (const recipient of recipients) {
      await sendTransfer(recipient, config.amountToSend);
      
      // Tunggu 5 detik antara transfer
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    const endMessage = `\n** <b>All Transfers Completed</b>\n` +
      `• Total recipients: ${recipients.length}\n` +
      `• Amount per recipient: ${config.amountToSend} ETH\n` +
      `• Total sent: ${totalAmount} ETH\n` +
      `• Sender balance after: ${ethers.formatEther(balance - totalAmountWei)} ETH`;
    
    console.log(endMessage);
    await sendTelegramNotification(endMessage);
    
  } catch (error) {
    console.error("** Error utama:", error.message);
    await sendTelegramNotification(
      `** <b>Critical Error</b>\n` +
      `• Error: ${error.message}\n` +
      `• Action: Please check the bot immediately`
    );
  }
}