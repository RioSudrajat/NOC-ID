FROM rust:1.85-bookworm

ARG SOLANA_VERSION=v2.1.21
ARG ANCHOR_VERSION=0.31.1

ENV DEBIAN_FRONTEND=noninteractive
ENV PATH="/usr/local/cargo/bin:/root/.local/share/solana/install/active_release/bin:${PATH}"
ENV NO_DNA=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    git \
    libssl-dev \
    libudev-dev \
    pkg-config \
    protobuf-compiler \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

RUN sh -c "$(curl -sSfL https://release.anza.xyz/${SOLANA_VERSION}/install)"

RUN cargo install --git https://github.com/coral-xyz/anchor --tag v${ANCHOR_VERSION} anchor-cli --locked

RUN rustup toolchain install nightly --profile minimal

WORKDIR /workspace

CMD ["bash"]
