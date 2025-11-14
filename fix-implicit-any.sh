#!/bin/bash

# Fix implicit 'any' type errors in .map() callbacks
# Replace common patterns like .map((item) => with .map((item: any) =>

find app -name "*.tsx" -type f -exec sed -i 's/\.map((\([a-zA-Z_][a-zA-Z0-9_]*\)) =>/\.map((\1: any) =>/g' {} \;
find app -name "*.tsx" -type f -exec sed -i 's/\.map((\([a-zA-Z_][a-zA-Z0-9_]*\), \([a-zA-Z_][a-zA-Z0-9_]*\)) =>/\.map((\1: any, \2: number) =>/g' {} \;

echo "Fixed implicit any types in map callbacks"
