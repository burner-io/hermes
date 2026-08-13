# Hermes contract rules

## 1. Hermes owns the vocabulary

`Profile`, `Skill`, `Session`, `Toolset`, `MCP server`, Kanban `Task`, `Run`, `Worker`, `Board`, `Event`, and `Diagnostic` retain their Hermes meanings.

The SDK must not rename them into application-domain concepts merely for UI convenience.

## 2. Native names are preserved

Raw/native payload fields keep Hermes spelling and casing, including `snake_case` such as `skill_count`, `reasoning_effort`, `workspace_kind`, `last_heartbeat_at`, and `project_id`.

## 3. Reads are forward-compatible

Hermes evolves quickly. Read-side contracts therefore generally accept additive fields while strongly typing fields verified in Hermes sources.

## 4. Writes are conservative

Write inputs mirror verified Hermes Pydantic models or official Hermes client calls. A field is not added because it would be convenient for a consuming app.

## 5. Scope is native, not normalized

`profile?: string` is exposed only where Hermes actually accepts a profile scope. The SDK must not make every operation look uniformly profile-scoped.

## 6. Optional surfaces are not new domain concepts

The client may report which native surfaces are reachable. Reachability is SDK transport metadata, not an entity persisted into Hermes.

Kanban is plugin-dependent. Native Projects are version-dependent. A client must probe the connected instance.

## 7. No application workflow model

A separate application/workflow layer may compose Hermes calls with external APIs or services. Such workflow definitions are not Hermes contracts unless Hermes itself later defines an equivalent native resource.

## 8. No application references/specs/stories

If an application maps its own resources into prompts, files, MCP configuration, Kanban attachments, or another Hermes-native input, that mapping belongs above this package.

## 9. Internal Hermes mechanisms are not automatically public SDK surfaces

A mechanism being present somewhere in Hermes source does not automatically justify a root client namespace. V0.3 requires a verified native management/runtime surface or explicit transport contract. This is why an internal concept is not exposed merely because its name appears in source.

## 10. Transport uncertainty stays explicit

Multipart bodies, binary downloads, and evolving WebSocket frames are not reverse-engineered into false precision. They stay opaque until the V0.3 transport implementation validates their wire shape.
