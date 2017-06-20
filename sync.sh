#!/bin/bash
cd lambda
zip -r lambda.zip .
aws lambda update-function-code --function-name CoinWatcher \
    --zip-file fileb://$(pwd)/lambda.zip
rm lambda.zip
cd ..
