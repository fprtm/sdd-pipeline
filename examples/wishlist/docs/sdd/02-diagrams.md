# Diagrams — Wishlist + Shareable Link

> **Plain-language summary:** Pictures of how the wishlist works: who talks to
> what (context), how data moves across security boundaries (DFD — feeds the
> threat model), the step-by-step of the main journeys (sequences), the data
> shape (ERD), and the life of a share link (state).

## 1. Context diagram
```mermaid
flowchart LR
  shopper([Shopper - logged in])
  viewer([Viewer - anonymous])
  sys[[Wishlist feature]]
  auth[(Auth / Session service)]
  catalog[(Product catalog)]
  shopper --> sys
  viewer --> sys
  sys --> auth
  sys --> catalog
  %% covers REQ-001, REQ-005, REQ-007
```

## 2. Data-flow diagram (DFD) with trust boundaries
```mermaid
flowchart LR
  shopper([Shopper]):::ext
  viewer([Viewer]):::ext
  subgraph TB_public["TB: public internet"]
    shopper
    viewer
  end
  subgraph TB_app["TB: application (authn'd + public routes)"]
    api[/API/]
    wl[[Wishlist service]]
    share[[Share service]]
  end
  subgraph TB_data["TB: data zone"]
    db[(Wishlist DB)]
  end
  shopper -->|"session cookie (secret) + productId"| api
  viewer -->|"share token (secret)"| api
  api --> wl
  api --> share
  wl -->|"read/write items (owner-scoped)"| db
  share -->|"mint/lookup/revoke token"| db
  classDef ext fill:#eee,stroke:#999;
  %% covers REQ-001, REQ-005, REQ-006, REQ-007, REQ-NF-002
  %% Boundary crossings to threat-model: shopper->api (authn), viewer->api (token), *->db
```

## 3. Sequence — Save a product (REQ-001, FSD-001)
```mermaid
sequenceDiagram
  actor S as Shopper
  participant FE as Frontend
  participant API as API
  participant WL as Wishlist svc
  participant DB as DB
  S->>FE: tap Save on product P
  FE->>API: POST /wishlist/items {productId:P} (+session)
  API->>API: authenticate session
  API->>WL: addItem(userId, P)
  WL->>DB: upsert (userId,P) unique
  DB-->>WL: ok (created | already-exists)
  WL-->>API: saved
  API-->>FE: 200 {state:"saved"}
  FE-->>S: control shows "Saved"
  %% covers REQ-001, REQ-004 -> FSD-001, FSD-004
```

## 4. Sequence — View a shared wishlist (REQ-007, FSD-011)
```mermaid
sequenceDiagram
  actor V as Viewer (anon)
  participant FE as Frontend
  participant API as API
  participant SH as Share svc
  participant DB as DB
  V->>FE: open /s/{token}
  FE->>API: GET /shared/{token}
  API->>SH: resolve(token)
  SH->>DB: find active share by token
  alt token active
    DB-->>SH: share -> ownerId
    SH->>DB: read owner's items (read-only)
    DB-->>SH: items
    SH-->>API: items (no owner PII)
    API-->>FE: 200 read-only list
    FE-->>V: shows wishlist, no edit controls
  else revoked / unknown
    DB-->>SH: none
    SH-->>API: not found
    API-->>FE: 404 (generic)
    FE-->>V: "This list isn't available"
  end
  %% covers REQ-006, REQ-007 -> FSD-011, FSD-012
```

## 5. ERD
```mermaid
erDiagram
  USER ||--o{ WISHLIST_ITEM : saves
  PRODUCT ||--o{ WISHLIST_ITEM : referenced_by
  USER ||--o{ SHARE_LINK : owns
  WISHLIST_ITEM {
    uuid id PK
    uuid user_id FK
    string product_id FK
    timestamptz created_at
  }
  SHARE_LINK {
    uuid id PK
    uuid user_id FK
    string token_hash "hash of opaque token"
    string status "active | revoked"
    timestamptz created_at
    timestamptz revoked_at
  }
```

## 6. State — Share link lifecycle
```mermaid
stateDiagram-v2
  [*] --> active: create (mint token)
  active --> revoked: revoke
  revoked --> [*]
  note right of revoked
    terminal & irreversible;
    a new link needs a new token
  end note
  %% covers REQ-005, REQ-006 -> FSD-009, FSD-010
```
