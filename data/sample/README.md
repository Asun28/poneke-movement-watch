# Minimal transport-sensor sample

This directory contains a deliberately small, synthetic fixture with the same
column shape consumed by `scripts/build_demo.py`:

- two fictional Wellington countlines;
- 12 prior matched weekday/hour observations per countline;
- one target observation per countline on 6 August 2026.

It exists only to verify that a clean clone can run the complete artifact
builder without network access. It is not WCC source data, training data,
representative coverage, emergency evidence or an accuracy benchmark.

The synthetic fixture is covered by the repository's Apache-2.0 licence.
