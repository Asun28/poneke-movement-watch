# Reproduce the WCC movement artifacts

[Documentation index](README.md) · [Project overview](../README.md)

## Offline sample

The checked-in sample is synthetic and exists only to exercise the complete
builder from a clean clone. No network access or private file is required.

From the repository root:

```powershell
.\.venv\Scripts\python scripts\build_demo.py `
  --data-dir data\sample\transport_sensors `
  --metadata data\sample\countline_meta_info_sample.csv `
  --target-at 2026-08-06T08:00:00+12:00 `
  --replay-start-at 2026-08-06T08:00:00+12:00 `
  --replay-end-at 2026-08-06T08:00:00+12:00 `
  --output-dir artifacts\local\sample-build
```

The output contains the four v1 artifacts and two deterministic synthetic
movement candidates. It is a pipeline fixture, not a benchmark or evidence pack.

## Full public WCC files

WCC's [Transport Sensors layer](https://gis.wcc.govt.nz/arcgis/rest/services/Transportation/Transport_Sensors/FeatureServer/0)
describes the source as public and refreshed at least monthly. The official
object store is:

`https://gis-snowflake-opendata-public-wcc-arcgis-prod.s3.ap-southeast-2.amazonaws.com`

The files are mutable publisher exports, so record the listing metadata and
calculate local SHA-256 hashes at download time:

```powershell
$bucket = "https://gis-snowflake-opendata-public-wcc-arcgis-prod.s3.ap-southeast-2.amazonaws.com"
$prefix = "transport_sensors/countline_mobility/parquet/"
$dataDir = [IO.Path]::GetFullPath((Join-Path (Get-Location) "data\transport_sensors"))
$metadata = [IO.Path]::GetFullPath((Join-Path (Get-Location) "data\countline_meta_info.csv"))

New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
[xml]$listing = (Invoke-WebRequest "$bucket/?list-type=2&prefix=$prefix").Content
$objects = $listing.ListBucketResult.Contents | Where-Object { $_.Key -like "*.parquet" }
$objects | Select-Object Key, LastModified, ETag, Size |
  ConvertTo-Json | Set-Content "data\wcc-source-manifest.json"

foreach ($object in $objects) {
  Invoke-WebRequest "$bucket/$($object.Key)" -OutFile (Join-Path $dataDir ([IO.Path]::GetFileName($object.Key)))
}
Invoke-WebRequest "$bucket/transport_sensors/countline_meta_info/csv/countline_meta_info.csv" -OutFile $metadata

Get-ChildItem $dataDir, $metadata -File | Sort-Object FullName | ForEach-Object {
  $hash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  "$hash  $($_.FullName)"
} | Set-Content "data\SHA256SUMS.txt"
```

Then build the August v1 artifacts:

```powershell
.\.venv\Scripts\python scripts\build_demo.py `
  --data-dir data\transport_sensors `
  --metadata data\countline_meta_info.csv `
  --target-at 2026-08-06T12:00:00+12:00 `
  --replay-start-at 2026-08-01T00:00:00+12:00 `
  --replay-end-at 2026-08-06T23:00:00+12:00 `
  --output-dir site\public\cop\v1
```

Build the v2 ontology projection:

```powershell
.\.venv\Scripts\python scripts\build_ontology_demo.py `
  --tickets artifacts\ontology-replay-ticket.json `
  --movement-signals site\public\cop\v1\movement-signals.geojson `
  --output-dir site\public\cop\v2 `
  --corridor-countline-id 48038
```

The downloaded files, listing manifest and hashes stay under ignored `data/`;
do not commit publisher exports. The repository's Apache-2.0 licence covers
project code and the synthetic sample, not third-party WCC/VivaCity records.
