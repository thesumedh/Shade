# Changelog

All notable changes to Shade are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-08-12

### Added
- Initial release of **Shade — Shielded Intent Matching Engine**
- Compact ZK smart contract with `submit_order`, `match_orders`, `cancel_order`, and `transfer_tokens` circuits
- ZK-based ownership proof via commitment pre-image (`cancel_order` circuit)
- Privacy-preserving order matching: prices, sizes, and identities stay off-chain
- CLI (`shade-cli`) for contract deployment and interaction on Midnight PreProd/Preview
- Next.js frontend with split-screen trading UI
- WebSocket relay server for broadcasting order commitments between peers
- Browser-compatible ZK config provider fetching assets from Next.js `public/zk/`
- Support for Midnight Lace Wallet (DApp Connector API v4)
- End-to-end integration tests
