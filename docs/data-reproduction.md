# Reproduce the WCC movement artifacts

[Documentation index](README.md) · [Project overview](../README.md)

## Offline sample

The checked-in sample is synthetic and exists only to exercise the complete
builder from a clean clone. Follow the root README command; no network access or
private file is required.

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

Then run the full-data builder command from the root README. The downloaded
files, listing manifest and hashes stay under ignored `data/`; do not commit
publisher exports. The repository's Apache-2.0 licence covers project code and
the synthetic sample, not third-party WCC/VivaCity records.
