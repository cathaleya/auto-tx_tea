Petunjuk Penggunaan:

git clone https://github.com/cathaleya/auto-tx_tea.git

Instalasi:

bash Copy
npm init -y
npm install
npm install chalk figlet ora ethers axios dotenv

Struktur File:

Copy
/project-folder
├── .env
├── wallets.txt
└── autoTransfer.cjs
create File: .env

nano .env

Copy dan pastekan kedalam .env

PRIVATE_KEY="your_main_wallet_private_key"
AMOUNT="0.01" # Jumlah ETH yang akan dikirim per wallet

# Konfigurasi Telegram
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"


create File wallets.txt:

nano wallets.txt

Copy ke wallets.txt

0xRecipientWalletAddress1
0xRecipientWalletAddress2
0xRecipientWalletAddress3

Run bot

node auto_tx.js

Fitur Bot:

Membaca daftar penerima dari file wallets.txt

Transfer dengan gas price otomatis (dengan batas maksimum)

Penanganan error yang baik

Bisa dijalankan sekali atau terjadwal

Logging detail setiap transaksi

Eksekusi:

Keamanan:
Simpan private key HANYA di file .env

File wallets.txt hanya berisi alamat penerima (tanpa private key)

Verifikasi semua alamat sebelum digunakan

Bot ini bisa dimodifikasi untuk:

Menambahkan transfer token ERC20 selain ETH

Mengimplementasikan whitelist/blacklist

Menambahkan notifikasi via Telegram/Email

Multi-signature untuk keamanan tambahan
