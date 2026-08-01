const identifier = String.raw`"?[a-zA-Z_][\w$]*"?`;

function normalize(value) {
  return value.replaceAll('"', "").toLowerCase();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collect(regex, source, transform = (match) => match[1]) {
  return [...source.matchAll(regex)].map(transform);
}

export function auditRlsSchema(schema) {
  const findings = [];
  const tables = [
    ...new Set(
      collect(
        new RegExp(
          String.raw`create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(${identifier})`,
          "gi",
        ),
        schema,
        (match) => normalize(match[1]),
      ),
    ),
  ].sort();

  for (const table of tables) {
    const escaped = escapeRegex(table);
    const enablesRls = new RegExp(
      String.raw`alter\s+table\s+(?:if\s+exists\s+)?public\."?${escaped}"?\s+enable\s+row\s+level\s+security`,
      "i",
    ).test(schema);
    if (!enablesRls) {
      findings.push({ rule: "table-rls-enabled", object: `public.${table}` });
    }
  }

  if (/auth\.role\s*\(\s*\)/i.test(schema)) {
    findings.push({ rule: "avoid-auth-role-function", object: "migration schema" });
  }

  const views = collect(
    new RegExp(
      String.raw`create\s+(?:or\s+replace\s+)?view\s+public\.(${identifier})([\s\S]*?);`,
      "gi",
    ),
    schema,
    (match) => ({ name: normalize(match[1]), definition: match[0] }),
  );
  for (const view of views) {
    if (!/security_invoker\s*=\s*(?:true|on)/i.test(view.definition)) {
      findings.push({ rule: "view-security-invoker", object: `public.${view.name}` });
    }
  }

  const updatePolicies = collect(
    /create\s+policy\s+("[^"]+"|\S+)\s+on\s+([\w."$]+)\s+for\s+update\b([\s\S]*?);/gi,
    schema,
    (match) => ({
      name: normalize(match[1]),
      table: normalize(match[2]),
      definition: match[0],
    }),
  );
  const currentUpdatePolicies = new Map();
  for (const policy of updatePolicies) {
    currentUpdatePolicies.set(`${policy.table}:${policy.name}`, policy);
  }
  for (const policy of currentUpdatePolicies.values()) {
    if (!/\bwith\s+check\s*\(/i.test(policy.definition)) {
      findings.push({ rule: "update-policy-with-check", object: policy.table });
    }
  }

  const functions = collect(
    new RegExp(
      String.raw`create\s+(?:or\s+replace\s+)?function\s+public\.(${identifier})\s*\(([\s\S]*?)\)\s*([\s\S]*?)(?:\$[a-zA-Z_\d]*\$[\s\S]*?\$[a-zA-Z_\d]*\$\s*;)`,
      "gi",
    ),
    schema,
    (match) => ({ name: normalize(match[1]), definition: match[0] }),
  ).filter((fn) => /security\s+definer/i.test(fn.definition));

  for (const fn of functions) {
    if (!/\bset\s+search_path\s*=\s*(?:''|pg_catalog(?:\s*,\s*pg_temp)?)/i.test(fn.definition)) {
      findings.push({ rule: "definer-search-path", object: `public.${fn.name}` });
    }
    const revoke = new RegExp(
      String.raw`revoke\s+(?:all|execute)\s+on\s+function\s+public\."?${escapeRegex(fn.name)}"?\s*\([\s\S]*?\)\s+from\s+[^;]*\bpublic\b[^;]*;`,
      "i",
    );
    if (!revoke.test(schema)) {
      findings.push({ rule: "definer-revoke-public", object: `public.${fn.name}` });
    }
  }

  return { tables, views, definerFunctions: functions.map((fn) => fn.name), findings };
}
