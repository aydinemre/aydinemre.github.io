# Week 9 · Views, permissions, and budgets

Semester week 9, lecture set 08. The PDF is forthcoming; this is an original educational adaptation of the official scope. Allow 20–30 minutes. No official assignment or deadline is set.

Requirement: Python 3. Run commands **from this lab folder**. The program creates no actual VM/container, mount, cgroup, root operation, host-secret access, or host OOM. It makes policy decisions using dictionaries and numbers only.

## Predict first

A: local PID1 / host PID410. B: local PID1 / host PID520. These are example identities, not observations. Both scopes expose read-only `/app/config` and read-write `/app/data`. `/host/secret` is hidden. A viewer requests only read, an editor read/write; the exposed mount mode is checked separately.

```sh
python3 isolation_budget.py --scope a --role viewer --path /app/config --action read
python3 isolation_budget.py --scope a --role viewer --path /app/data --action write
python3 isolation_budget.py --scope a --role editor --path /app/config --action write
python3 isolation_budget.py --scope a --role editor --path /host/secret --action read
```

Predict the access decision for each command. HIDDEN means the path is absent from the model view, not encrypted. Equal local PIDs can identify different objects. The model mount list opens no actual paths.

## Examine budgets separately

```sh
python3 isolation_budget.py --quota 50 --demand 80
python3 isolation_budget.py --quota 100 --demand 80
python3 isolation_budget.py --memory-used 192 --memory-request 64
python3 isolation_budget.py --memory-used 192 --memory-request 80
python3 isolation_budget.py --self-test
```

The model uses period=100ms and one CPU. With quota50, demand80 gives served50/unmet30. Each call starts a new period with replenished budget; no backlog is carried. Quota is a ceiling, not minimum service or a request-deadline guarantee.

Model memory capacity is256MiB. 192+64 reaches the boundary exactly and is accepted. 192+80 is denied, leaving used192. Real Linux memory.max does not atomically deny every request in this way: reclaim/OOM/accounting paths differ. The result is not an actual OOM trace.

The self-test has 69 meaningful checks: namespace identity distinctions; four access outcomes; demand conservation and budget limits across16 quota/demand pairs; replenishment; memory boundaries; invalid input rejection. Failure exits nonzero.

## Reasoning questions

1. Does quota100 authorize viewer writes?
2. Why can the editor not write the read-only config?
3. Does local PID1 create access rights across scopes?
4. Does a memory limit prove confidentiality?
5. Is HIDDEN proof of actual Linux kernel isolation?
6. Is this a hypervisor-vulnerability test?

<details><summary>Answer first; then open the key</summary>

1. No: CPU quota and role/action authority are separate.
2. Even with a sufficient role, the exposed mount mode excludes writing.
3. No: equal local names can belong to different objects/memberships.
4. No: resource policy concerns availability; access policy is separate.
5. No: it is a decision of the model's explicit allowlist/mappings.
6. No: the model runs no hypervisor or kernel and verifies no exploit resistance.

Access outcomes: ALLOWED, DENIED_ROLE, DENIED_READ_ONLY, HIDDEN. quota100/demand80 gives served80/unmet0; quota50 gives served50/unmet30.
</details>

References: [Linux namespaces](https://man7.org/linux/man-pages/man7/namespaces.7.html), [cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html), [Docker security](https://docs.docker.com/engine/security/), [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/). The model does not emulate these interfaces; it teaches the view/permission/budget distinction.
