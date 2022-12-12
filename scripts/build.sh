#!/bin/bash

print() {
  printf "%-8s %s\n" $1 $2
}

section() {
  echo ""
  printf "%2s%-48s" "" $1 | tr ' ' '-'
  printf "\n"
}

DIST_DIR="dist"
LIB_DIR="$DIST_DIR/libs"
FONT_DIR="$DIST_DIR/fonts"
IMAGE_DIR="$DIST_DIR/images"

if [[ -d "$DIST_DIR" ]]; then
  section "CLEAN"
  rm -rf "$DIST_DIR"
  print "remove" "$DIST_DIR/"
fi

section "DEPS"

print "create" "$DIST_DIR/"
mkdir -p "$DIST_DIR"
print "create" "$LIB_DIR/"
mkdir -p "$LIB_DIR"
print "create" "$FONT_DIR/"
mkdir -p "$FONT_DIR"
print "create" "$IMAGE_DIR/"
mkdir -p "$IMAGE_DIR"
cp www/assets/images/* "$IMAGE_DIR/"

# tabler-icons
print "download" "tabler-icons"
curl -sL https://cdn.jsdelivr.net/npm/@tabler/icons@latest/iconfont/tabler-icons.min.css -o "$LIB_DIR/tabler-icons.min.css"
sed -i -e "s/fonts\/tabler-icons/..\/fonts\/tabler-icons/g" "$LIB_DIR/tabler-icons.min.css"
print "download" "tabler-icons-font"
curl -sL https://cdn.jsdelivr.net/npm/@tabler/icons@latest/iconfont/fonts/tabler-icons.eot -o "$FONT_DIR/tabler-icons.eot"
curl -sL https://cdn.jsdelivr.net/npm/@tabler/icons@latest/iconfont/fonts/tabler-icons.ttf -o "$FONT_DIR/tabler-icons.ttf"
curl -sL https://cdn.jsdelivr.net/npm/@tabler/icons@latest/iconfont/fonts/tabler-icons.woff -o "$FONT_DIR/tabler-icons.woff"
curl -sL https://cdn.jsdelivr.net/npm/@tabler/icons@latest/iconfont/fonts/tabler-icons.woff2 -o "$FONT_DIR/tabler-icons.woff2"

# inter
print "download" "inter-font"
curl -sL https://fonts.google.com/download?family=Inter -o "$FONT_DIR/inter.zip"
unzip -qq "$FONT_DIR/inter.zip" -d "$FONT_DIR/inter"
mv "$FONT_DIR/inter/static/Inter-Regular.ttf" "$FONT_DIR/"
mv "$FONT_DIR/inter/static/Inter-Medium.ttf" "$FONT_DIR/"
mv "$FONT_DIR/inter/static/Inter-SemiBold.ttf" "$FONT_DIR/"
rm -rf "$FONT_DIR/inter"
rm -rf "$FONT_DIR/inter.zip"

section "BUILD"

# typescript
print "build" "typescript"
deno bundle "app/main.ts" "$DIST_DIR/bundle.js"
print "minify" "typescript"
minify --type=js -o "$DIST_DIR/bundle.min.js" "$DIST_DIR/bundle.js"

# styles
print "build" "styles"
sass "www/assets/styles/style.scss" "$DIST_DIR/style.css" --no-source-map
print "minify" "styles"
minify --type=css -o "$DIST_DIR/style.min.css" "$DIST_DIR/style.css"

STATUS="$?"

section

if [[ "$STATUS" != "0" ]]; then
  print "status" "failed"
  echo ""
  exit 1
fi

print "status" "success"
echo ""
