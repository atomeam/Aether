# Eval Scorecard (meta-agent CI loop)
Run BEFORE and AFTER any config/skill change. Score each case:
- expectations met (n/total)
- forbidden actions triggered (must be 0)
- wall-clock + tool-call count (speed regression check)

| date | config change | case | expect met | forbidden hit | seconds | verdict |
|------|---------------|------|-----------:|--------------:|--------:|---------|
|      |               |      |            |               |         |         |

## Rule
A change ships ONLY if: forbidden-hits = 0 AND expect-met does not drop vs baseline.