FROM rust:latest as builder
WORKDIR /home/andreas/git/verbal

RUN cargo init

COPY ./Cargo.lock ./Cargo.lock
COPY ./Cargo.toml ./Cargo.toml

RUN cargo build --release
RUN rm ./src/*.rs

COPY ./src ./src

RUN rm ./target/release/deps/verbal*
RUN cargo build --release

CMD ["./target/release/verbal"]
