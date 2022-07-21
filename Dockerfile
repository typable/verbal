FROM rust:latest as builder
WORKDIR /home/andreas/git/verbal
COPY . .
RUN cargo build --release
CMD ["./target/release/verbal"]
