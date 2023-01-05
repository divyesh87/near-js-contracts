#!/bin/sh

echo ">> Building contract"

near-sdk-js build src/index.ts build/nft.wasm
