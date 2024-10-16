#! /usr/bin/env bash
# Usage: scrape.sh <path_to_sis_scraper> <path_to_racs>
# Example: scrape.sh ~/Documents/Programming/quacs/scrapers ~/Documents/Programming/racs
set -e
pushd $1
python sis_scraper/main.py 202405 202409 202501
jq -s '{"202405":.[0],"202409":.[1],"202501":.[2]}' -c data/202405/catalog_sis.json data/202409/catalog_sis.json data/202501/catalog_sis.json >$2/app/catalog_sis.json
jq -s '{"202405":.[0], "202409":.[1],"202501":.[2]}' -c data/202405/courses.json data/202409/courses.json data/202501/courses.json >$2/app/courses.json
popd
