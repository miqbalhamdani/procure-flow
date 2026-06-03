# Company Settings / Client Custom Logic

Use `workspace_settings` table for all client-specific business rules and feature toggles.

## Table Structure

```sql
workspace_settings
- id
- workspace_id
- module
- key
- value
- description
- created_at
- updated_at
- updated_by
```

## Rules

- NEVER hardcode client-specific logic.
- ALWAYS read configuration from `workspace_settings`.
- Settings are scoped by `workspace_id`.
- Settings must be checked in the service layer.
- UI must not contain business rule checks.
- Use sensible defaults when a setting does not exist.

## Examples

### Skip Purchase Order Approval

```text
module: purchase-order
key: skip_approval
value: true
```

Behavior:

```ts
if (isSettingEnabled(workspaceId, "purchase-order", "skip_approval")) {
  status = "approved";
}
```

### Require Transit Remark

```text
module: shipment
key: require_transit_remark
value: true
```

Behavior:

```ts
if (isSettingEnabled(workspaceId, "shipment", "require_transit_remark")) {
  // validate remark
}
```

## Required Pattern

Create a centralized service:

```ts
isSettingEnabled(workspaceId, module, key)
```

All modules must use this service.

## Forbidden

- Hardcoded company IDs
- Hardcoded client names
- Custom if/else per client
- Business rules inside UI components

Always implement client customization through `workspace_settings`.