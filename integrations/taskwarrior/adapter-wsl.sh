#!/usr/bin/env bash
set -euo pipefail
TASK_BIN="${AETHER_TASK_BIN:-task}"
safe_export() {
    local tmpfile
    tmpfile=$(mktemp /tmp/tw-export-XXXXXX.json)
    $TASK_BIN export > "$tmpfile" 2>/dev/null
    local rc=$?
    if [ $rc -ne 0 ]; then rm -f "$tmpfile"; echo "{\"error\":\"export failed\",\"code\":$rc}" >&2; return $rc; fi
    echo "$tmpfile"
}
clean_task() { jq 'map({uuid,description,status,entry,end,tags,project,priority,due,waiting,modify,start})' "$1" 2>/dev/null; }
# Filter syntax: task 2.6.2 chokes on filter expressions in export.
# Workaround: export all, filter via jq. Accepts status:STATUS, project:NAME, +tag.
apply_filter() {
    local tmpfile="$1"; local filter="$2"; local out="$tmpfile"
    if [ -z "$filter" ]; then echo "$out"; return; fi
    local filtered; filtered=$(mktemp /tmp/tw-filtered-XXXXXX.json)
    local jqfilter="."
    for token in $filter; do
        case "$token" in
            status:*)   jqfilter="$jqfilter | map(select(.status == \"${token#status:}\"))" ;;
            project:*)  jqfilter="$jqfilter | map(select(.project == \"${token#project:}\"))" ;;
            +*)         jqfilter="$jqfilter | map(select(.tags != null and (.tags | index(\"${token#+}\"))))" ;;
        esac
    done
    jq "$jqfilter" "$out" > "$filtered" 2>/dev/null
    echo "$filtered"
}
cmd_list() {
    local filter="${*:-}"; local t; t=$(safe_export "") || return 1
    local f; f=$(apply_filter "$t" "$filter"); clean_task "$f"; rm -f "$f" "$t"
}
cmd_get() {
    local uuid="$1"; [ -z "$uuid" ] && echo '{"error":"uuid required"}' >&2 && exit 1
    local t; t=$(safe_export "") || return 1
    jq "map(select(.uuid == \"$uuid\"))[0] // {\"error\":\"not found\",\"uuid\":\"$uuid\"}" "$t"
    rm -f "$t"
}
cmd_export() {
    local filter="${*:-}"; local t; t=$(safe_export "") || return 1
    local f; f=$(apply_filter "$t" "$filter"); cat "$f"; rm -f "$f" "$t"
}
cmd_create() {
    local desc="$1"; local tags="${2:-}"; [ -z "$desc" ] && echo '{"error":"desc required"}' >&2 && exit 1
    local args=("$desc"); if [ -n "$tags" ]; then IFS="," read -ra ta <<< "$tags"; for tag in "${ta[@]}"; do args+=("+${tag}"); done; fi
    local out; out=$($TASK_BIN add "${args[@]}" 2>&1); local id; id=$(echo "$out" | grep -oP 'Created task \K[0-9]+' || echo '')
    if [ -n "$id" ]; then local t; t=$(safe_export "") || return 1; jq "map(select(.id == $id))[0]" "$t"; rm -f "$t"
    else echo '{"error":"create failed"}' >&2; return 1; fi
}
cmd_done() {
    local uuid="$1"; [ -z "$uuid" ] && echo '{"error":"uuid required"}' >&2 && exit 1
    local t; t=$(safe_export "") || return 1
    local id; id=$(jq -r "map(select(.uuid == \"$uuid\"))[0].id // empty" "$t"); rm -f "$t"
    [ -z "$id" ] && echo "{\"error\":\"not found\",\"uuid\":\"$uuid\"}" >&2 && exit 1
    $TASK_BIN "$id" done 2>&1 >/dev/null
    echo "{\"uuid\":\"$uuid\",\"id\":$id,\"status\":\"completed\",\"action\":\"done\"}"
}
[[ $# -lt 1 ]] && echo '{"error":"usage: list|get|create|done"}' >&2 && exit 1
CMD="$1"; shift
case "$CMD" in
    list)   cmd_list "$@" ;;
    get)    cmd_get "$@" ;;
    create) cmd_create "$@" ;;
    done)   cmd_done "$@" ;;
    *)      echo '{"error":"unknown command"}' >&2; exit 1 ;;
esac
