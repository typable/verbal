#!/bin/bash

target=verbal
cd /srv/$target

git --git-dir=../$target/.git --work-tree=../$target pull origin main

/home/andreas/.cargo/bin/cargo build --release
./script/build --mode=prod

sudo systemctl restart $target
