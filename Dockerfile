FROM rust:latest as builder
WORKDIR /home/andreas/git/verbal

RUN curl -sLO https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-linux-x64
RUN chmod +x tailwindcss-linux-x64
RUN mv tailwindcss-linux-x64 tailwindcss

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
COPY ./build ./build

COPY ./www/worker.js ./www/worker.js
COPY ./.version ./.version

RUN ./build

CMD ["./target/release/verbal"]
