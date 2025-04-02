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
    
    // Hitung total yang akan dikirim (maksimum 110 penerima per hari)
    const maxRecipientsPerDay = 110;
    const recipientsToProcess = recipients.slice(0, maxRecipientsPerDay);
    const totalAmount = parseFloat(config.amountToSend) * recipientsToProcess.length;
    const totalAmountWei = ethers.parseEther(totalAmount.toString());
    
    if (balance < totalAmountWei) {
      const msg = `** Saldo tidak cukup untuk mengirim ke ${recipientsToProcess.length} wallet (Dibutuhkan: ${totalAmount} ETH, Saldo: ${balanceEth} ETH)`;
      console.log(msg);
      await sendTelegramNotification(msg);
      return;
    }
    
    // Proses transfer ke setiap penerima (maksimum 110)
    let successfulTransfers = 0;
    for (const recipient of recipientsToProcess) {
      const success = await sendTransfer(recipient, config.amountToSend);
      if (success) {
        successfulTransfers++;
      }
      
      // Tunggu 5 detik antara transfer
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    const endMessage = `\n** <b>Daily Transfers Completed</b>\n` +
      `• Total recipients attempted: ${recipientsToProcess.length}\n` +
      `• Successful transfers: ${successfulTransfers}\n` +
      `• Amount per recipient: ${config.amountToSend} ETH\n` +
      `• Total sent: ${successfulTransfers * parseFloat(config.amountToSend)} ETH\n` +
      `• Sender balance after: ${ethers.formatEther(balance - (BigInt(successfulTransfers) * ethers.parseEther(config.amountToSend)))} ETH\n` +
      `• Next batch will start after 24 hours`;
    
    console.log(endMessage);
    await sendTelegramNotification(endMessage);
    
    // Jika masih ada penerima yang belum diproses, tunggu 24 jam
    if (recipients.length > maxRecipientsPerDay) {
      const remainingRecipients = recipients.length - maxRecipientsPerDay;
      const hoursToWait = 24;
      
      console.log(`\n** Menunggu ${hoursToWait} jam untuk batch berikutnya`);
      console.log(`** Sisa wallet yang akan diproses: ${remainingRecipients}`);
      
      await sendTelegramNotification(
        `** <b>Waiting for next batch</b>\n` +
        `• Next batch in: ${hoursToWait} hours\n` +
        `• Remaining recipients: ${remainingRecipients}`
      );
      
      // Tunggu 24 jam (dalam milidetik)
      await new Promise(resolve => setTimeout(resolve, hoursToWait * 60 * 60 * 1000));
      
      // Jalankan kembali proses untuk batch berikutnya
      console.log(`\n** Memulai batch berikutnya setelah ${hoursToWait} jam`);
      await autoTransfer();
    }
    
  } catch (error) {
    console.error("** Error utama:", error.message);
    await sendTelegramNotification(
      `** <b>Critical Error</b>\n` +
      `• Error: ${error.message}\n` +
      `• Action: Please check the bot immediately`
    );
  }
}
