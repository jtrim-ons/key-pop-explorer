#!/bin/bash

cat output-classifications.json | jq 'map(. | {code: ., label: null, categories: null, bacap_code: ""})' > output-classifications-with-details.json

