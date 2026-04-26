#!/bin/bash

# Exit on any error
set -e

echo "======================================================="
echo "Funding CLI Identities on Stellar Testnet"
echo "======================================================="

# List of required identities
IDENTITIES=("alice" "buyer" "inspector" "seller" "organizer")

for ID in "${IDENTITIES[@]}"; do
    if stellar keys ls | grep -q "\b$ID\b"; then
        echo "Identity '$ID' already exists. Re-funding via Friendbot just in case..."
        # In CLI v23+, checking the address and hitting friendbot is easiest this way:
        ADDRESS=$(stellar keys address $ID)
        curl -s "https://friendbot.stellar.org/?addr=$ADDRESS" > /dev/null
        echo "✓ $ID ($ADDRESS) funded on Testnet."
    else
        echo "Generating identity '$ID' and funding on Testnet..."
        stellar keys generate $ID --network testnet
        echo "✓ $ID generated and funded."
    fi
done

echo ""
echo "All identities are ready and funded!"
