FROM rust:latest as builder
WORKDIR /home/andreas/git/verbal

RUN cargo init

COPY ./Cargo.toml ./Cargo.toml

RUN cargo build --release
RUN rm ./src/*.rs

COPY ./src ./src

RUN rm ./target/release/deps/verbal*
RUN cargo build --release

COPY ./app ./app
COPY ./www ./www
COPY ./tailwind.config.js ./tailwind.config.js

ARG VERSION

COPY ./script ./script
RUN ./script/build --mode=prod

CMD ["./target/release/verbal"]
