echo ""
echo ""

# Generate Client Key
echo "Client Key:"
CLIENT_KEY=$( head -c 50 /dev/urandom | sha256sum )
echo ${CLIENT_KEY::-32}

echo ""
echo ""
